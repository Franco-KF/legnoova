import {
  GoogleGenerativeAI,
  type GenerativeModel,
} from "@google/generative-ai";
import type {
  Analysis,
  TakeProfit,
  StrategyAssessment,
  StrategyChecklistItem,
  KeyFinding,
  ChecklistStatus,
  FindingTone,
} from "./analysis/types";
import { getStrategy } from "./analysis/types";

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

export const GEMINI_IMAGE_ERROR =
  "The chart image couldn't be read. Use a clear, sharp screenshot of a single chart (PNG or JPEG) and try again.";
export const GEMINI_BLOCKED_ERROR =
  "The AI response was blocked by content filters. Try a plain chart screenshot without extra overlays or logos.";
export const GEMINI_BUSY_ERROR =
  "Legnoova AI is briefly overloaded. Please wait a minute and try again.";
export const GEMINI_UNREADABLE_ERROR =
  "The AI returned an unreadable analysis. Please try again.";
export const GEMINI_KEY_ERROR =
  "The AI service key is invalid. Update GEMINI_API_KEY in your environment and try again.";

export function normalizeAnalysisError(error: unknown): string | null {
  if (error instanceof Error && error.message === "GEMINI_API_KEY is not configured") {
    return "Legnoova AI service is not configured yet.";
  }
  if (!(error instanceof Error)) return null;
  if (
    [
      GEMINI_IMAGE_ERROR,
      GEMINI_BLOCKED_ERROR,
      GEMINI_BUSY_ERROR,
      GEMINI_UNREADABLE_ERROR,
      GEMINI_KEY_ERROR,
    ].includes(error.message)
  ) {
    return error.message;
  }
  if (/API_KEY_INVALID|API key not valid|key.*invalid/i.test(error.message)) {
    return GEMINI_KEY_ERROR;
  }
  if (/model.*(not found|invalid|doesn't exist|not supported)|found no model/i.test(error.message)) {
    return "The AI model is not available on this API key or region. Check your Gemini setup.";
  }
  if (/permission|billing|forbidden|\b403\b/i.test(error.message)) {
    return "The AI service key is out of quota or lacks billing access. Check your Gemini API setup.";
  }
  if (/network|fetch failed|ENOTFOUND|ECONNRESET|undici/i.test(error.message)) {
    return "Network error reaching the AI service. Please try again.";
  }
  return null;
}

export interface AnalyzeChartOptions {
  imageBase64: string;
  mimeType: string;
  symbolHint: string;
  timeframe: string;
  strategy: string;
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

function parseJsonWithRecovery(raw: string): Analysis {
  const cleaned = stripCodeFence(raw);
  try {
    return JSON.parse(cleaned) as Analysis;
  } catch {
    // The model sometimes wraps JSON in prose or extra braces. Fall back to
    // extracting the first balanced {...} block before giving up.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      const candidate = cleaned.slice(start, end + 1);
      return JSON.parse(candidate) as Analysis;
    }
    throw new Error(GEMINI_UNREADABLE_ERROR);
  }
}

const CHECKLIST_STATUSES: ChecklistStatus[] = ["confirmed", "partial", "failed"];
const FINDING_TONES: FindingTone[] = ["bullish", "bearish", "neutral"];

function parseChecklist(
  raw: unknown,
  expectedPoints: string[]
): StrategyChecklistItem[] {
  const items = Array.isArray(raw) ? raw : [];
  const normalized = new Map<string, StrategyChecklistItem>();
  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    const point = String((item as Record<string, unknown>).point || "").trim();
    if (!point) continue;
    const rawStatus = String(
      (item as Record<string, unknown>).status || ""
    ).toLowerCase();
    const status: ChecklistStatus = CHECKLIST_STATUSES.includes(
      rawStatus as ChecklistStatus
    )
      ? (rawStatus as ChecklistStatus)
      : "partial";
    normalized.set(point.toLowerCase(), {
      point,
      status,
      note: String((item as Record<string, unknown>).note || "").trim(),
    });
  }
  // Return the checklist in the strategy's canonical order so the UI is stable.
  return expectedPoints.map(
    (point) =>
      normalized.get(point.toLowerCase()) || {
        point,
        status: "partial" as ChecklistStatus,
        note: "No clear evidence visible on this chart.",
      }
  );
}

function parseKeyFindings(raw: unknown): KeyFinding[] {
  const items = Array.isArray(raw) ? raw : [];
  return items
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const rec = item as Record<string, unknown>;
      const label = String(rec.label || "").trim();
      const value = String(rec.value || "").trim();
      if (!label || !value) return null;
      const rawTone = String(rec.tone || "").toLowerCase();
      const tone: FindingTone = FINDING_TONES.includes(rawTone as FindingTone)
        ? (rawTone as FindingTone)
        : "neutral";
      return { label, value, tone };
    })
    .filter((f): f is KeyFinding => f !== null)
    .slice(0, 6);
}

function parseAnalysis(raw: string, strategyId: string): Analysis {
  const parsed = parseJsonWithRecovery(raw);

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
    keyFindings: parseKeyFindings(parsed.keyFindings),
    strategyChecklist: parseChecklist(
      parsed.strategyChecklist,
      getStrategy(strategyId).checklist
    ),
    riskDisclosure: String(
      parsed.riskDisclosure ||
"Legnoova AI-generated analysis is for informational purposes only and does not constitute financial advice."
    ),
  };
}

