import mongoose, { Schema, type Document, type Model } from "mongoose";

export type PlanId = "analyze" | "broker";
export type PlanStatus = "active" | "past_due" | "canceled";

export interface IUser extends Document {
  name: string;
  email: string;
  emailVerified: Date | null;
  image?: string;
  passwordHash?: string;
  signalEmailAlerts?: boolean;
  /** Active paid plan; null/undefined = free tier. */
  plan?: PlanId | null;
  planStatus?: PlanStatus | null;
  paddleCustomerId?: string;
  paddleSubscriptionId?: string;
  /** End of the currently paid period (Paddle current_period_end). */
  planCurrentPeriodEnd?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    emailVerified: { type: Date, default: null },
    image: { type: String },
    passwordHash: { type: String, select: false },
    signalEmailAlerts: { type: Boolean, default: true },
    plan: { type: String, enum: ["analyze", "broker"], default: null },
    planStatus: { type: String, enum: ["active", "past_due", "canceled"], default: null },
    paddleCustomerId: { type: String, index: true },
    paddleSubscriptionId: { type: String, index: true },
    planCurrentPeriodEnd: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
