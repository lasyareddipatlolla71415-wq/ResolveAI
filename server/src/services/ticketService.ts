import mongoose from "mongoose";
import type { AuthenticatedUser, TicketStatus, Severity, Priority } from "@resolveai/shared";
import { TicketModel } from "../models/Ticket.js";
import { TicketReplyModel } from "../models/TicketReply.js";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CreateTicketInput {
  title: string;
  description: string;
  category: string;
  severity?: Severity;
  priority?: Priority;
}

export interface UpdateTicketInput {
  status?: TicketStatus;
  severity?: Severity;
  priority?: Priority;
  technicianId?: string;
}

export interface CreateReplyInput {
  message: string;
}

export interface TicketListQuery {
  status?: TicketStatus;
  page?: number;
  limit?: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

function ensureDatabase(): void {
  if (!isDatabaseConnected()) {
    throw new Error("Database is not connected — ticket operations require MongoDB");
  }
}

/** Returns true if the user's role is STAFF, TECHNICIAN, or ADMIN */
function isStaffOrAdmin(user: AuthenticatedUser): boolean {
  return user.role === "STAFF" || user.role === "TECHNICIAN" || user.role === "ADMIN";
}

/* ------------------------------------------------------------------ */
/*  CRUD: Tickets                                                      */
/* ------------------------------------------------------------------ */

/**
 * Create a ticket. Only the authenticated user's id is used as `userId`.
 */
export async function createTicket(user: AuthenticatedUser, input: CreateTicketInput) {
  ensureDatabase();

  const ticket = await TicketModel.create({
    title: input.title,
    description: input.description,
    category: input.category,
    severity: input.severity ?? "LOW",
    priority: input.priority ?? "P4",
    status: "OPEN",
    userId: new mongoose.Types.ObjectId(user.id)
  });

  return toTicketResponse(ticket);
}

/**
 * List tickets with role-based filtering:
 * - Users only see their own tickets
 * - Staff / Admin see all tickets
 */
export async function listTickets(user: AuthenticatedUser, query: TicketListQuery = {}) {
  ensureDatabase();

  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  // Users only see their own tickets
  if (!isStaffOrAdmin(user)) {
    filter.userId = new mongoose.Types.ObjectId(user.id);
  }

  if (query.status) {
    filter.status = query.status;
  }

  const [tickets, total] = await Promise.all([
    TicketModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TicketModel.countDocuments(filter)
  ]);

  return {
    tickets: tickets.map(toTicketResponse),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}

/**
 * Get a single ticket by ID.
 * Users can only view their own tickets; Staff/Admin can view any.
 */
export async function getTicketById(user: AuthenticatedUser, ticketId: string) {
  ensureDatabase();

  const ticket = await TicketModel.findById(ticketId).lean();

  if (!ticket) {
    return null;
  }

  // Ownership check for regular users
  if (!isStaffOrAdmin(user) && ticket.userId.toString() !== user.id) {
    return null;
  }

  // Fetch replies for this ticket
  const replies = await TicketReplyModel.find({ ticketId: ticket._id })
    .sort({ createdAt: 1 })
    .lean();

  return {
    ...toTicketResponse(ticket),
    replies: replies.map(toReplyResponse)
  };
}

/**
 * Update ticket fields (status, severity, priority, technicianId).
 * Only Staff/Admin can update tickets.
 */
export async function updateTicket(ticketId: string, input: UpdateTicketInput) {
  ensureDatabase();

  const updateFields: Record<string, unknown> = {};

  if (input.status) updateFields.status = input.status;
  if (input.severity) updateFields.severity = input.severity;
  if (input.priority) updateFields.priority = input.priority;
  if (input.technicianId) {
    updateFields.technicianId = new mongoose.Types.ObjectId(input.technicianId);
  }

  // Track resolution / closed timestamps
  if (input.status === "RESOLVED") {
    updateFields.resolvedAt = new Date();
  } else if (input.status === "CLOSED") {
    updateFields.closedAt = new Date();
  }

  const ticket = await TicketModel.findByIdAndUpdate(
    ticketId,
    { $set: updateFields },
    { new: true, runValidators: true }
  ).lean();

  if (!ticket) {
    return null;
  }

  return toTicketResponse(ticket);
}

/* ------------------------------------------------------------------ */
/*  CRUD: Replies                                                      */
/* ------------------------------------------------------------------ */

/**
 * Add a reply to a ticket thread.
 * Users can only reply to their own tickets; Staff/Admin can reply to any.
 */
export async function addReply(user: AuthenticatedUser, ticketId: string, input: CreateReplyInput) {
  ensureDatabase();

  const ticket = await TicketModel.findById(ticketId);

  if (!ticket) {
    return null;
  }

  // Ownership check for regular users
  if (!isStaffOrAdmin(user) && ticket.userId.toString() !== user.id) {
    return null;
  }

  const reply = await TicketReplyModel.create({
    ticketId: ticket._id,
    senderId: new mongoose.Types.ObjectId(user.id),
    senderRole: user.role,
    message: input.message
  });

  // Touch ticket updatedAt
  ticket.updatedAt = new Date() as any;
  await ticket.save();

  // Send notifications
  try {
    const { createNotification } = await import("./notificationService.js");
    if (!isStaffOrAdmin(user) && ticket.technicianId) {
      await createNotification({
        userId: ticket.technicianId.toString(),
        type: "USER_RESPONDED",
        title: "User Responded",
        message: `${user.name} responded to ticket #${ticket._id.toString().slice(-6).toUpperCase()}`,
        relatedTicketId: ticket._id.toString()
      });
    } else if (isStaffOrAdmin(user) && ticket.userId.toString() !== user.id) {
      await createNotification({
        userId: ticket.userId.toString(),
        type: "TICKET_UPDATED",
        title: "New Support Message",
        message: `Technician ${user.name} sent a message on ticket #${ticket._id.toString().slice(-6).toUpperCase()}`,
        relatedTicketId: ticket._id.toString()
      });
    }
  } catch (notifErr) {
    console.warn("Failed to dispatch reply notification:", notifErr);
  }

  return toReplyResponse(reply);
}

/**
 * List all replies for a ticket.
 */
export async function listReplies(user: AuthenticatedUser, ticketId: string) {
  ensureDatabase();

  const ticket = await TicketModel.findById(ticketId).lean();

  if (!ticket) {
    return null;
  }

  // Ownership check for regular users
  if (!isStaffOrAdmin(user) && ticket.userId.toString() !== user.id) {
    return null;
  }

  const replies = await TicketReplyModel.find({ ticketId: ticket._id })
    .sort({ createdAt: 1 })
    .lean();

  return replies.map(toReplyResponse);
}

/* ------------------------------------------------------------------ */
/*  Response mappers                                                   */
/* ------------------------------------------------------------------ */

function toTicketResponse(ticket: any) {
  return {
    id: ticket._id.toString(),
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    severity: ticket.severity,
    priority: ticket.priority,
    status: ticket.status,
    userId: ticket.userId.toString(),
    technicianId: ticket.technicianId?.toString() ?? null,
    aiConfidence: ticket.aiConfidence ?? null,
    attemptedActions: ticket.attemptedActions ?? [],
    failedActions: ticket.failedActions ?? [],
    ragSources: ticket.ragSources ?? [],
    escalationReason: ticket.escalationReason ?? null,
    resolvedAt: ticket.resolvedAt ?? null,
    closedAt: ticket.closedAt ?? null,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt
  };
}

function toReplyResponse(reply: any) {
  return {
    id: reply._id.toString(),
    ticketId: reply.ticketId.toString(),
    senderId: reply.senderId.toString(),
    senderRole: reply.senderRole,
    message: reply.message,
    createdAt: reply.createdAt,
    updatedAt: reply.updatedAt
  };
}
