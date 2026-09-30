import mongoose from "mongoose";
import type { AuthenticatedUser } from "@resolveai/shared";
import { NotificationModel } from "../models/Notification.js";

function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/* ------------------------------------------------------------------ */
/*  In-memory fallback for dev mode without MongoDB                    */
/* ------------------------------------------------------------------ */

interface DevNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  relatedTicketId?: string;
  relatedSessionId?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const devNotifications: DevNotification[] = [];
let devNotifId = 1;

/* ------------------------------------------------------------------ */
/*  Create notification                                               */
/* ------------------------------------------------------------------ */

export async function createNotification(input: {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedTicketId?: string;
  relatedSessionId?: string;
  metadata?: Record<string, unknown>;
}) {
  if (!isDatabaseConnected()) {
    const now = new Date().toISOString();
    const notif: DevNotification = {
      id: `notif-${devNotifId++}`,
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      read: false,
      relatedTicketId: input.relatedTicketId,
      relatedSessionId: input.relatedSessionId,
      metadata: input.metadata || {},
      createdAt: now,
      updatedAt: now
    };
    devNotifications.push(notif);
    return notif;
  }

  const notif = await NotificationModel.create({
    userId: new mongoose.Types.ObjectId(input.userId),
    type: input.type,
    title: input.title,
    message: input.message,
    relatedTicketId: input.relatedTicketId
      ? new mongoose.Types.ObjectId(input.relatedTicketId)
      : undefined,
    relatedSessionId: input.relatedSessionId
      ? new mongoose.Types.ObjectId(input.relatedSessionId)
      : undefined,
    metadata: input.metadata || {}
  });

  return toNotifResponse(notif);
}

/* ------------------------------------------------------------------ */
/*  List notifications for user                                       */
/* ------------------------------------------------------------------ */

export async function listNotifications(
  user: AuthenticatedUser,
  query: { unreadOnly?: boolean; limit?: number } = {}
) {
  const limit = Math.min(50, query.limit || 30);

  if (!isDatabaseConnected()) {
    let notifs = devNotifications.filter((n) => n.userId === user.id);
    if (query.unreadOnly) notifs = notifs.filter((n) => !n.read);
    return notifs
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  const filter: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(user.id)
  };
  if (query.unreadOnly) filter.read = false;

  const notifs = await NotificationModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return notifs.map(toNotifResponse);
}

/* ------------------------------------------------------------------ */
/*  Get unread count                                                  */
/* ------------------------------------------------------------------ */

export async function getUnreadCount(user: AuthenticatedUser) {
  if (!isDatabaseConnected()) {
    return devNotifications.filter((n) => n.userId === user.id && !n.read).length;
  }

  return NotificationModel.countDocuments({
    userId: new mongoose.Types.ObjectId(user.id),
    read: false
  });
}

/* ------------------------------------------------------------------ */
/*  Mark notification as read                                         */
/* ------------------------------------------------------------------ */

export async function markAsRead(user: AuthenticatedUser, notificationId: string) {
  if (!isDatabaseConnected()) {
    const notif = devNotifications.find((n) => n.id === notificationId && n.userId === user.id);
    if (notif) notif.read = true;
    return { success: true };
  }

  await NotificationModel.updateOne(
    { _id: notificationId, userId: new mongoose.Types.ObjectId(user.id) },
    { $set: { read: true } }
  );
  return { success: true };
}

/* ------------------------------------------------------------------ */
/*  Mark all as read                                                  */
/* ------------------------------------------------------------------ */

export async function markAllAsRead(user: AuthenticatedUser) {
  if (!isDatabaseConnected()) {
    devNotifications
      .filter((n) => n.userId === user.id)
      .forEach((n) => (n.read = true));
    return { success: true };
  }

  await NotificationModel.updateMany(
    { userId: new mongoose.Types.ObjectId(user.id), read: false },
    { $set: { read: true } }
  );
  return { success: true };
}

/* ------------------------------------------------------------------ */
/*  Response mapper                                                   */
/* ------------------------------------------------------------------ */

function toNotifResponse(notif: any) {
  return {
    id: (notif._id || notif.id).toString(),
    userId: notif.userId.toString(),
    type: notif.type,
    title: notif.title,
    message: notif.message,
    read: notif.read,
    relatedTicketId: notif.relatedTicketId?.toString() || null,
    relatedSessionId: notif.relatedSessionId?.toString() || null,
    metadata: notif.metadata || {},
    createdAt: notif.createdAt,
    updatedAt: notif.updatedAt
  };
}
