"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Bot, CheckCircle2, Clock3, Copy, Loader2, Pause, Play, RefreshCw, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Mode = "normal" | "scalping";
type Settings = { hasBrokerPlan: boolean; enabled: boolean; mode: Mode; riskPercent: number; tokenIssued: boolean };
type Check = { id: string; label: string; status: "pass" | "fail" | "waiting" | "info"; detail: string };
type Diagnostics = {
  checks: Check[];
  queuedSignals: number;
  readyForNewSignals: boolean;
  mode: Mode;
  enabled: boolean;
  mt5: { connected: boolean; lastSeenSecondsAgo: number | null; runtime: { status: string; demoAccount: boolean; chartM1: boolean; accountCurrency: string; eaOpenPositions: number; eaFloatingProfit: number } | null };
  activation: { demoReady: boolean; scalpingReady: boolean; blockers: string[]; scalpingBlockers: string[] };
};
type TradeEvent = { _id: string; signalId: string; dealId: string; brokerOrderId: string; eventType: "entry" | "exit"; symbol: string; currency: string; volume: number; price: number; netProfit: number; occurredAt: string };
type Acknowledgement = { _id: string; signalId: string; status: string; details: string; brokerOrderId: string; createdAt: string };
type ActivityData = { events: TradeEvent[]; acknowledgements: Acknowledgement[] };
type Snapshot = { settings: Settings; diagnostics: Diagnostics; activity: ActivityData };

function dateLabel(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function money(value: number, currency?: string) {
  if (currency && /^[A-Z]{3}$/.test(currency)) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  }
  return `${value < 0 ? "−" : "+"}${Math.abs(value).toFixed(2)} ${currency || "account currency"}`;
}

