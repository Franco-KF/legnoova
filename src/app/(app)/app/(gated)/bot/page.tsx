import { ShieldAlert, Monitor, Code2, ListChecks, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { AutomationControls } from "@/components/mt5/automation-controls";
import { siteConfig } from "@/config/site";

export const metadata = { title: "Broker Automation Setup", robots: { index: false, follow: false } };

const steps = [
  ["1", "Open MT5 on a demo account", "Use the MT5 terminal you already have. Sign in to a demo account first. On Linux, run MT5 with Wine; the Python bridge works natively on Linux."],
  ["2", "Create your private link key", "Click Create Bridge Token below and copy it once. You will use it only on your own computer. Never share it."],
  ["3", "Start the Python bridge", "Download bridge.py. Python 3.10 or newer is needed; no extra Python packages are. Set the app URL and device token, then run the script. It creates a separate local token the first time."],
  ["4", "Allow the local connection", "In MT5 open Tools → Options → Expert Advisors. Add http://127.0.0.1:8765 to the allowed WebRequest URLs. This lets MT5 talk to the bridge on this computer."],
  ["5", "Attach the Legnoova EA", "Download the EA, open it in MetaEditor and compile it. Attach it to a chart. Set the local URL and paste the local token file contents into its Inputs. Keep execution off for your first check."],
  ["6", "Choose the automation strategy", "When you upload a chart for automated trading, select Trend-Pullback Confluence. Other strategies still work for chart review, but only signals from this strategy can enter the MT5 queue."],
  ["7", "Test, then choose your limits", "On demo, confirm signals arrive, risk stays within 0.5%, and orders show in MT5. Turn on automation here and in the EA only when you are ready. Real accounts stay blocked until you explicitly allow them in the EA."],
];

export default function BotPage() {
  return <div className="mx-auto max-w-5xl">
    <PageHeader eyebrow="Customer-hosted · MetaTrader 5" title="Broker automation" description="Your terminal and computer stay in your control. A small local bridge passes your own published chart signals to an MT5 Expert Advisor; Legnoova never holds broker credentials." />
    <div className="mb-6 grid gap-4 md:grid-cols-3">
      {[ [Monitor, "Your MT5 terminal", "Must be running while automation is active."], [Code2, "Local Python bridge", "Runs on your computer; no separate bridge VPS is needed. Cloud polling uses your normal app hosting quota."], [ShieldAlert, "Execution is opt-in", "Defaults OFF. Begin on demo; live trading requires explicit EA opt-in."] ].map(([Icon, title, detail]) => <div key={title as string} className="glass-panel p-5"><Icon className="mb-3 h-5 w-5 text-emerald-400"/><h2 className="font-semibold">{title as string}</h2><p className="mt-1 text-sm text-muted-foreground">{detail as string}</p></div>)}
    </div>
     <section className="glass-panel p-6 md:p-8"><div className="mb-5 flex items-center gap-2"><ListChecks className="h-5 w-5 text-emerald-400"/><h2 className="font-heading text-lg font-semibold">Setup checklist</h2></div><div className="space-y-5">{steps.map(([n, title, text]) => <div key={n} className="flex gap-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-300">{n}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div></div>)}</div></section>
     <AutomationControls />
     <section className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5"><h2 className="font-semibold">How a chart can qualify for automation</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Trend-Pullback Confluence is a cautious rule set, not a promised win rate. A signal must have a visible target, an AI evidence score of at least 75, a target at 1.5R or better, at least four of six chart checks confirmed, two supporting strategy reviews, and no strong opposing review. The score is not an 85% win probability. These filters still need historical and demo testing.</p></section>
      <section className="mt-5 flex flex-wrap gap-3">
       {/* Anchors intentionally download files from API routes, not app pages. */}
       {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
       <a href="/api/automation/download/bridge" className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium hover:bg-white/[0.08]"><Download className="mr-2 h-4 w-4"/>Download Python bridge</a>
       {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
       <a href="/api/automation/download/ea" className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium hover:bg-white/[0.08]"><Download className="mr-2 h-4 w-4"/>Download MT5 Expert Advisor</a>
       {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/api/automation/download/guide" className="inline-flex h-10 items-center rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm font-medium hover:bg-white/[0.08]"><ListChecks className="mr-2 h-4 w-4"/>Full setup guide</a>
      </section>
      <section className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="glass-panel p-5"><h2 className="font-semibold">Windows PowerShell</h2><pre className="mt-3 overflow-x-auto rounded-lg bg-black/30 p-4 text-xs leading-6 text-emerald-100">{`Set-Location "$HOME\\Downloads"\n$env:LEGNOOVA_API_URL = "${siteConfig.url}"\n$env:LEGNOOVA_DEVICE_TOKEN = "PASTE_YOUR_DEVICE_TOKEN"\npython .\\bridge.py`}</pre><p className="mt-2 text-xs text-muted-foreground">The local token is created in your user profile the first time the bridge starts.</p></div>
        <div className="glass-panel p-5"><h2 className="font-semibold">Linux terminal</h2><pre className="mt-3 overflow-x-auto rounded-lg bg-black/30 p-4 text-xs leading-6 text-emerald-100">{`cd ~/Downloads\nexport LEGNOOVA_API_URL="${siteConfig.url}"\nexport LEGNOOVA_DEVICE_TOKEN="PASTE_YOUR_DEVICE_TOKEN"\npython3 bridge.py`}</pre><p className="mt-2 text-xs text-muted-foreground">The local token is created in ~/.legnoova/mt5-bridge-local-token. Copy its contents into the EA&apos;s LocalBridgeToken input. Windows: Get-Content &quot;$HOME\.legnoova\mt5-bridge-local-token&quot;</p></div>
      </section>
    <section className="mt-5 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-5"><h2 className="flex items-center gap-2 font-semibold text-amber-200"><ShieldAlert className="h-4 w-4"/>Trading risk</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Signals can be wrong, delayed, or incompatible with broker symbol conventions. Slippage, spreads, outages, leverage and execution errors can cause losses exceeding expectations. Use demo first, independently verify every signal and sizing rule, and never risk money you cannot afford to lose. This is an early integration slice, not production-ready trading software or financial advice. Live execution must remain disabled until you have reviewed and tested the EA.</p></section>
     <p className="mt-4 text-xs text-muted-foreground">API contract: <code>GET /api/automation/device</code> returns one owned, active, published signal when account automation is enabled; <code>POST</code> acknowledges with <code>signalId</code>, <code>status</code>, optional details/order ID. Authenticate using <code>Authorization: Bearer &lt;device-token&gt;</code>. Manage token and risk controls through the authenticated automation settings API.</p>
     <section className="mt-5 text-sm text-muted-foreground"><h2 className="mb-2 font-semibold text-foreground">Official MT5 help</h2><ul className="space-y-1"><li><a className="text-emerald-300 underline" href="https://www.mql5.com/en/articles/625" target="_blank" rel="noreferrer">Run MetaTrader 5 on Linux (Wine)</a></li><li><a className="text-emerald-300 underline" href="https://www.mql5.com/en/docs/network/webrequest" target="_blank" rel="noreferrer">Allow WebRequest URLs in MT5</a></li><li><a className="text-emerald-300 underline" href="https://www.mql5.com/en/docs/trading/ordercheck" target="_blank" rel="noreferrer">Check orders before sending</a></li><li><a className="text-emerald-300 underline" href="https://www.mql5.com/en/docs/trading/ordersend" target="_blank" rel="noreferrer">Read order execution results</a></li></ul></section>
  </div>;
}
