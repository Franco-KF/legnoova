import mongoose, { Schema, type Model, type InferSchemaType } from "mongoose";

const watchlistEntrySchema = new Schema(
  {
    symbol: { type: String, required: true },
    pair: { type: String, required: true },
    timeframe: { type: String, required: true },
    direction: { type: String, enum: ["buy", "sell"], required: true },
    entryPrice: { type: Number, required: true },
    takeProfits: [Number],
    stopLoss: { type: Number },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const watchlistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, default: "My Watchlist" },
    entries: { type: [watchlistEntrySchema], default: [] },
  },
  { timestamps: true }
);

export type IWatchlist = InferSchemaType<typeof watchlistSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Watchlist: Model<IWatchlist> =
  (mongoose.models.Watchlist as Model<IWatchlist>) ||
  mongoose.model<IWatchlist>("Watchlist", watchlistSchema);

export default Watchlist;
