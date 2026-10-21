import mongoose, { Schema, type Document, type Model } from "mongoose";

export type PlanId = "analyze" | "broker";
export type PlanStatus = "active" | "trialing" | "past_due" | "canceled";

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
  /** End of the current free trial (null once the first charge is made). */
  trialEndsAt?: Date | null;
  paddleCustomerId?: string;
  paddleSubscriptionId?: string;
  /** End of the currently paid period (Paddle current_period_end). */
  planCurrentPeriodEnd?: Date | null;
  eaTokenHash?: string | null;
  brokerAutomationEnabled?: boolean;
  brokerAutomationMode?: "normal" | "scalping";
  brokerRiskPercent?: number;
  mt5LastSignalId?: string | null;
  mt5LeaseSignalId?: string | null;
  mt5LeaseUntil?: Date | null;
  mt5LastHeartbeatAt?: Date | null;
  mt5Runtime?: {
    executionEnabled: boolean;
    terminalTradeAllowed: boolean;
    accountTradeAllowed: boolean;
    expertTradeAllowed: boolean;
    demoAccount: boolean;
    chartM1: boolean;
    liveTradingAllowed: boolean;
    accountCurrency: string;
    eaOpenPositions: number;
    eaFloatingProfit: number;
    status: string;
  };
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
    planStatus: {
      type: String,
      enum: ["active", "trialing", "past_due", "canceled"],
      default: null,
    },
    trialEndsAt: { type: Date, default: null },
    paddleCustomerId: { type: String, index: true },
    paddleSubscriptionId: { type: String, index: true },
    planCurrentPeriodEnd: { type: Date, default: null },
    eaTokenHash: { type: String, default: null, select: false, index: true },
    brokerAutomationEnabled: { type: Boolean, default: false },
    brokerAutomationMode: { type: String, enum: ["normal", "scalping"], default: "normal" },
    brokerRiskPercent: { type: Number, default: 0.5, min: 0.05, max: 0.5 },
    mt5LastSignalId: { type: String, default: null },
    mt5LeaseSignalId: { type: String, default: null },
    mt5LeaseUntil: { type: Date, default: null },
    mt5LastHeartbeatAt: { type: Date, default: null },
    mt5Runtime: {
      executionEnabled: { type: Boolean, default: false },
      terminalTradeAllowed: { type: Boolean, default: false },
      accountTradeAllowed: { type: Boolean, default: false },
      expertTradeAllowed: { type: Boolean, default: false },
      demoAccount: { type: Boolean, default: false },
      chartM1: { type: Boolean, default: false },
      liveTradingAllowed: { type: Boolean, default: false },
      accountCurrency: { type: String, default: "", maxlength: 10 },
      eaOpenPositions: { type: Number, default: 0, min: 0 },
      eaFloatingProfit: { type: Number, default: 0 },
      status: { type: String, default: "unknown", maxlength: 40 },
    },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
