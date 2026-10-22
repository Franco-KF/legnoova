"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock3,
  Copy,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
  Monitor,
  Power,
  Server,
  ShieldAlert,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

type Mode = "normal" | "scalping";
type Status = "pass" | "fail" | "waiting" | "info";

type Settings = {
  hasBrokerPlan: boolean;
  enabled: boolean;
  mode: Mode;
  riskPercent: number;
  tokenIssued: boolean;
};

type Runtime = {
  status: string;
  demoAccount: boolean;
  chartM1: boolean;
  accountCurrency: string;
  eaOpenPositions: number;
  eaFloatingProfit: number;
  terminalTradeAllowed: boolean;
  accountTradeAllowed: boolean;
  expertTradeAllowed: boolean;
  executionEnabled: boolean;
  liveTradingAllowed: boolean;
};

type Check = {
  id: string;
  label: string;
  status: Status;
  detail: string;
};

type Diagnostics = {
  checks: Check[];
  queuedSignals: number;
  nextSignal: { symbol: string; direction: string; confidence: number } | null;
  readyForNewSignals: boolean;
  mode: Mode;
  enabled: boolean;
  mt5: { connected: boolean; lastSeenSecondsAgo: number | null; runtime: Runtime | null };
  activation: {
    demoReady: boolean;
    scalpingReady: boolean;
    blockers: string[];
    scalpingBlockers: string[];
  };
};

type TradeEvent = {
  _id: string;
  dealId: string;
  brokerOrderId: string;
  eventType: "entry" | "exit";
  symbol: string;
  currency: string;
  volume: number;
  price: number;
  netProfit: number;
  occurredAt: string;
};

type Acknowledgement = {
  _id: string;
  signalId: string;
  status: string;
  details: string;
  brokerOrderId: string;
  createdAt: string;
};

type LocalHealth = {
  bridgeRunning: boolean;
  configurationReady: boolean;
  eaConnected: boolean;
  eaLastSeenSecondsAgo: number | null;
  ea: Runtime | null;
  eaLocalError: string | null;
  eaCloudReported: boolean;
  eaCloudError: string | null;
  offlineQueueLength: number;
  wsUrl: string | null;
};

