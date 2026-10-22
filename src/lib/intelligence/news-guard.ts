export interface NewsEvent {
  time: number; // epoch ms
  symbol: string;
  impact: "low" | "medium" | "high";
  title: string;
}

export interface NewsGuardResult {
  tradable: boolean;
  minutesToEvent: number | null;
  reason?: string;
  nearbyEvents: NewsEvent[];
}

const HIGH_IMPACT_WINDOW_MINUTES = 30; // don't trade within 30 min before/after high impact
const MEDIUM_IMPACT_WINDOW_MINUTES = 10;

// Curated high-impact news times (UTC) — should be updated from an economic calendar API in production.
// Format: { hour, minute, symbol, impact, title }
const NEWS_CALENDAR: Array<{ hour: number; minute: number; symbol: string; impact: "low" | "medium" | "high"; title: string }> = [
  { hour: 8, minute: 30, symbol: "USD", impact: "high", title: "US NFP / CPI / FOMC" },
  { hour: 14, minute: 0, symbol: "USD", impact: "high", title: "US FOMC / GDP" },
  { hour: 12, minute: 30, symbol: "EUR", impact: "high", title: "ECB Rate Decision" },
  { hour: 13, minute: 0, symbol: "GBP", impact: "high", title: "BOE Rate Decision" },
  { hour: 9, minute: 0, symbol: "JPY", impact: "high", title: "BOJ Policy" },
];

function nextNewsEvent(symbol: string, nowMs: number): NewsEvent | null {
  const now = new Date(nowMs);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let best: NewsEvent | null = null;
  let bestDiff = Infinity;

  for (const ev of NEWS_CALENDAR) {
    if (ev.symbol !== symbol && ev.symbol !== "USD") continue; // USD affects all pairs
    const eventTime = new Date(today.getTime());
    eventTime.setUTCHours(ev.hour, ev.minute, 0, 0);
    let diff = eventTime.getTime() - nowMs;
    if (diff < -HIGH_IMPACT_WINDOW_MINUTES * 60_000) {
      // event already passed, try tomorrow
      eventTime.setUTCDate(eventTime.getUTCDate() + 1);
      diff = eventTime.getTime() - nowMs;
    }
    if (diff >= 0 && diff < bestDiff) {
      bestDiff = diff;
      best = { ...ev, time: eventTime.getTime() };
    }
  }
  return best;
}

export function checkNewsGuard(symbol: string, nowMs: number = Date.now()): NewsGuardResult {
  const base = symbol.replace(/[^A-Z]/g, "").slice(0, 3);
  const quote = symbol.replace(/[^A-Z]/g, "").slice(3, 6);
  const symbolsToCheck = [base, quote, "USD"];

  let nearest: NewsEvent | null = null;
  let nearestMinutes = Infinity;
  const nearby: NewsEvent[] = [];

  for (const sym of symbolsToCheck) {
    const ev = nextNewsEvent(sym, nowMs);
    if (!ev) continue;
    const minutesToEvent = (ev.time - nowMs) / 60_000;
    const absMinutes = Math.abs(minutesToEvent);

    const window = ev.impact === "high" ? HIGH_IMPACT_WINDOW_MINUTES : MEDIUM_IMPACT_WINDOW_MINUTES;
    if (absMinutes <= window) {
      nearby.push(ev);
      if (ev.impact === "high" && absMinutes < nearestMinutes) {
        nearestMinutes = absMinutes;
        nearest = ev;
      }
    }
  }

  if (nearest) {
    return {
      tradable: false,
      minutesToEvent: Math.round(nearestMinutes),
      reason: `High-impact news for ${nearest.symbol} (${nearest.title}) in ${Math.round(nearestMinutes)} min`,
      nearbyEvents: nearby,
    };
  }

  return { tradable: true, minutesToEvent: nearestMinutes === Infinity ? null : Math.round(nearestMinutes), nearbyEvents: nearby };
}
