import mongoose, { Schema, type InferSchemaType } from "mongoose";

const systemSettingSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    description: { type: String },
    category: { type: String, default: "general" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedByName: { type: String }
  },
  { timestamps: true }
);

export type SystemSettingDocument = InferSchemaType<typeof systemSettingSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const SystemSettingModel = mongoose.model("SystemSetting", systemSettingSchema);