export function AutomationCenter() {
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [activity, setActivity] = useState<{ events: TradeEvent[]; acknowledgements: Acknowledgement[] } | null>(null);
  const [localHealth, setLocalHealth] = useState<LocalHealth | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activating, setActivating] = useState<Mode | "pause" | null>(null);
  const [tokenBusy, setTokenBusy] = useState(false);
  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [localCheckBusy, setLocalCheckBusy] = useState(false);
  const [localCheckError, setLocalCheckError] = useState("");
  const [sseConnected, setSseConnected] = useState(false);
  const sseRef = useRef<EventSource | null>(null);

  const fetchSnapshot = useCallback(async () => {
    const [settingsRes, diagnosticsRes, activityRes] = await Promise.all([
      fetch("/api/automation/settings", { cache: "no-store" }),
      fetch("/api/automation/diagnostics", { cache: "no-store" }),
      fetch("/api/automation/activity", { cache: "no-store" }),
    ]);
    if (!settingsRes.ok) throw new Error(settingsRes.statusText);
    if (!diagnosticsRes.ok) throw new Error(diagnosticsRes.statusText);
    if (!activityRes.ok) throw new Error(activityRes.statusText);
    const [s, d, a] = await Promise.all([settingsRes.json(), diagnosticsRes.json(), activityRes.json()]);
    setSettings(s);
    setDiagnostics(d);
    setActivity(a);
  }, []);

  const refresh = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      await fetchSnapshot();
    } catch (error) {
      if (!quiet) toast.error(error instanceof Error ? error.message : "Could not refresh automation status");
    } finally {
      setRefreshing(false);
    }
  }, [fetchSnapshot]);

  useEffect(() => {
    const initial = setTimeout(() => void refresh(true), 0);
    const timer = setInterval(() => void refresh(true), 8_000);
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, [refresh]);

  // SSE for real-time MT5 heartbeat updates
  useEffect(() => {
    if (!settings?.hasBrokerPlan) return;
    if (typeof EventSource === "undefined") return;
    if (sseRef.current) return;

    try {
      const es = new EventSource("/api/automation/stream");
      sseRef.current = es;
      es.onopen = () => setSseConnected(true);
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "connected") return;
          if (data.type === "diagnostics" && data.data) {
            startTransition(() => setDiagnostics(data.data));
          }
          if (data.type === "error") {
            // silent fallback, polling continues
          }
        } catch {
          // ignore malformed SSE
        }
      };
      es.onerror = () => {
        setTimeout(() => setSseConnected(false), 0);
        es.close();
        sseRef.current = null;
        // Reconnect after 5s
        const t = setTimeout(() => {
          if (!sseRef.current) {
            const es2 = new EventSource("/api/automation/stream");
            sseRef.current = es2;
            es2.onopen = () => setSseConnected(true);
            es2.onmessage = (event) => {
              try {
                const data = JSON.parse(event.data);
                if (data.type === "diagnostics" && data.data) startTransition(() => setDiagnostics(data.data));
              } catch {}
            };
          }
        }, 5_000);
        return () => clearTimeout(t);
      };
      return () => {
        es.close();
        sseRef.current = null;
        setSseConnected(false);
      };
    } catch {
      setTimeout(() => setSseConnected(false), 0);
    }
  }, [settings?.hasBrokerPlan, startTransition]);

  const issueToken = async () => {
    if (settings?.tokenIssued && !window.confirm("Rotate the device token? The running bridge will stop authenticating until you replace its token and restart it.")) return;
    setTokenBusy(true);
    try {
      const res = await fetch("/api/automation/settings", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not create device token");
      setToken(body.token);
      setShowToken(true);
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
      const res = await fetch("/api/automation/settings", { method: "DELETE" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not revoke the bridge token");
      setToken("");
      setShowToken(false);
      await refresh(true);
      toast.success("Bridge token revoked; new orders paused");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not revoke the bridge token");
    } finally { setTokenBusy(false); }
  };

  const activate = async (mode: Mode) => {
    if (!settings) return;
    const name = mode === "scalping" ? "M1 Scalping · Demo only" : "Normal automation · Demo only";
    const warning = mode === "scalping"
      ? "Demo-only autonomous entries from newly closed M1 momentum candles. Risk capped at 0.05% per trade (≈$4 on $8,000 equity), max 40 entries/day, 10 per rolling 2 minutes, 30-point spread cap, 0.5% daily-loss stop. One open position at a time."
      : "Demo-only execution of qualifying Trend-Pullback Confluence chart signals. Risk up to 0.5% per entry. MT5 terminal, bridge, and EA must stay online.";
    if (!window.confirm(`${name}\n\n${warning}\n\nContinue?`)) return;
    setActivating(mode);
    try {
      const res = await fetch("/api/automation/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: true, mode, riskPercent: mode === "scalping" ? 0.05 : Math.min(settings.riskPercent, 0.5) }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not activate demo automation");
      toast.success(`${name} armed`, { description: "Keep MT5, bridge.py, and the EA running." });
      await refresh(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not activate demo automation");
    } finally { setActivating(null); }
  };

  const pause = async () => {
    if (!settings) return;
    setActivating("pause");
    try {
      const res = await fetch("/api/automation/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: false, mode: settings.mode, riskPercent: settings.riskPercent }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Could not pause automation");
      toast.success("New orders paused");
      await refresh(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not pause automation");
    } finally { setActivating(null); }
  };

  const checkLocalBridge = async () => {
    setLocalCheckBusy(true);
    setLocalCheckError("");
    setLocalHealth(null);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch("http://127.0.0.1:8765/health", { cache: "no-store", mode: "cors", signal: controller.signal });
      const body = await res.json();
      if (!res.ok) throw new Error(`Bridge replied HTTP ${res.status}`);
      setLocalHealth(body as LocalHealth);
    } catch {
      setLocalCheckError("Browser could not reach 127.0.0.1:8765. Run this check on the same computer as bridge.py.");
    } finally {
      window.clearTimeout(timer);
      setLocalCheckBusy(false);
    }
  };

  if (!settings) {
    return (
      <div className="glass-panel flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mb-3" />
        <p className="text-sm text-muted-foreground">Loading MT5 automation…</p>
      </div>
    );
  }

  const mt5 = diagnostics?.mt5;
  const runtime = mt5?.runtime ?? null;
  const online = mt5?.connected ?? false;
  const heartbeatAge = mt5?.lastSeenSecondsAgo ?? null;
  const queuedSignals = diagnostics?.queuedSignals ?? 0;
  const currency = runtime?.accountCurrency || activity?.events.find((e) => e.currency)?.currency;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">MT5 · Demo account</p>
          <h1 className="mt-1 font-heading text-2xl font-bold">Broker Automation</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Connect your MT5 demo terminal to Legnoova. Trade execution runs only through your own local bridge and MT5 EA — Legnoova never receives your broker password.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={online ? "default" : "outline"}>
            {online ? "MT5 Connected" : "MT5 Offline"}
          </Badge>
          <Badge variant={sseConnected ? "default" : "ghost"}>
            {sseConnected ? "Live Stream" : "Polling"}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={refreshing}>
            {refreshing ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-2 h-3 w-3" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical alerts */}
      {!settings.hasBrokerPlan && (
        <Alert variant="destructive" className="glass-panel">
          <AlertTitle>Broker plan required</AlertTitle>
          <AlertDescription>An active Broker plan is required to activate MT5 demo automation. Upgrade your plan to connect and automate trades.</AlertDescription>
        </Alert>
      )}

      {!settings.tokenIssued && settings.hasBrokerPlan && (
        <Alert className="glass-panel bg-amber-500/[0.04] border-amber-500/20">
          <AlertTitle>Connect this MT5 terminal</AlertTitle>
          <AlertDescription>
            Create a private device token, configure the local bridge and EA, then wait for a heartbeat here. Download files from the{" "}
            <Link href="/app/bot" className="text-emerald-300 underline hover:text-emerald-400">setup guide</Link>.
          </AlertDescription>
        </Alert>
      )}

      {/* Connection status hero */}
      <section className="glass-panel overflow-hidden">
        <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">MT5 Terminal</p>
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${online ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30"}`}>
                {online ? <Wifi className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
              </div>
              <div>
                <h2 className="font-heading font-bold">{online ? "Connected" : "Not connected"}</h2>
                <p className="text-xs text-muted-foreground">
                  {online
                    ? `EA heartbeat ${heartbeatAge}s ago · ${runtime?.status ?? "status unknown"}`
                    : "A heartbeat older than 45s is treated as offline. Start bridge.py and attach the EA."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live Stream</p>
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${sseConnected ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30" : "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30"}`}>
                {sseConnected ? <Server className="h-6 w-6" /> : <Activity className="h-6 w-6" />}
              </div>
              <div>
                <h2 className="font-heading font-bold">{sseConnected ? "Streaming" : "Polling"}</h2>
                <p className="text-xs text-muted-foreground">
                  {sseConnected ? "Real-time MT5 heartbeat via EventSource" : "Fallback polling every 8s"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Offline Queue</p>
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-heading font-bold">
                  {localHealth?.offlineQueueLength ?? 0}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Signals queued locally when cloud is unreachable
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] px-6 py-4 grid gap-4 sm:grid-cols-3">
          <MetricCard
            icon={<Bot className="h-4 w-4" />}
            label="Legnoova switch"
            value={settings.enabled ? "ARMED" : "PAUSED"}
            tone={settings.enabled ? "good" : "quiet"}
            accent={settings.enabled ? "bg-emerald-500/10 text-emerald-400" : "bg-white/[0.03] text-muted-foreground"}
          />
          <MetricCard
            icon={<Activity className="h-4 w-4" />}
            label="Signals waiting"
            value={String(queuedSignals)}
            tone={queuedSignals > 0 ? "good" : "quiet"}
            accent="bg-white/[0.03] text-muted-foreground"
          />
          <MetricCard
            icon={<ShieldCheck className="h-4 w-4" />}
            label="MT5 account"
            value={runtime?.demoAccount ? "DEMO" : online ? "LIVE" : "Unknown"}
            tone={runtime?.demoAccount ? "good" : "warn"}
            accent="bg-white/[0.03] text-muted-foreground"
          />
        </div>
      </section>

      {/* Token management */}
      <section className="glass-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold">Private MT5 bridge token</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Legnoova stores only a SHA-256 hash. Rotating or revoking disconnects the bridge and pauses new orders until a new token is configured.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => void issueToken()} disabled={tokenBusy || isPending}>
              {tokenBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {settings.tokenIssued ? "Rotate token" : "Create bridge token"}
            </Button>
            <Button variant="destructive" onClick={() => void revokeToken()} disabled={tokenBusy || !settings.tokenIssued || isPending}>
              Revoke token
            </Button>
          </div>
        </div>
        {settings.tokenIssued && token && (
          <div className="mt-5 rounded-xl border border-amber-400/30 bg-amber-500/[0.06] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-amber-100">Copy once; update bridge env and restart</p>
              <button
                onClick={() => {
                  void navigator.clipboard.writeText(token);
                  setShowToken(false);
                  toast.success("Token copied to clipboard");
                }}
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                {showToken ? "Hide" : "Show"}
              </button>
            </div>
            {showToken && (
              <div className="mb-3 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3">
                <code className="block break-all text-xs font-mono text-amber-200">{token}</code>
              </div>
            )}
            <Button size="sm" variant="outline" onClick={() => {
              void navigator.clipboard.writeText(token);
              toast.success("Token copied");
            }}>
              <Copy className="mr-2 h-3 w-3" />
              Copy token
            </Button>
          </div>
        )}
      </section>

      {/* Activation modes */}
      <section>
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Demo trading modes</p>
          <h2 className="mt-1 font-heading text-xl font-bold">Arm automation</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
            Activation is allowed only after a recent MT5 heartbeat confirms a demo account, EA execution, and trade permissions. Normal mode waits for eligible chart signals; M1 Scalping evaluates live closed candles with its built-in rules. The terminal and bridge must stay open. Trades are not guaranteed.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <ModeCard
            mode="normal"
            active={settings.enabled && settings.mode === "normal"}
            ready={diagnostics?.activation.demoReady ?? false}
            blockers={diagnostics?.activation.blockers ?? []}
            busy={activating === "normal" || activating === "pause"}
            onActivate={() => void activate("normal")}
            risk="Up to 0.5% risk per entry"
            description="Trend-Pullback Confluence. MT5 receives new eligible chart signals only. One order per signal."
          />
          <ModeCard
            mode="scalping"
            active={settings.enabled && settings.mode === "scalping"}
            ready={diagnostics?.activation.scalpingReady ?? false}
            blockers={diagnostics?.activation.scalpingBlockers ?? []}
            busy={activating === "scalping" || activating === "pause"}
            onActivate={() => void activate("scalping")}
            risk="Demo only · M1 · 0.05% risk per trade"
            description="One closed M1 candle per entry: strong candle body closing near its high/low sets direction; ATR stop and 1.2R target. Max 40/day, 10 per 2 min, one open position."
          />
        </div>
        {settings.enabled && (
          <div className="mt-4 flex items-center gap-2">
            <Pause className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-muted-foreground">Automation is ARMED. New orders may be sent to MT5.</span>
            <Button variant="destructive" size="sm" onClick={() => void pause()} disabled={activating !== null}>
              {activating === "pause" ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Power className="mr-2 h-3 w-3" />}
              Pause new orders
            </Button>
          </div>
        )}
      </section>

      {/* Local bridge diagnostics */}
      {(localCheckError || localHealth) && (
        <section className="glass-panel p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-300">Read-only check · this computer</p>
              <h2 className="mt-1 font-heading text-lg font-bold">Local bridge diagnostics</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Checks the Python bridge on the computer where this browser runs. Does not enable trading or send orders.
              </p>
            </div>
            <Button variant="outline" onClick={() => void checkLocalBridge()} disabled={localCheckBusy}>
              {localCheckBusy ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Monitor className="mr-2 h-3 w-3" />}
              {localCheckBusy ? "Checking…" : "Check this computer"}
            </Button>
          </div>
          {localCheckError && (
            <div className="rounded-lg border border-amber-400/20 bg-amber-400/[0.05] p-3 mb-4 text-sm text-amber-100">
              {localCheckError}
            </div>
          )}
          {localHealth && (
            <>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <LocalCheck label="Python bridge" ok={localHealth.bridgeRunning} detail={localHealth.bridgeRunning ? "Responding at 127.0.0.1:8765" : "Start bridge.py on this computer"} />
                <LocalCheck label="Bridge config" ok={localHealth.configurationReady} detail={localHealth.configurationReady ? "Cloud URL, device token and local token configured" : "Check bridge env vars and restart bridge.py"} />
                <LocalCheck label="EA reached bridge" ok={localHealth.eaConnected} detail={localHealth.eaConnected ? "Heartbeat " + localHealth.eaLastSeenSecondsAgo + "s ago" : "Bridge reachable, but no EA diagnostic. Check EA is attached and LocalBridgeToken matches"} />
                <LocalCheck label="Heartbeat saved" ok={!!localHealth.eaCloudReported} detail={localHealth.eaCloudReported ? "Latest EA heartbeat saved to your Legnoova account" : localHealth.eaCloudError === "device_token_rejected" ? "Legnoova rejected device token" : "Cloud diagnostics: " + (localHealth.eaCloudError ?? "unavailable")} />
              </div>
              {localHealth.ea && (
                <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-xs text-muted-foreground mb-2">EA inputs</p>
                  <div className="grid gap-2 sm:grid-cols-4 text-xs">
                    <div className="flex items-center gap-2"><span className="font-medium">{localHealth.ea.executionEnabled ? "ON" : "OFF"}</span> <span className="text-muted-foreground">execution</span></div>
                    <div className="flex items-center gap-2"><span className="font-medium">{localHealth.ea.demoAccount ? "YES" : "NO"}</span> <span className="text-muted-foreground">demo account</span></div>
                    <div className="flex items-center gap-2"><span className="font-medium">{localHealth.ea.terminalTradeAllowed && localHealth.ea.accountTradeAllowed && localHealth.ea.expertTradeAllowed ? "ON" : "OFF"}</span> <span className="text-muted-foreground">trade permissions</span></div>
                    <div className="flex items-center gap-2"><span className="font-medium">{localHealth.ea.chartM1 ? "YES" : "NO"}</span> <span className="text-muted-foreground">M1 chart</span></div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* Readiness checks */}
      <section className="glass-panel p-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Live checks · refresh every 8s</p>
            <h2 className="mt-1 font-heading text-xl font-bold">What is actually working?</h2>
          </div>
          <Link href="/app/bot" className="text-sm text-emerald-300 hover:text-emerald-400 underline">
            Setup & troubleshooting →
          </Link>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {diagnostics?.checks.map((check) => (
            <li key={check.id} className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <CheckIcon status={check.status} />
              <div>
                <p className="text-sm font-medium">{check.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{check.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Trade activity */}
      <section className="glass-panel p-6">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">From MT5 deal history</p>
            <h2 className="mt-1 font-heading text-xl font-bold">Trade activity & reported P/L</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Entries/exits and net deal P/L are relayed by the EA. Pausing here blocks new orders but does not close open positions. Close positions in MT5 if needed.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <div className="border-b border-white/[0.06] px-5 py-3">
            <div className="grid grid-cols-7 text-xs text-muted-foreground font-medium">
              <div className="text-left">Time</div>
              <div className="text-left">Deal</div>
              <div className="text-left">Symbol</div>
              <div className="text-left">Volume</div>
              <div className="text-left">Price</div>
              <div className="text-right">Net P/L</div>
              <div className="text-left">Type</div>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {(activity?.events?.slice(0, 20) ?? []).map((event) => (
              <div key={event._id} className="px-5 py-3 text-sm grid grid-cols-7">
                <div className="text-left text-muted-foreground">{new Date(event.occurredAt).toLocaleTimeString()}</div>
                <div className="text-left font-mono">{event.dealId}</div>
                <div className="text-left font-medium">{event.symbol}</div>
                <div className="text-left font-mono">{event.volume}</div>
                <div className="text-left font-mono">{event.price}</div>
                <div className={`text-right font-mono ${event.netProfit < 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {event.netProfit >= 0 ? "+" : ""}{event.netProfit.toFixed(2)} {event.currency || currency}
                </div>
                <div className="text-left">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${event.eventType === "entry" ? "bg-sky-500/10 text-sky-300 border border-sky-500/20" : "bg-violet-500/10 text-violet-300 border border-violet-500/20"}`}>
                    {event.eventType === "entry" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {event.eventType}
                  </span>
                </div>
              </div>
            ))}
            {(activity?.events?.length ?? 0) === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-sm font-medium">No MT5 deals reported yet</p>
                <p className="mt-1 text-xs text-muted-foreground">When an EA-managed order is filled or closed, its deal event appears here.</p>
              </div>
            )}
          </div>
        </div>
        {activity?.acknowledgements?.length && (
          <div className="mt-6 rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
            <div className="border-b border-white/[0.06] px-5 py-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase">Signal processing results</h3>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {activity.acknowledgements.slice(0, 8).map((item) => (
                <div key={item._id} className="px-5 py-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.status.replaceAll("_", " ")}</span>
                      {item.details && <span className="text-muted-foreground">— {item.details}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}{item.brokerOrderId ? ` · order ${item.brokerOrderId}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
        </div>
          )}
      </section>

      {/* Safety notice */}
      <section className="glass-panel rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold text-sm">Before enabling execution</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Automation is OFF by default. After setup is connected, arm it via Broker Automation; set <code className="font-mono text-xs">ExecutionEnabled=true</code> in the EA only on demo. Normal mode allows up to 0.5% risk per entry; autonomous scalping risks ≈$4 per entry on $8,000 equity (0.05%), allows at most 40 entries/day and 10 in two minutes, and has a 0.5% daily-loss stop. The two-minute rate is a safety ceiling, not a target. Signals can be wrong; slippage can exceed the planned loss and no profit is promised.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value, tone, accent }: { icon: React.ReactNode; label: string; value: string; tone: "good" | "warn" | "quiet"; accent: string }) {
  const color = tone === "good" ? "text-emerald-300" : tone === "warn" ? "text-amber-200" : "text-foreground";
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground mb-2">
        {icon}
        {label}
      </div>
      <div className={cn("mt-1 font-mono text-lg font-bold", color)}>
        {value}
      </div>
      <div className={cn(accent, "h-1 w-full rounded-full mt-3 overflow-hidden")}>
        <div className="h-full" />
      </div>
    </div>
  );
}

function ModeCard({ mode, active, ready, blockers, busy, onActivate, risk, description }: { mode: Mode; active: boolean; ready: boolean; blockers: string[]; busy: boolean; onActivate: () => void; risk: string; description: string }) {
  const scalp = mode === "scalping";
  return (
    <article className={`glass-panel flex flex-col border p-6 ${active ? "border-emerald-400/40" : "border-white/[0.07]"}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${scalp ? "bg-amber-400/10 text-amber-200" : "bg-sky-400/10 text-sky-200"}`}>
            {scalp ? "M1 · DEMO ONLY" : "NORMAL · DEMO"}
          </span>
          <h3 className="mt-1 font-heading text-lg font-bold">{scalp ? "M1 Scalping" : "Normal automation"}</h3>
        </div>
        {active && ready && (
          <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            ARMED
          </span>
        )}
      </div>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      <p className="mt-3 text-xs font-semibold text-foreground/80">{risk}</p>
      {!ready && (
        <ul className="mt-4 space-y-1.5 rounded-xl border border-amber-400/15 bg-amber-400/[0.035] p-3">
          {(blockers.length ? blockers : ["EA must be on a demo account with trading permissions enabled."]).map((item) => (
            <li key={item} className="flex items-start gap-2 text-xs leading-5 text-amber-100/85">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      )}
      <Button
        className={`mt-5 w-full ${active && ready ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400" : ""}`}
        disabled={busy || active || !ready}
        onClick={onActivate}
      >
        {busy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {active ? "Updating…" : "Activating…"}
          </>
        ) : active ? (
          <>
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {ready ? "Armed in Legnoova" : "Check MT5 readiness above"}
          </>
        ) : (
          <>
            <Play className="mr-2 h-4 w-4" />
            {`Activate ${scalp ? "M1 Scalping" : "Normal demo"}`}
          </>
        )}
      </Button>
    </article>
  );
}

function CheckIcon({ status }: { status: Status }) {
  if (status === "pass") return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />;
  if (status === "fail") return <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />;
  if (status === "info") return <Activity className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />;
  return <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />;
}

function LocalCheck({ label, ok, detail }: { label: string; ok: boolean; detail: string }) {
  return (
    <li className="flex gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
      {ok ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" /> : <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />}
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>
      </div>
    </li>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className={className}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