export function AutomationCenter() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activating, setActivating] = useState<Mode | "pause" | null>(null);
  const [tokenBusy, setTokenBusy] = useState(false);
  const [token, setToken] = useState("");

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      const [settingsResponse, diagnosticResponse, activityResponse] = await Promise.all([
        fetch("/api/automation/settings", { cache: "no-store" }),
        fetch("/api/automation/diagnostics", { cache: "no-store" }),
        fetch("/api/automation/activity", { cache: "no-store" }),
      ]);
      const [settings, diagnostics, activity] = await Promise.all([
        settingsResponse.json(), diagnosticResponse.json(), activityResponse.json(),
      ]);
      if (!settingsResponse.ok) throw new Error(settings.error ?? "Could not load automation settings");
      if (!diagnosticResponse.ok) throw new Error(diagnostics.error ?? "Could not load MT5 status");
      if (!activityResponse.ok) throw new Error(activity.error ?? "Could not load trade activity");
      setSnapshot({ settings, diagnostics, activity });
    } catch (error) {
      if (!quiet) toast.error(error instanceof Error ? error.message : "Could not refresh automation status");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(true), 0);
    const timer = window.setInterval(() => void refresh(true), 10_000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [refresh]);

  const issueToken = async () => {
    if (snapshot?.settings.tokenIssued && !window.confirm("Rotate the device token? The running bridge will stop authenticating until you replace its token and restart it.")) return;
    setTokenBusy(true);
    try {
      const response = await fetch("/api/automation/settings", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not create device token");
      setToken(body.token);
      await refresh(true);
      toast.success("New private bridge token created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create device token");
    } finally { setTokenBusy(false); }
  };

  const revokeToken = async () => {
    if (!window.confirm("Revoke the device token? This pauses cloud automation and disconnects the bridge until a new token is created.")) return;
    setTokenBusy(true);
    try {
      const response = await fetch("/api/automation/settings", { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not revoke the bridge token");
      setToken("");
      await refresh(true);
      toast.success("Bridge token revoked and new orders paused");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not revoke the bridge token");
    } finally { setTokenBusy(false); }
  };

  const activate = async (mode: Mode) => {
    if (!snapshot) return;
    const name = mode === "scalping" ? "M1 Scalping · Demo only" : "Normal automation · Demo only";
    const warning = mode === "scalping"
      ? "This enables M1 demo entries from newly closed momentum candles. Risk is capped at 0.05% per trade (about $4 on $8,000 equity), with one open position, at most 40 entries per broker day and 10 in any rolling two minutes, a 30-point spread cap, and a 0.5% daily-loss stop. It waits for a fresh candle; it does not force ten trades or guarantee profit."
      : "This enables normal demo execution. New qualifying chart signals may place orders on your MT5 demo account, with risk up to 0.5% per entry. It does not guarantee profit.";
    if (!window.confirm(`${name}\n\n${warning}\n\nContinue?`)) return;
    setActivating(mode);
    try {
      const response = await fetch("/api/automation/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: true, mode, riskPercent: mode === "scalping" ? 0.05 : Math.min(snapshot.settings.riskPercent, 0.5) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not activate demo automation");
      toast.success(`${name} is armed in Legnoova`, { description: mode === "scalping" ? "Keep the EA and bridge running; it evaluates each closed M1 bar and trades only when its rules qualify." : "Keep the EA and bridge running; it will only place an order for a new eligible chart signal." });
      await refresh(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not activate demo automation");
      await refresh(true);
    } finally { setActivating(null); }
  };

  const pause = async () => {
    if (!snapshot) return;
    setActivating("pause");
    try {
      const response = await fetch("/api/automation/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: false, mode: snapshot.settings.mode, riskPercent: snapshot.settings.riskPercent }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not pause automation");
      toast.success("Legnoova has stopped sending new signals to MT5");
      await refresh(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not pause automation");
    } finally { setActivating(null); }
  };

  if (loading) return <div className="glass-panel flex items-center gap-3 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-emerald-400"/>Loading MT5 automation status…</div>;
  if (!snapshot) return <div className="glass-panel p-6"><p className="text-sm text-muted-foreground">Automation status could not be loaded.</p><Button className="mt-4" variant="outline" onClick={() => void refresh()}><RefreshCw className="mr-2 h-4 w-4"/>Try again</Button></div>;

  const { settings, diagnostics, activity } = snapshot;
  const totalReportedProfit = activity.events.reduce((sum, event) => sum + event.netProfit, 0);
  const currency = diagnostics.mt5.runtime?.accountCurrency || activity.events.find((event) => event.currency)?.currency;
  const online = diagnostics.mt5.connected;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {!settings.hasBrokerPlan ? (
        <section className="glass-panel flex flex-wrap items-center justify-between gap-4 p-5">
          <div><h2 className="font-semibold">Broker plan required</h2><p className="mt-1 text-sm text-muted-foreground">An active Broker plan is required to activate MT5 demo automation.</p></div>
          <Button render={<Link href="/app/pricing"/>} className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">View plans</Button>
        </section>
      ) : null}

      <section className="glass-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.07] p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${online ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/10 text-amber-300"}`}>
              {online ? <Wifi className="h-5 w-5"/> : <WifiOff className="h-5 w-5"/>}
            </div>
            <div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">MT5 terminal</p><h2 className="mt-1 font-heading text-xl font-semibold">{online ? "Connected · heartbeat current" : "Not connected"}</h2><p className="mt-1 text-xs text-muted-foreground">{online ? `Last EA heartbeat ${diagnostics.mt5.lastSeenSecondsAgo}s ago · ${diagnostics.mt5.runtime?.status ?? "status unknown"}` : "A heartbeat older than 45 seconds is treated as offline."}</p></div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => void refresh()} disabled={refreshing}><RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}/>Refresh status</Button>
            {settings.enabled && <Button variant="destructive" onClick={() => void pause()} disabled={activating !== null}><Pause className="mr-2 h-4 w-4"/>{activating === "pause" ? "Pausing…" : "Pause new orders"}</Button>}
          </div>
        </div>
        <div className="grid gap-px bg-white/[0.06] sm:grid-cols-2 xl:grid-cols-6">
          <Metric icon={Bot} label="Legnoova switch" value={settings.enabled ? "ON" : "OFF"} tone={settings.enabled ? "good" : "quiet"}/>
          <Metric icon={Activity} label="Chart signals waiting" value={String(diagnostics.queuedSignals)} tone={diagnostics.queuedSignals ? "good" : "quiet"}/>
          <Metric icon={ShieldCheck} label="MT5 account" value={diagnostics.mt5.runtime?.demoAccount ? "DEMO" : online ? "NOT DEMO" : "Unknown"} tone={diagnostics.mt5.runtime?.demoAccount ? "good" : "warn"}/>
          <Metric icon={Bot} label="Open EA positions" value={online ? String(diagnostics.mt5.runtime?.eaOpenPositions ?? 0) : "Offline"} tone={diagnostics.mt5.runtime?.eaOpenPositions ? "warn" : "quiet"}/>
          <Metric icon={Activity} label="Floating P/L" value={online ? money(diagnostics.mt5.runtime?.eaFloatingProfit ?? 0, currency) : "Offline"} tone={(diagnostics.mt5.runtime?.eaFloatingProfit ?? 0) < 0 ? "warn" : "quiet"}/>
          <Metric icon={Clock3} label="Last 50 reported deals" value={activity.events.length ? money(totalReportedProfit, currency) : "No deals"} tone={totalReportedProfit < 0 ? "warn" : "good"}/>
        </div>
        <p className="border-t border-white/[0.06] px-5 py-3 text-xs text-muted-foreground">Floating P/L is an MT5 estimate for open EA positions (includes swap, may exclude commission); deal P/L is reported from MT5 history. Heartbeat updates about every 15 seconds.</p>
      </section>

      {!settings.tokenIssued && settings.hasBrokerPlan && <section className="glass-panel flex flex-wrap items-center justify-between gap-4 border-amber-400/20 p-5"><div><h2 className="font-semibold">Connect this MT5 terminal</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Create a private device token, configure the local bridge and EA from the setup guide, then wait for a heartbeat here.</p></div><div className="flex gap-2"><Button onClick={() => void issueToken()} disabled={tokenBusy}>{tokenBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}Create bridge token</Button><Button render={<Link href="/app/bot"/>} variant="outline">Open setup guide</Button></div></section>}
      {settings.tokenIssued && settings.hasBrokerPlan && <section className="glass-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-heading text-lg font-semibold">Private MT5 bridge token</h2><p className="mt-1 text-sm text-muted-foreground">Legnoova stores only a hash. Rotating or revoking it disconnects the current bridge and pauses new orders.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void issueToken()} disabled={tokenBusy}>{tokenBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}Rotate token</Button><Button variant="destructive" onClick={() => void revokeToken()} disabled={tokenBusy}>Revoke token</Button></div></div>
        {token && <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-4"><p className="text-sm font-semibold text-amber-100">Copy once; update the bridge environment and restart it.</p><code className="mt-2 block break-all text-xs">{token}</code><Button className="mt-3" size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(token); toast.success("Token copied"); }}><Copy className="mr-2 h-4 w-4"/>Copy token</Button></div>}
      </section>}

      <section>
        <div className="mb-3"><p className="text-xs uppercase tracking-[0.18em] text-emerald-300">Choose what to activate</p><h2 className="mt-1 font-heading text-2xl font-bold">Demo trading modes</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">Activation is allowed only after a recent MT5 heartbeat confirms a demo account, EA execution, and trade permissions. Normal mode waits for eligible chart signals; M1 Scalping evaluates live closed candles with its built-in rules. The terminal and bridge must stay open. Trades are not guaranteed.</p></div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ModeCard mode="normal" active={settings.enabled && settings.mode === "normal"} ready={diagnostics.activation.demoReady} blockers={diagnostics.activation.blockers} busy={activating !== null} onActivate={() => void activate("normal")} risk="Up to 0.5% risk per entry" description="Trend-Pullback Confluence. Activate after a qualifying chart analysis; MT5 receives new eligible signals only."/>
          <ModeCard mode="scalping" active={settings.enabled && settings.mode === "scalping"} ready={diagnostics.activation.scalpingReady} blockers={diagnostics.activation.scalpingBlockers} busy={activating !== null} onActivate={() => void activate("scalping")} risk="Demo only · M1 · 0.05% risk (≈$4 on $8,000 equity)" description="One closed M1 candle per entry: strong candle body (≥65% of range) closing in the top/bottom 20% sets direction; ATR stop and 1.2R target. One open position, max 40/day and 10 per rolling 2 min, 30-point spread cap, and 0.5% daily-loss stop. A new candle must qualify; 10 trades in two minutes is a ceiling, not a target."/>
        </div>
      </section>

      <section className="glass-panel p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Live checks · refresh every 10 seconds</p><h2 className="mt-1 font-heading text-xl font-semibold">What is actually working?</h2></div><Link href="/app/bot" className="text-sm text-emerald-300 hover:text-emerald-200">Setup & troubleshooting →</Link></div>
        <ul className="grid gap-3 md:grid-cols-2">{diagnostics.checks.map((check) => <li key={check.id} className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"><CheckIcon status={check.status}/><div><p className="text-sm font-medium">{check.label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{check.detail}</p></div></li>)}</ul>
      </section>

      <section className="glass-panel p-5 md:p-6">
        <div className="mb-4"><p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">From MT5 deal history</p><h2 className="mt-1 font-heading text-xl font-semibold">Trade activity & reported P/L</h2><p className="mt-1 text-xs text-muted-foreground">Entries/exits and net deal P/L are relayed by the EA. Broker-side stop/target management continues in MT5; pausing here blocks new orders but does not close open positions. To close a position immediately, use MT5. This page cannot guarantee fills or recover events while the bridge is offline.</p></div>
        {activity.events.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead><tr className="border-b border-white/[0.08] text-xs text-muted-foreground"><th className="py-3 pr-4 font-medium">Time</th><th className="py-3 pr-4 font-medium">Deal</th><th className="py-3 pr-4 font-medium">Symbol</th><th className="py-3 pr-4 font-medium">Volume</th><th className="py-3 pr-4 font-medium">Price</th><th className="py-3 text-right font-medium">Net P/L</th></tr></thead><tbody>{activity.events.slice(0, 20).map((event) => <tr key={event._id} className="border-b border-white/[0.04]"><td className="py-3 pr-4 text-xs text-muted-foreground">{dateLabel(event.occurredAt)}</td><td className="py-3 pr-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-semibold ${event.eventType === "entry" ? "bg-sky-500/10 text-sky-300" : "bg-violet-500/10 text-violet-300"}`}>{event.eventType === "entry" ? <ArrowUpRight className="h-3 w-3"/> : <ArrowDownRight className="h-3 w-3"/>}{event.eventType}</span></td><td className="py-3 pr-4 font-medium">{event.symbol}</td><td className="py-3 pr-4 font-mono">{event.volume}</td><td className="py-3 pr-4 font-mono">{event.price}</td><td className={`py-3 text-right font-mono ${event.netProfit < 0 ? "text-red-300" : "text-emerald-300"}`}>{money(event.netProfit, event.currency || currency)}</td></tr>)}</tbody></table></div> : <div className="rounded-xl border border-dashed border-white/[0.12] p-8 text-center"><p className="text-sm font-medium">No MT5 deals reported yet</p><p className="mt-1 text-xs text-muted-foreground">When an EA-managed order is filled or closed, its deal event appears here. Rejections and skipped signals appear below.</p></div>}
        {activity.acknowledgements.length > 0 && <div className="mt-5"><h3 className="mb-2 text-sm font-semibold">Signal processing results</h3><ul className="space-y-2">{activity.acknowledgements.slice(0, 8).map((item) => <li key={item._id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg bg-white/[0.025] px-3 py-2.5"><span className="text-sm"><strong>{item.status.replaceAll("_", " ")}</strong>{item.details ? <span className="text-muted-foreground"> — {item.details}</span> : null}</span><span className="text-xs text-muted-foreground">{dateLabel(item.createdAt)}{item.brokerOrderId ? ` · order ${item.brokerOrderId}` : ""}</span></li>)}</ul></div>}
      </section>
    </div>
  );
}

function ModeCard({ mode, active, ready, blockers, busy, onActivate, risk, description }: { mode: Mode; active: boolean; ready: boolean; blockers: string[]; busy: boolean; onActivate: () => void; risk: string; description: string }) {
  const scalp = mode === "scalping";
  return <article className={`glass-panel flex flex-col border p-5 md:p-6 ${active ? "border-emerald-400/40" : "border-white/[0.07]"}`}>
    <div className="flex items-start justify-between gap-3"><div><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${scalp ? "bg-amber-400/10 text-amber-200" : "bg-sky-400/10 text-sky-200"}`}>{scalp ? "M1 · DEMO ONLY" : "NORMAL · DEMO"}</span><h3 className="mt-3 font-heading text-xl font-semibold">{scalp ? "M1 Scalping" : "Normal automation"}</h3></div>{active ? <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${ready ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/10 text-amber-200"}`}>{ready ? "ARMED" : "SWITCH ON · CHECK MT5"}</span> : null}</div>
    <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p><p className="mt-3 text-xs font-semibold text-foreground/80">{risk}</p>
    {!ready && <ul className="mt-4 space-y-1.5 rounded-xl border border-amber-400/15 bg-amber-400/[0.035] p-3">{(blockers.length ? blockers : ["EA must be on a demo account with trading permissions enabled."]).map((item) => <li key={item} className="flex items-start gap-2 text-xs leading-5 text-amber-100/85"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0"/>{item}</li>)}</ul>}
    <Button className={`mt-5 w-full ${active && ready ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400" : ""}`} disabled={busy || active || !ready} onClick={onActivate}>{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : active ? <CheckCircle2 className="mr-2 h-4 w-4"/> : <Play className="mr-2 h-4 w-4"/>}{active ? ready ? "Armed in Legnoova" : "Check MT5 readiness above" : `Activate ${scalp ? "M1 Scalping" : "Normal demo"}`}</Button>
  </article>;
}

function Metric({ icon: Icon, label, value, tone }: { icon: typeof Bot; label: string; value: string; tone: "good" | "warn" | "quiet" }) {
  const color = tone === "good" ? "text-emerald-300" : tone === "warn" ? "text-amber-200" : "text-foreground";
  return <div className="bg-background/60 p-4"><p className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5"/>{label}</p><p className={`mt-2 truncate font-heading text-lg font-semibold ${color}`}>{value}</p></div>;
}

function CheckIcon({ status }: { status: Check["status"] }) {
  if (status === "pass") return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300"/>;
  if (status === "fail") return <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-red-300"/>;
  if (status === "info") return <Activity className="mt-0.5 h-4 w-4 shrink-0 text-sky-300"/>;
  return <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-200"/>;
}
