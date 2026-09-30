import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { AuthenticatedUser, UserRole } from "@resolveai/shared";

const userRoles: UserRole[] = ["USER", "STAFF", "TECHNICIAN", "ADMIN"];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: userRoles, default: "USER", required: true },
    department: { type: String, trim: true },
    phone: { type: String, trim: true },
    active: { type: Boolean, default: true, required: true }
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const UserModel = mongoose.model("User", userSchema);

export function toAuthenticatedUser(user: UserDocument): AuthenticatedUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    department: user.department ?? undefined,
    phone: user.phone ?? undefined,
    active: user.active
  };
}
