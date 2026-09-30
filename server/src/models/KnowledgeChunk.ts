import mongoose, { Schema, type InferSchemaType } from "mongoose";

const knowledgeChunkSchema = new Schema(
  {
    documentId: { type: String, required: true, index: true },
    chunkId: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, lowercase: true, trim: true, index: true },
    content: { type: String, required: true },
    embedding: { type: [Number], required: true },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export type KnowledgeChunkDocument = InferSchemaType<typeof knowledgeChunkSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const KnowledgeChunkModel = mongoose.model("KnowledgeChunk", knowledgeChunkSchema);
