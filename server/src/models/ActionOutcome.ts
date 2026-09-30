import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { ActionOutcomeResult } from "@resolveai/shared";

const actionOutcomeSchema = new Schema(
  {
    problemCategory: { type: String, required: true, trim: true, lowercase: true, index: true },
    problemType: { type: String, required: true, trim: true },
    actionId: { type: String, required: true, index: true },
    actionName: { type: String, required: true },
    context: { type: Schema.Types.Mixed, default: {} },
    result: {
      type: String,
      enum: ["SUCCESS", "FAILURE", "SKIPPED", "UNKNOWN"],
      default: "SUCCESS",
      required: true
    },
    resolutionTimeSeconds: { type: Number, default: 0 },
    aiConfidence: { type: Number, min: 0, max: 1, default: 0.8 },
    userFeedback: { type: Number },
    technicianId: { type: Schema.Types.ObjectId, ref: "User" },
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket" },
    rootCause: { type: String, trim: true },
    kbRecommendation: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

actionOutcomeSchema.index({ problemCategory: 1, actionId: 1, result: 1 });

export type ActionOutcomeDocument = InferSchemaType<typeof actionOutcomeSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const ActionOutcomeModel = mongoose.model("ActionOutcome", actionOutcomeSchema);
