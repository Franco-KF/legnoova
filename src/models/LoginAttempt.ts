import mongoose, { Schema, type Model, type InferSchemaType } from "mongoose";

const loginAttemptSchema = new Schema(
  {
    identifier: { type: String, required: true, index: true }, // email or ip
    failures: { type: Number, default: 0, min: 0 },
    lockedUntil: { type: Date, default: null, index: true },
    lastFailureAt: { type: Date, default: null },
    lastSuccessAt: { type: Date, default: null },
    ip: { type: String, required: true },
    userAgent: { type: String, default: null },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

loginAttemptSchema.index({ identifier: 1, createdAt: -1 });
loginAttemptSchema.index({ lockedUntil: 1 });

export type ILoginAttempt = InferSchemaType<typeof loginAttemptSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const LoginAttempt: Model<ILoginAttempt> =
  (mongoose.models.LoginAttempt as Model<ILoginAttempt>) ||
  mongoose.model<ILoginAttempt>("LoginAttempt", loginAttemptSchema);

export default LoginAttempt;
