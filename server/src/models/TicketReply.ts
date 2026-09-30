import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { UserRole } from "@resolveai/shared";

const senderRoles: UserRole[] = ["USER", "STAFF", "TECHNICIAN", "ADMIN"];

const ticketReplySchema = new Schema(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: senderRoles, required: true },
    message: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

// Compound index: fetch all replies for a ticket in chronological order
ticketReplySchema.index({ ticketId: 1, createdAt: 1 });

export type TicketReplyDocument = InferSchemaType<typeof ticketReplySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TicketReplyModel = mongoose.model("TicketReply", ticketReplySchema);
