import { APP_URL } from "@/lib/email";

export interface SignalAlertData {
  pair: string;
  symbol: string;
  timeframe: string;
  direction: "buy" | "sell";
  entryPrice: number;
  stopLoss: number;
  takeProfits: { price: number; label: string; riskReward: number }[];
  riskReward: number;
  confidence: number;
}

function formatPrice(value: number, symbol: string): string {
  const jpy = /JPY|jpy/.test(symbol);
  return value.toFixed(jpy ? 2 : 4);
}

export function signalAlertHtml(data: SignalAlertData) {
  const up = data.direction === "buy";
  const accent = up ? "#10b981" : "#ef4444";
  const tps = data.takeProfits
    .map(
      (tp) =>
        `<tr>
          <td style="padding:8px 12px;font-size:13px;color:#9ca3af;">${tp.label} · R:${tp.riskReward.toFixed(1)}</td>
          <td style="padding:8px 12px;font-size:14px;font-weight:600;color:#fff;text-align:right;font-family:monospace;">${formatPrice(tp.price, data.symbol)}</td>
        </tr>`
    )
    .join("");

  return `
  <div style="background-color:#0b0f1a;padding:40px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#e5e7eb;">
    <div style="max-width:520px;margin:0 auto;background-color:#131a2b;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:36px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
        <div style="display:inline-block;background:#10b981;border-radius:10px;padding:10px 14px;font-weight:700;font-size:14px;color:#03140c;">Legnoova AI</div>
        <span style="display:inline-block;background:${up ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"};color:${accent};font-weight:700;font-size:12px;padding:6px 12px;border-radius:999px;border:1px solid ${accent}55;">
          ${up ? "BUY" : "SELL"} · ${data.confidence}% confidence
        </span>
      </div>
      <h1 style="font-size:22px;margin:0 0 4px;color:#fff;">New signal — ${data.pair}</h1>
      <p style="font-size:14px;color:#9ca3af;margin:0 0 24px;">${data.timeframe} timeframe · Legnoova AI just sweated this chart for a clean setup. Here's the trade plan:</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr style="background:rgba(255,255,255,0.04);">
          <td style="padding:8px 12px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.04em;">Entry</td>
          <td style="padding:8px 12px;font-size:15px;font-weight:700;color:#fff;text-align:right;font-family:monospace;">${formatPrice(data.entryPrice, data.symbol)}</td>
        </tr>
        <tr>
          <td style="padding:8px 12px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.04em;">Stop Loss</td>
          <td style="padding:8px 12px;font-size:15px;font-weight:600;color:#f87171;text-align:right;font-family:monospace;">${formatPrice(data.stopLoss, data.symbol)}</td>
        </tr>
        ${tps}
        <tr style="border-top:1px solid rgba(255,255,255,0.08);">
          <td style="padding:8px 12px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.04em;">Best Risk:Reward</td>
          <td style="padding:8px 12px;font-size:15px;font-weight:700;color:${accent};text-align:right;font-family:monospace;">1:${data.riskReward.toFixed(1)}</td>
        </tr>
      </table>

      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:14px 16px;margin-bottom:24px;">
        <p style="font-size:12px;color:#6b7280;margin:0 0 4px;">RISK-FIRST RULE</p>
        <p style="font-size:13px;color:#9ca3af;margin:0;line-height:1.6;">Never risk more than a defined % of your account on a single trade. This signal is generated analysis, not financial advice — you stay in control of every entry.</p>
      </div>

      <div style="text-align:center;margin-bottom:24px;">
        <a href="${APP_URL}/app/signals" style="display:inline-block;background:#10b981;color:#03140c;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:15px;">View in your Signals feed</a>
      </div>
      <p style="font-size:12px;color:#6b7280;margin:0;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;text-align:center;">
        You're getting this because ${data.symbol} is on your watchlist and signal alerts are on. You can turn this off any time in Settings.
      </p>
    </div>
  </div>
  `;
}

export function signalAlertText(data: SignalAlertData) {
  const tps = data.takeProfits
    .map((tp) => `${tp.label}: ${formatPrice(tp.price, data.symbol)} (R:${tp.riskReward.toFixed(1)})`)
    .join("\n");
  return [
    `Legnoova AI — New signal: ${data.direction.toUpperCase()} ${data.pair} (${data.timeframe})`,
    ``,
    `Direction: ${data.direction.toUpperCase()} · ${data.confidence}% confidence`,
    `Entry: ${formatPrice(data.entryPrice, data.symbol)}`,
    `Stop Loss: ${formatPrice(data.stopLoss, data.symbol)}`,
    tps,
    `Best Risk:Reward: 1:${data.riskReward.toFixed(1)}`,
    ``,
    `Legnoova AI generated analysis is for informational purposes only and does not constitute financial advice.`,
  ].join("\n");
}