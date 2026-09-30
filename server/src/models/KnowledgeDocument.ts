import mongoose, { Schema, type InferSchemaType } from "mongoose";

const processingStatuses = ["PROCESSING", "READY", "FAILED", "ARCHIVED"] as const;
const approvalStatuses = ["PENDING", "APPROVED", "REJECTED"] as const;

const knowledgeDocumentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    category: { type: String, required: true, lowercase: true, trim: true, index: true },
    department: { type: String, trim: true, default: "General" },
    version: { type: String, trim: true, default: "v1.0" },
    content: { type: String, required: true },
    chunkCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: processingStatuses,
      default: "READY",
      required: true,
      index: true
    },
    approvalStatus: {
      type: String,
      enum: approvalStatuses,
      default: "APPROVED",
      required: true,
      index: true
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdByName: { type: String, default: "System Admin" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedByName: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

knowledgeDocumentSchema.index({ category: 1, approvalStatus: 1, status: 1 });

export type KnowledgeDocumentRecord = InferSchemaType<typeof knowledgeDocumentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const KnowledgeDocumentModel = mongoose.model("KnowledgeDocument", knowledgeDocumentSchema);
