import mongoose from "mongoose";
import type { AuthenticatedUser, Severity } from "@resolveai/shared";
import { TroubleshootingSessionModel } from "../models/TroubleshootingSession.js";
import { TicketModel } from "../models/Ticket.js";
import { NotificationModel } from "../models/Notification.js";
import { AdaptiveTroubleshootingEngine } from "./troubleshooting/AdaptiveTroubleshootingEngine.js";
import { defaultScoringWeights } from "../config/scoring.js";
import { createRagService } from "./rag/RagService.js";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface StartSessionInput {
  problemDescription: string;
  category?: string;
  severity?: Severity;
}

export interface StepOutcomeInput {
  outcome: "SUCCESS" | "FAILURE" | "SKIPPED";
  userFeedback?: string;
}

/* ------------------------------------------------------------------ */
/*  In-memory fallback for dev mode without MongoDB                    */
/* ------------------------------------------------------------------ */

interface DevSession {
  id: string;
  userId: string;
  conversationId?: string;
  problemDescription: string;
  category: string;
  severity: string;
  status: string;
  steps: any[];
  currentStepNumber: number;
  totalStepsAttempted: number;
  aiConfidence: number;
  escalationReason?: string;
  ticketId?: string;
  resolutionSummary?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const devSessions = new Map<string, DevSession>();
let devIdCounter = 1;

function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

function normalizeCategory(cat?: string): string {
  if (!cat) return "other";
  const lower = cat.toLowerCase().trim();
  if (lower.includes("wi-fi") || lower.includes("wifi")) return "wi-fi";
  const valid = ["network", "wi-fi", "vpn", "software", "hardware", "account", "email", "system"];
  return valid.includes(lower) ? lower : "other";
}

/* ------------------------------------------------------------------ */
/*  Start a troubleshooting session                                   */
/* ------------------------------------------------------------------ */

export async function startSession(user: AuthenticatedUser, input: StartSessionInput) {
  const category = normalizeCategory(input.category);
  const severity = input.severity ?? "LOW";

  // Get the first troubleshooting action immediately
  const engine = new AdaptiveTroubleshootingEngine(defaultScoringWeights);
  const ragService = createRagService();
  const ragSources = await ragService.retrieve(input.problemDescription, {
    category,
    limit: 5
  });

  const decision = engine.selectNextAction({
    problemDescription: input.problemDescription,
    category,
    context: {},
    previousActions: [],
    failedActions: [],
    ragResults: ragSources.map((s) => ({
      actionId: typeof s.metadata.actionId === "string" ? s.metadata.actionId : undefined,
      relevance: s.relevance
    })),
    historicalOutcomes: [],
    aiConfidence: 0.7,
    severity
  });

  const initialStep = decision.action
    ? {
        stepNumber: 1,
        actionId: decision.action.actionId,
        actionName: decision.action.name,
        description: decision.action.description,
        reason: decision.reason,
        expectedOutcome: decision.action.expectedOutcome,
        riskLevel: decision.action.riskLevel,
        outcome: "PENDING" as const,
        aiConfidence: decision.confidence,
        ragSourcesUsed: ragSources.map((s) => s.title || s.chunkId)
      }
    : null;

  if (!isDatabaseConnected()) {
    const now = new Date().toISOString();
    const session: DevSession = {
      id: `session-${devIdCounter++}`,
      userId: user.id,
      problemDescription: input.problemDescription,
      category,
      severity,
      status: decision.shouldEscalate ? "ESCALATED" : "ACTIVE",
      steps: initialStep ? [initialStep] : [],
      currentStepNumber: initialStep ? 1 : 0,
      totalStepsAttempted: 0,
      aiConfidence: decision.confidence,
      escalationReason: decision.escalationReason,
      createdAt: now,
      updatedAt: now
    };
    devSessions.set(session.id, session);

    // If immediate escalation, auto-create a ticket
    if (decision.shouldEscalate) {
      session.ticketId = `ticket-auto-${Date.now()}`;
    }

    return { session, decision };
  }

  const session = await TroubleshootingSessionModel.create({
    userId: new mongoose.Types.ObjectId(user.id),
    problemDescription: input.problemDescription,
    category,
    severity,
    status: decision.shouldEscalate ? "ESCALATED" : "ACTIVE",
    steps: initialStep ? [initialStep] : [],
    currentStepNumber: initialStep ? 1 : 0,
    aiConfidence: decision.confidence,
    escalationReason: decision.escalationReason
  });

  // If immediate escalation, auto-create ticket
  if (decision.shouldEscalate) {
    const ticket = await TicketModel.create({
      title: input.problemDescription.slice(0, 180),
      description: `Auto-escalated: ${decision.escalationReason}\n\nOriginal problem: ${input.problemDescription}`,
      category,
      severity,
      priority: severity === "CRITICAL" ? "P1" : severity === "HIGH" ? "P2" : "P3",
      status: "OPEN",
      userId: new mongoose.Types.ObjectId(user.id),
      aiConfidence: decision.confidence,
      escalationReason: decision.escalationReason
    });
    session.ticketId = ticket._id;
    await session.save();

    // Create notification
    await NotificationModel.create({
      userId: new mongoose.Types.ObjectId(user.id),
      type: "TICKET_CREATED",
      title: "Ticket Created",
      message: `Your issue has been escalated to our support team. Ticket #${ticket._id.toString().slice(-6).toUpperCase()}`,
      relatedTicketId: ticket._id,
      relatedSessionId: session._id
    });
  }

  return { session: toSessionResponse(session), decision };
}

/* ------------------------------------------------------------------ */
/*  Submit step outcome                                               */
/* ------------------------------------------------------------------ */

export async function submitStepOutcome(
  user: AuthenticatedUser,
  sessionId: string,
  stepNumber: number,
  input: StepOutcomeInput
) {
  if (!isDatabaseConnected()) {
    const session = devSessions.get(sessionId);
    if (!session || session.userId !== user.id) throw new Error("Session not found");

    const step = session.steps.find((s: any) => s.stepNumber === stepNumber);
    if (!step) throw new Error("Step not found");

    step.outcome = input.outcome;
    step.userFeedback = input.userFeedback;
    step.completedAt = new Date().toISOString();
    session.totalStepsAttempted++;
    session.updatedAt = new Date().toISOString();

    if (input.outcome === "SUCCESS") {
      session.status = "RESOLVED";
      session.resolutionSummary = `Resolved at step ${stepNumber}: ${step.actionName}`;
      session.resolvedAt = new Date().toISOString();
      return { session, nextAction: null, resolved: true };
    }

    // Get next action
    const failedActions = session.steps
      .filter((s: any) => s.outcome === "FAILURE")
      .map((s: any) => s.actionId);

    const engine = new AdaptiveTroubleshootingEngine(defaultScoringWeights);
    const ragService = createRagService();
    const ragSources = await ragService.retrieve(session.problemDescription, {
      category: session.category,
      limit: 5
    });

    const decision = engine.selectNextAction({
      problemDescription: session.problemDescription,
      category: session.category,
      context: {},
      previousActions: session.steps.map((s: any) => s.actionId),
      failedActions,
      ragResults: ragSources.map((s) => ({
        actionId: typeof s.metadata.actionId === "string" ? s.metadata.actionId : undefined,
        relevance: s.relevance
      })),
      historicalOutcomes: [],
      aiConfidence: session.aiConfidence * 0.9,
      severity: session.severity as Severity
    });

    session.aiConfidence = decision.confidence;

    if (decision.shouldEscalate || !decision.action) {
      session.status = "ESCALATED";
      session.escalationReason = decision.escalationReason || "No more actions available";
      session.ticketId = `ticket-auto-${Date.now()}`;
      return { session, nextAction: null, escalated: true, escalationReason: session.escalationReason, ticketId: session.ticketId };
    }

    const nextStep = {
      stepNumber: session.steps.length + 1,
      actionId: decision.action.actionId,
      actionName: decision.action.name,
      description: decision.action.description,
      reason: decision.reason,
      expectedOutcome: decision.action.expectedOutcome,
      riskLevel: decision.action.riskLevel,
      outcome: "PENDING",
      aiConfidence: decision.confidence,
      ragSourcesUsed: ragSources.map((s) => s.title || s.chunkId)
    };
    session.steps.push(nextStep);
    session.currentStepNumber = nextStep.stepNumber;

    return { session, nextAction: decision, resolved: false };
  }

  // MongoDB path
  const session = await TroubleshootingSessionModel.findOne({
    _id: sessionId,
    userId: new mongoose.Types.ObjectId(user.id)
  });

  if (!session) throw new Error("Session not found");

  const step = (session.steps as any[]).find((s: any) => s.stepNumber === stepNumber);
  if (!step) throw new Error("Step not found");

  step.outcome = input.outcome;
  step.userFeedback = input.userFeedback;
  step.completedAt = new Date();
  session.totalStepsAttempted++;

  if (input.outcome === "SUCCESS") {
    session.status = "RESOLVED";
    session.resolutionSummary = `Resolved at step ${stepNumber}: ${step.actionName}`;
    session.resolvedAt = new Date();
    await session.save();

    await NotificationModel.create({
      userId: session.userId,
      type: "SESSION_RESOLVED",
      title: "Problem Resolved",
      message: `Your issue "${session.problemDescription.slice(0, 60)}..." was resolved successfully.`,
      relatedSessionId: session._id
    });

    return { session: toSessionResponse(session), nextAction: null, resolved: true };
  }

  // Get next action adaptively
  const failedActions = (session.steps as any[])
    .filter((s: any) => s.outcome === "FAILURE")
    .map((s: any) => s.actionId);

  const engine = new AdaptiveTroubleshootingEngine(defaultScoringWeights);
  const ragService = createRagService();
  const ragSources = await ragService.retrieve(session.problemDescription, {
    category: session.category,
    limit: 5
  });

  const decision = engine.selectNextAction({
    problemDescription: session.problemDescription,
    category: session.category,
    context: {},
    previousActions: (session.steps as any[]).map((s: any) => s.actionId),
    failedActions,
    ragResults: ragSources.map((s) => ({
      actionId: typeof s.metadata.actionId === "string" ? s.metadata.actionId : undefined,
      relevance: s.relevance
    })),
    historicalOutcomes: [],
    aiConfidence: session.aiConfidence * 0.9,
    severity: session.severity as Severity
  });

  session.aiConfidence = decision.confidence;

  if (decision.shouldEscalate || !decision.action) {
    session.status = "ESCALATED";
    session.escalationReason = decision.escalationReason || "No more actions available";

    // Auto-create ticket
    const ticket = await TicketModel.create({
      title: session.problemDescription.slice(0, 180),
      description: `Auto-escalated after ${session.totalStepsAttempted} troubleshooting steps.\nReason: ${session.escalationReason}\n\nOriginal problem: ${session.problemDescription}\n\nActions attempted:\n${(session.steps as any[]).map((s: any) => `- ${s.actionName}: ${s.outcome}`).join("\n")}`,
      category: session.category,
      severity: session.severity,
      priority: session.severity === "CRITICAL" ? "P1" : session.severity === "HIGH" ? "P2" : "P3",
      status: "OPEN",
      userId: session.userId,
      aiConfidence: decision.confidence,
      attemptedActions: (session.steps as any[]).map((s: any) => s.actionName),
      failedActions: (session.steps as any[]).filter((s: any) => s.outcome === "FAILURE").map((s: any) => s.actionName),
      ragSources: ragSources.map((s) => s.title || s.chunkId),
      escalationReason: session.escalationReason
    });

    session.ticketId = ticket._id;
    await session.save();

    await NotificationModel.create({
      userId: session.userId,
      type: "SESSION_ESCALATED",
      title: "Issue Escalated",
      message: `Your issue has been escalated to our support team. Ticket #${ticket._id.toString().slice(-6).toUpperCase()}`,
      relatedTicketId: ticket._id,
      relatedSessionId: session._id
    });

    return {
      session: toSessionResponse(session),
      nextAction: null,
      escalated: true,
      escalationReason: session.escalationReason,
      ticketId: ticket._id.toString()
    };
  }

  const nextStep = {
    stepNumber: (session.steps as any[]).length + 1,
    actionId: decision.action.actionId,
    actionName: decision.action.name,
    description: decision.action.description,
    reason: decision.reason,
    expectedOutcome: decision.action.expectedOutcome,
    riskLevel: decision.action.riskLevel,
    outcome: "PENDING",
    aiConfidence: decision.confidence,
    ragSourcesUsed: ragSources.map((s) => s.title || s.chunkId)
  };

  (session.steps as any[]).push(nextStep);
  session.currentStepNumber = nextStep.stepNumber;
  await session.save();

  return { session: toSessionResponse(session), nextAction: decision, resolved: false };
}

/* ------------------------------------------------------------------ */
/*  Get session details                                               */
/* ------------------------------------------------------------------ */

export async function getSession(user: AuthenticatedUser, sessionId: string) {
  if (!isDatabaseConnected()) {
    const session = devSessions.get(sessionId);
    if (!session || session.userId !== user.id) return null;
    return session;
  }

  const session = await TroubleshootingSessionModel.findOne({
    _id: sessionId,
    userId: new mongoose.Types.ObjectId(user.id)
  }).lean();

  return session ? toSessionResponse(session) : null;
}

/* ------------------------------------------------------------------ */
/*  List sessions for user                                            */
/* ------------------------------------------------------------------ */

export async function listSessions(user: AuthenticatedUser, query: { status?: string } = {}) {
  if (!isDatabaseConnected()) {
    let sessions = [...devSessions.values()].filter((s) => s.userId === user.id);
    if (query.status) sessions = sessions.filter((s) => s.status === query.status);
    return sessions.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  const filter: Record<string, unknown> = {
    userId: new mongoose.Types.ObjectId(user.id)
  };
  if (query.status) filter.status = query.status;

  const sessions = await TroubleshootingSessionModel.find(filter)
    .sort({ updatedAt: -1 })
    .lean();

  return sessions.map(toSessionResponse);
}

/* ------------------------------------------------------------------ */
/*  Dashboard stats                                                   */
/* ------------------------------------------------------------------ */

export async function getUserDashboardStats(user: AuthenticatedUser) {
  if (!isDatabaseConnected()) {
    const sessions = [...devSessions.values()].filter((s) => s.userId === user.id);
    return {
      activeSessions: sessions.filter((s) => s.status === "ACTIVE").length,
      resolvedSessions: sessions.filter((s) => s.status === "RESOLVED").length,
      escalatedSessions: sessions.filter((s) => s.status === "ESCALATED").length,
      openTickets: 0,
      pendingTickets: 0,
      totalTickets: 0
    };
  }

  const userId = new mongoose.Types.ObjectId(user.id);

  const [sessionStats, ticketStats] = await Promise.all([
    TroubleshootingSessionModel.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]),
    TicketModel.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ])
  ]);

  const sessionMap = Object.fromEntries(sessionStats.map((s) => [s._id, s.count]));
  const ticketMap = Object.fromEntries(ticketStats.map((t) => [t._id, t.count]));

  return {
    activeSessions: sessionMap["ACTIVE"] || 0,
    resolvedSessions: sessionMap["RESOLVED"] || 0,
    escalatedSessions: sessionMap["ESCALATED"] || 0,
    openTickets: (ticketMap["OPEN"] || 0) + (ticketMap["ASSIGNED"] || 0) + (ticketMap["IN_PROGRESS"] || 0),
    pendingTickets: ticketMap["USER_CONFIRMATION"] || 0,
    totalTickets: ticketStats.reduce((sum, t) => sum + t.count, 0)
  };
}

/* ------------------------------------------------------------------ */
/*  Response mappers                                                   */
/* ------------------------------------------------------------------ */

function toSessionResponse(session: any) {
  return {
    id: (session._id || session.id).toString(),
    userId: session.userId.toString(),
    conversationId: session.conversationId || null,
    problemDescription: session.problemDescription,
    category: session.category,
    severity: session.severity,
    status: session.status,
    steps: (session.steps || []).map((step: any) => ({
      stepNumber: step.stepNumber,
      actionId: step.actionId,
      actionName: step.actionName,
      description: step.description,
      reason: step.reason,
      expectedOutcome: step.expectedOutcome,
      riskLevel: step.riskLevel,
      outcome: step.outcome,
      userFeedback: step.userFeedback,
      aiConfidence: step.aiConfidence,
      ragSourcesUsed: step.ragSourcesUsed || [],
      completedAt: step.completedAt || null
    })),
    currentStepNumber: session.currentStepNumber,
    totalStepsAttempted: session.totalStepsAttempted,
    aiConfidence: session.aiConfidence,
    escalationReason: session.escalationReason || null,
    ticketId: session.ticketId?.toString() || null,
    resolutionSummary: session.resolutionSummary || null,
    resolvedAt: session.resolvedAt || null,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  };
}
