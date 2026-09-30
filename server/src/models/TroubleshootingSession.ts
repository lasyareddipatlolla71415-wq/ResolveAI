import mongoose, { Schema, type InferSchemaType } from "mongoose";

const stepSchema = new Schema(
  {
    stepNumber: { type: Number, required: true },
    actionId: { type: String, required: true },
    actionName: { type: String, required: true },
    description: { type: String, required: true },
    reason: { type: String },
    expectedOutcome: { type: String },
    riskLevel: { type: String, enum: ["low", "medium", "high"], default: "low" },
    outcome: { type: String, enum: ["PENDING", "SUCCESS", "FAILURE", "SKIPPED"], default: "PENDING" },
    userFeedback: { type: String },
    aiConfidence: { type: Number, min: 0, max: 1 },
    ragSourcesUsed: { type: [String], default: [] },
    completedAt: { type: Date }
  },
  { _id: true, timestamps: false }
);

const sessionStatuses = ["ACTIVE", "RESOLVED", "ESCALATED", "ABANDONED"] as const;
const categories = ["network", "wi-fi", "vpn", "software", "hardware", "account", "email", "system", "other"] as const;

const troubleshootingSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    conversationId: { type: String, index: true },
    problemDescription: { type: String, required: true, trim: true },
    category: { type: String, enum: categories, default: "other", index: true },
    severity: { type: String, enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "LOW" },
    status: { type: String, enum: sessionStatuses, default: "ACTIVE", required: true, index: true },
    steps: { type: [stepSchema], default: [] },
    currentStepNumber: { type: Number, default: 0 },
    totalStepsAttempted: { type: Number, default: 0 },
    aiConfidence: { type: Number, min: 0, max: 1, default: 0.7 },
    escalationReason: { type: String },
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket" },
    resolutionSummary: { type: String },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

troubleshootingSessionSchema.index({ userId: 1, status: 1 });
troubleshootingSessionSchema.index({ userId: 1, updatedAt: -1 });

export type TroubleshootingSessionDocument = InferSchemaType<typeof troubleshootingSessionSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const TroubleshootingSessionModel = mongoose.model("TroubleshootingSession", troubleshootingSessionSchema);
