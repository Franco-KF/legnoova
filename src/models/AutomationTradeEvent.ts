import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    signalId: { type: String, required: true, maxlength: 24 },
    dealId: { type: String, required: true, maxlength: 80 },
    brokerOrderId: { type: String, default: "", maxlength: 80 },
    eventType: { type: String, enum: ["entry", "exit"], required: true },
    symbol: { type: String, required: true, maxlength: 32 },
    currency: { type: String, default: "", maxlength: 10 },
    volume: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true },
    netProfit: { type: Number, required: true },
    occurredAt: { type: Date, required: true },
  },
  { timestamps: true }
);

schema.index({ userId: 1, dealId: 1 }, { unique: true });
schema.index({ userId: 1, occurredAt: -1 });

export const AutomationTradeEvent =
  mongoose.models.AutomationTradeEvent || mongoose.model("AutomationTradeEvent", schema);
