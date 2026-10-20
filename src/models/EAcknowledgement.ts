import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    signalId: { type: Schema.Types.ObjectId, ref: "Analysis", required: true },
    status: { type: String, required: true, maxlength: 40 },
    details: { type: String, default: "", maxlength: 500 },
    brokerOrderId: { type: String, default: "", maxlength: 80 },
  },
  { timestamps: true }
);
schema.index({ userId: 1, signalId: 1 }, { unique: true });

export const EAcknowledgement =
  mongoose.models.EAcknowledgement || mongoose.model("EAcknowledgement", schema);
