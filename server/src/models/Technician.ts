import mongoose, { Schema, type InferSchemaType } from "mongoose";

const technicianSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    skills: { type: [String], default: [], index: true },
    availability: {
      type: String,
      enum: ["AVAILABLE", "BUSY", "OFFLINE"],
      default: "AVAILABLE",
      required: true,
      index: true
    },
    workload: { type: Number, default: 0, min: 0 },
    capacity: { type: Number, default: 5, min: 1 },
    averageResolutionHours: { type: Number, default: 0, min: 0 }
  },
  { timestamps: true }
);

export type TechnicianDocument = InferSchemaType<typeof technicianSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const TechnicianModel = mongoose.model("Technician", technicianSchema);
