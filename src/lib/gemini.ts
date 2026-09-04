import {
  GoogleGenerativeAI,
  type GenerativeModel,
} from "@google/generative-ai";
import type { Analysis, TakeProfit, StrategyAssessment } from "./analysis/types";

const MODEL = "gemini-2.0-flash";

let cachedModel: GenerativeModel | null = null;

function getModel(): GenerativeModel {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  if (!cachedModel) {
    const genAI = new GoogleGenerativeAI(apiKey);
    cachedModel = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    });
  }
  return cachedModel;
}

export interface AnalyzeChartOptions {
  imageBase64: string;
  mimeType: string;
  symbolHint: string;
  timeframe: string;
  strategy: string;
  strategyLabel: string;
}

function cumulativeRiskRewards(
  entry: number,
  stop: number,
  prices: number[]
): number[] {
  const risk = Math.abs(entry - stop);
  if (!risk) return prices.map(() => 1);
  return prices.map((price) => {
    const reward = Math.abs(price - entry);
    return Math.round((reward / risk) * 10) / 10;
  });
}

function toTp(
  price: number,
  index: number,
  rr: number,
  explanation: string
): TakeProfit {
  return {
    price,
    label: (["TP1", "TP2", "TP3"] as const)[index],
    riskReward: rr,
    explanation,
  };
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  return trimmed.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
}

function parseAnalysis(raw: string): Analysis {
  const cleaned = stripCodeFence(raw);
  const parsed = JSON.parse(cleaned) as Analysis;

  const hasSymbol = !!parsed.symbol && ![ "unknown", "n/a", "", "null" ].includes(String(parsed.symbol).toLowerCase());
  const symbol = hasSymbol ? parsed.symbol : parsed.pair || "PAIR?";
  const pair = parsed.pair || symbol;

  const entry = Number(parsed.entryPrice);
  const stop = Number(parsed.stopLoss);
  const requestedDirection = String(parsed.direction || "").toLowerCase();
  const isNeutralRequested =
    requestedDirection === "neutral" ||
    requestedDirection === "wait" ||
    requestedDirection === "none";
  const direction: "buy" | "sell" | "neutral" = isNeutralRequested
    ? "neutral"
    : parsed.direction === "sell"
    ? "sell"
    : parsed.direction === "buy"
    ? "buy"
    : "neutral";

  const rawTps = Array.isArray(parsed.takeProfits) ? parsed.takeProfits : [];
  const tpPrices = rawTps
    .map((tp) => Number(tp?.price))
    .filter((p): p is number => Number.isFinite(p) && p > 0);

  // Allow 1-3 take profit targets. Cap at 3 but never force a minimum beyond 1.
  let finalPrices = tpPrices.slice(0, 3);

  // Only synthesize fallback targets when there's a real directional bias.
  if (
    finalPrices.length === 0 &&
    direction !== "neutral" &&
    Number.isFinite(entry) &&
    Number.isFinite(stop) &&
    entry !== 0 &&
    stop !== 0
  ) {
    // Fallback: synthesize targets from common risk-reward extensions
    const risk = Math.abs(entry - stop);
    const targets =
      direction === "buy"
        ? [entry + risk * 1, entry + risk * 2, entry + risk * 3]
        : [entry - risk * 1, entry - risk * 2, entry - risk * 3];
    finalPrices = targets.map((p) => Math.round(p * 10000) / 10000);
  }

  const rrs = cumulativeRiskRewards(entry, stop, finalPrices);

  const takeProfits = finalPrices.map((price, i) =>
    toTp(price, i, rrs[i] ?? 1, "")
  );

  // Persist explanations if the model provided them
  rawTps.forEach((tp, i) => {
    if (i < takeProfits.length && tp?.explanation) {
      takeProfits[i].explanation = tp.explanation;
    }
  });

  const confidence = Math.min(
    100,
    Math.max(0, Math.round(Number(parsed.confidence) || 50))
  );

  const strategyAssessments: StrategyAssessment[] = Array.isArray(
    parsed.strategyAssessments
  )
    ? parsed.strategyAssessments.map((s) => ({
        strategyId: String(s?.strategyId || ""),
        verdict:
          s?.verdict === "bullish" || s?.verdict === "bearish"
            ? s.verdict
            : "neutral",
        confidence: Math.round(Number(s?.confidence) || 0),
        note: String(s?.note || ""),
      }))
    : [];

  return {
    symbol,
    pair,
    timeframe: String(parsed.timeframe || ""),
    direction,
    entryPrice: entry,
    stopLoss: stop,
    takeProfits,
    riskReward: takeProfits.length
      ? Math.max(...takeProfits.map((tp) => tp.riskReward))
      : 0,
    confidence,
    strategy: parsed.strategy || "",
    summary: String(parsed.summary || ""),
    keyLevels: {
      support: Array.isArray(parsed.keyLevels?.support)
        ? parsed.keyLevels.support.map(Number).filter(Number.isFinite)
        : [],
      resistance: Array.isArray(parsed.keyLevels?.resistance)
        ? parsed.keyLevels.resistance.map(Number).filter(Number.isFinite)
        : [],
    },
    strategyAssessments,
    riskDisclosure: String(
      parsed.riskDisclosure ||
        "AI-generated analysis is for informational purposes only and does not constitute financial advice."
    ),
  };
}

