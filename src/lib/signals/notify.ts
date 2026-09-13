import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Watchlist } from "@/models/Watchlist";
import { sendEmail } from "@/lib/email";
import { signalAlertHtml, signalAlertText } from "@/emails/signal-alert";
import type { Analysis } from "@/lib/analysis/types";

function matches(symbol: string, entrySymbol: string | undefined): boolean {
  if (!entrySymbol) return false;
  const a = symbol.toLowerCase().replace(/[^a-z0-9]/g, "");
  const b = entrySymbol.toLowerCase().replace(/[^a-z0-9]/g, "");
  return a === b;
}

export async function notifySignalAlert({
  userId,
  analysis,
}: {
  userId: string;
  analysis: Analysis;
}) {
  if (analysis.direction === "neutral") return null;

  await dbConnect();
  const user = await User.findById(userId).select(
    "email name signalEmailAlerts"
  );
  if (!user || user.signalEmailAlerts === false) return null;

  const watchlist = await Watchlist.findOne({ userId }).lean();
  const pairs = (watchlist?.entries || []).map((e) => e.symbol);
  if (!pairs.some((p) => matches(analysis.symbol, p))) return null;

  const data = {
    pair: analysis.pair,
    symbol: analysis.symbol,
    timeframe: analysis.timeframe,
    direction: analysis.direction as "buy" | "sell",
    entryPrice: analysis.entryPrice,
    stopLoss: analysis.stopLoss,
    takeProfits: analysis.takeProfits,
    riskReward: analysis.riskReward,
    confidence: analysis.confidence,
  };

  try {
    const result = await sendEmail({
      to: user.email,
      subject: `New ${analysis.pair} ${analysis.direction.toUpperCase()} signal · ${analysis.timeframe} · Legnoova AI`,
      html: signalAlertHtml(data),
      text: signalAlertText(data),
      category: "signal-alert",
    });
    return result;
  } catch (error) {
    console.error("Signal alert email failed:", error);
    return null;
  }
}