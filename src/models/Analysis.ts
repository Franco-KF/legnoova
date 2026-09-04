import mongoose, { Schema, type Model, type InferSchemaType } from "mongoose";

const takeProfitSchema = new Schema(
  {
    price: { type: Number, required: true },
    label: { type: String, enum: ["TP1", "TP2", "TP3"], required: true },
    riskReward: { type: Number, required: true },
    explanation: { type: String, default: "" },
  },
  { _id: false }
);

const strategyAssessmentSchema = new Schema(
  {
    strategyId: { type: String, required: true },
    verdict: { type: String, enum: ["bullish", "bearish", "neutral"], required: true },
    confidence: { type: Number, required: true },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const analysisSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    imageUrl: { type: String, default: "" },
    pair: { type: String, required: true },
    symbol: { type: String, required: true },
    timeframe: { type: String, required: true },
    direction: { type: String, enum: ["buy", "sell", "neutral"], required: true },
    entryPrice: { type: Number, required: true },
    stopLoss: { type: Number, required: true },
    takeProfits: { type: [takeProfitSchema], required: true },
    riskReward: { type: Number, required: true },
    confidence: { type: Number, required: true },
    strategy: { type: String, required: true },
    summary: { type: String, default: "" },
    keyLevels: {
      support: { type: [Number], default: [] },
      resistance: { type: [Number], default: [] },
    },
    strategyAssessments: { type: [strategyAssessmentSchema], default: [] },
    riskDisclosure: { type: String, default: "" },
  },
  { timestamps: true }
);

export type IAnalysis = InferSchemaType<typeof analysisSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Analysis: Model<IAnalysis> =
  (mongoose.models.Analysis as Model<IAnalysis>) ||
  mongoose.model<IAnalysis>("Analysis", analysisSchema);

export default Analysis;