export async function analyzeChart(
  options: AnalyzeChartOptions
): Promise<Analysis> {
  const model = getModel();

  const prompt = `
You are an expert, risk-first forex technical analyst. A trader has uploaded a screenshot of a price chart and wants a professional, evidence-based signal.

## Chart context
- Symbol / pair hint from trader: ${options.symbolHint || "not provided (read from chart)"}
- Timeframe visible in the chart: ${options.timeframe}
- Strategy the trader wants you to focus on: ${options.strategyLabel}

## Your task
Analyse ONLY what is visible in the chart image. Identify the current market structure, key support and resistance, trend, and any clear entry/exit points. Then produce a single trade setup with:

1. **direction**: "buy" or "sell" (or "neutral" if no clear edge — see below).
2. **entryPrice**: a precise, realistic entry level.
3. **stopLoss**: a price that invalidates the idea (beyond the nearest swing / structure).
4. **takeProfits**: a JSON array of 1, 2 or up to 3 targets. IMPORTANT — the number must be DYNAMIC:
   - If the chart only shows ONE clear, strong target zone ahead, return just ONE target (TP1).
   - If there are TWO clear minor/major levels ahead, return TWO targets (TP1, TP2).
   - If there are THREE credible levels / room for a full 1:3 extension, return THREE (TP1, TP2, TP3).
   - Never pad the list: only include targets that are truly supported by visible structure.
   Each take profit must include: \`price\`, \`label\` ("TP1"/"TP2"/"TP3"), \`riskReward\` (computed as |target - entry| / |entry - stop|, rounded to 1 decimal), and a short \`explanation\` of which structure/zone it sits at.
5. **riskReward**: the overall best risk:reward across the targets.
6. **confidence**: an integer 0-100 based only on the strength/evidence visible in the chart.
7. **summary**: 2-3 sentences explaining the thesis and key evidence.
8. **keyLevels**: arrays of concrete \`support\` and \`resistance\` prices read from the chart.
9. **strategyAssessments**: optional per-strategy read for the requested strategy and adjacent confirming strategies → array of { strategyId, verdict: "bullish"|"bearish"|"neutral", confidence: 0-100, note }.
10. **pair** and **symbol**: derive from the chart if legible, otherwise use the trader's hint.

## Rules
- Be conservative. If there is NO clear, high-quality setup visible, return direction "neutral", and an empty takeProfits array, a confidence below 50, and a summary explaining why there's no trade.
- Never invent prices that are not anchored to visible structure.
- Use consistent precision (e.g. 4 decimals for FX pairs like EUR/USD, 2 for JPY pairs).

Return ONLY a valid JSON object, no markdown, matching this exact shape:
{
  "pair": "EUR/USD",
  "symbol": "EURUSD",
  "timeframe": "${options.timeframe}",
  "direction": "buy",
  "entryPrice": 1.0845,
  "stopLoss": 1.0795,
  "takeProfits": [
    { "price": 1.0895, "label": "TP1", "riskReward": 1.0, "explanation": "..." },
    { "price": 1.0945, "label": "TP2", "riskReward": 2.0, "explanation": "..." }
  ],
  "riskReward": 2.0,
  "confidence": 78,
  "strategy": "${options.strategyLabel}",
  "summary": "...",
  "keyLevels": { "support": [1.0795, 1.0760], "resistance": [1.0895, 1.0945] },
  "strategyAssessments": [
    { "strategyId": "price-action", "verdict": "bullish", "confidence": 80, "note": "..." }
  ],
  "riskDisclosure": "AI-generated analysis is for informational purposes only and does not constitute financial advice."
}
`;

  const imagePart = {
    inlineData: {
      mimeType: options.mimeType,
      data: options.imageBase64,
    },
  };

  const result = await model.generateContent([
    prompt,
    imagePart,
  ]);

  const text = result.response.text();
  return parseAnalysis(text);
}
