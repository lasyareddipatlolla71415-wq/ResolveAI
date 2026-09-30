import mongoose, { Schema, type InferSchemaType } from "mongoose";

const notificationTypes = [
  "TICKET_CREATED",
  "TECHNICIAN_ASSIGNED",
  "TICKET_UPDATED",
  "INFO_REQUESTED",
  "TICKET_RESOLVED",
  "TICKET_CLOSED",
  "SESSION_ESCALATED",
  "SESSION_RESOLVED",
  "PRIORITY_CHANGED",
  "USER_RESPONDED",
  "TICKET_REOPENED"
] as const;

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: notificationTypes, required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false, index: true },
    relatedTicketId: { type: Schema.Types.ObjectId, ref: "Ticket" },
    relatedSessionId: { type: Schema.Types.ObjectId, ref: "TroubleshootingSession" },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export type NotificationDocument = InferSchemaType<typeof notificationSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const NotificationModel = mongoose.model("Notification", notificationSchema);