export async function analyzeChart(
  options: AnalyzeChartOptions
): Promise<Analysis> {
  const model = getModel();
  const strategy = getStrategy(options.strategy);

  const strategySection = `
## Strategy focus: ${strategy.label}
${strategy.description}
${strategy.promptFocus}

You MUST evaluate each point of this strategy checklist against the chart:
${strategy.checklist.map((c, i) => `${i + 1}. ${c}`).join("\n")}
`;

  const prompt = `
You are an expert, risk-first forex technical analyst. A trader has uploaded a screenshot of a price chart and wants a professional, evidence-based signal.

## Chart context
- Symbol / pair hint from trader: ${options.symbolHint || "not provided (read from chart)"}
- Timeframe visible in the chart: ${options.timeframe}
- Strategy the trader wants you to focus on: ${strategy.label}
${strategySection}
## Your task
Analyse ONLY what is visible in the chart image through the lens of the requested strategy. Identify the current market structure, key support and resistance, trend, and any clear entry/exit points. Then produce a single trade setup with:

1. **direction**: "buy" or "sell" (or "neutral" if no clear edge — see below).
2. **entryPrice**: a precise, realistic entry level.
3. **stopLoss**: a price that invalidates the idea (beyond the nearest swing / structure / zone).
4. **takeProfits**: a JSON array of 1, 2 or up to 3 targets. IMPORTANT — the number must be DYNAMIC:
   - If the chart only shows ONE clear, strong target zone ahead, return just ONE target (TP1).
   - If there are TWO clear minor/major levels ahead, return TWO targets (TP1, TP2).
   - If there are THREE credible levels / room for a full 1:3 extension, return THREE (TP1, TP2, TP3).
   - Never pad the list: only include targets that are truly supported by visible structure.
   Each take profit must include: \`price\`, \`label\` ("TP1"/"TP2"/"TP3"), \`riskReward\` (computed as |target - entry| / |entry - stop|, rounded to 1 decimal), and a short \`explanation\` of which structure/zone it sits at.
5. **riskReward**: the overall best risk:reward across the targets.
6. **confidence**: an integer 0-100 based only on the strength/evidence visible in the chart.
7. **summary**: 2-3 sentences explaining the thesis and key evidence in the language of the requested strategy.
8. **keyLevels**: arrays of concrete \`support\` and \`resistance\` prices read from the chart.
9. **keyFindings**: 3-5 strategy-specific findings → array of { label, value, tone } where tone is "bullish", "bearish" or "neutral". The labels and values must speak the language of the requested strategy (e.g. for Smart Money Concepts: "Structure", "Order Block", "Fair Value Gap", "Liquidity", "Premium/Discount"; for Support & Resistance: "Key Level", "Touches", "Role Flip").
10. **strategyChecklist**: one entry for EVERY checklist point listed above, in the same order → array of { point, status, note } where status is "confirmed" (clear evidence), "partial" (some evidence / unclear) or "failed" (evidence contradicts the setup), and note is one short sentence of what you saw.
11. **strategyAssessments**: per-strategy verdicts for the requested strategy and adjacent confirming strategies → array of { strategyId, verdict: "bullish"|"bearish"|"neutral", confidence: 0-100, note }.
12. **pair** and **symbol**: derive from the chart if legible, otherwise use the trader's hint.

## Rules
- Be conservative. If there is NO clear, high-quality setup visible, return direction "neutral", an empty takeProfits array, a confidence below 50, and a summary explaining why there's no trade.
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
  "strategy": "${strategy.label}",
  "summary": "...",
  "keyLevels": { "support": [1.0795, 1.0760], "resistance": [1.0895, 1.0945] },
  "keyFindings": [
    { "label": "Structure", "value": "BOS above 1.0890 — bullish continuation", "tone": "bullish" },
    { "label": "Order Block", "value": "1.0812 – 1.0834 (unmitigated bullish OB)", "tone": "bullish" }
  ],
  "strategyChecklist": [
    { "point": "${strategy.checklist[0]}", "status": "confirmed", "note": "..." }
  ],
  "strategyAssessments": [
    { "strategyId": "price-action", "verdict": "bullish", "confidence": 80, "note": "..." }
  ],
  "riskDisclosure": "Legnoova AI-generated analysis is for informational purposes only and does not constitute financial advice."
}
`;

  const imagePart = {
    inlineData: {
      mimeType: options.mimeType,
      data: options.imageBase64,
    },
  };

  let result;
  try {
    result = await model.generateContent([prompt, imagePart]);
  } catch (err) {
    const status = (err as { status?: number })?.status;
    const message = err instanceof Error ? err.message : "";
    if (status === 429 || /QUOTA|RESOURCE_EXHAUSTED|RATE.LIMIT/i.test(message)) {
      throw new Error(GEMINI_BUSY_ERROR);
    }
    if (/API_KEY_INVALID|API key not valid|key.*invalid/i.test(message)) {
      throw new Error(GEMINI_KEY_ERROR);
    }
    if (/image/i.test(message)) {
      throw new Error(GEMINI_IMAGE_ERROR);
    }
    throw err;
  }

  let text = "";
  try {
    text = result.response.text();
  } catch {
    const finish = result.response?.candidates?.[0]?.finishReason;
    const reason = finish ? String(finish) : "empty";
    if (/SAFETY|BLOCK/.test(reason)) {
      throw new Error(GEMINI_BLOCKED_ERROR);
    }
    throw new Error(GEMINI_UNREADABLE_ERROR);
  }

  if (!text.trim()) {
    throw new Error(GEMINI_BLOCKED_ERROR);
  }

  return parseAnalysis(text, options.strategy);
}
