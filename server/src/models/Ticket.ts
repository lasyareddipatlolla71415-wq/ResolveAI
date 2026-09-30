import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { Priority, Severity, TicketStatus } from "@resolveai/shared";

const severities: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const priorities: Priority[] = ["P4", "P3", "P2", "P1"];
const statuses: TicketStatus[] = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "RESOLVED",
  "USER_CONFIRMATION",
  "CLOSED",
  "REOPENED",
  "ESCALATED"
];

const technicianActionSchema = new Schema(
  {
    action: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    outcome: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PARTIAL", "INVESTIGATING"],
      default: "SUCCESS"
    },
    performedBy: { type: Schema.Types.ObjectId, ref: "User" },
    performedByName: { type: String },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const ticketSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, lowercase: true, index: true },
    severity: { type: String, enum: severities, default: "LOW", required: true },
    priority: { type: String, enum: priorities, default: "P4", required: true },
    status: { type: String, enum: statuses, default: "OPEN", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    technicianId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    aiConfidence: { type: Number, min: 0, max: 1 },
    attemptedActions: { type: [String], default: [] },
    failedActions: { type: [String], default: [] },
    ragSources: { type: [String], default: [] },
    escalationReason: { type: String, trim: true },
    assignedAt: { type: Date },
    resolvedAt: { type: Date },
    closedAt: { type: Date },
    resolution: {
      summary: { type: String, trim: true },
      rootCause: { type: String, trim: true },
      actionsTaken: { type: [String], default: [] },
      kbRecommendation: { type: String, trim: true },
      resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
      resolvedByName: { type: String },
      resolvedAt: { type: Date }
    },
    technicianActions: { type: [technicianActionSchema], default: [] }
  },
  { timestamps: true }
);

export type TicketDocument = InferSchemaType<typeof ticketSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TicketModel = mongoose.model("Ticket", ticketSchema);
