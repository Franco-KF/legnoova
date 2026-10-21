"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Copy, KeyRound, Loader2, Power, RotateCcw, Stethoscope, XCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Settings {
  hasBrokerPlan: boolean;
  enabled: boolean;
  mode: "normal" | "scalping";
  riskPercent: number;
  tokenIssued: boolean;
}

type DiagnosticCheck = { id: string; label: string; status: "pass" | "fail" | "waiting" | "info"; detail: string };
type Diagnostics = {
  checks: DiagnosticCheck[];
  queuedSignals: number;
  readyForNewSignals: boolean;
  mode: "normal" | "scalping";
};
type LocalHealth = {
  bridgeRunning: boolean;
  configurationReady: boolean;
  eaConnected: boolean;
  eaLastSeenSecondsAgo: number | null;
  ea: {
    executionEnabled: boolean;
    terminalTradeAllowed: boolean;
    accountTradeAllowed: boolean;
    expertTradeAllowed: boolean;
  demoAccount: boolean;
  chartM1: boolean;
    liveTradingAllowed: boolean;
    status: string;
  } | null;
  cloud: Diagnostics | null;
  cloudError: string | null;
};

export function AutomationControls() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [mode, setMode] = useState<"normal" | "scalping">("normal");
  const [riskPercent, setRiskPercent] = useState("0.5");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [diagnosticBusy, setDiagnosticBusy] = useState(false);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [localHealth, setLocalHealth] = useState<LocalHealth | null>(null);
  const [localError, setLocalError] = useState("");

  const refresh = async () => {
    const response = await fetch("/api/automation/settings", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Could not load automation settings");
    setSettings(body);
    setMode(body.mode ?? "normal");
    setRiskPercent(String(body.riskPercent ?? 0.5));
  };

  useEffect(() => {
    let active = true;
    fetch("/api/automation/settings", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? "Could not load automation settings");
        if (active) {
          setSettings(body);
          setMode(body.mode ?? "normal");
          setRiskPercent(String(body.riskPercent ?? 0.5));
        }
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Could not load automation settings"))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const issueToken = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/automation/settings", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not create device token");
      setToken(body.token);
      await refresh();
      toast.success("MT5 device token created", { description: "Copy it now. You cannot view it again." });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create device token");
    } finally { setBusy(false); }
  };

  const saveSettings = async (enabled: boolean) => {
    setBusy(true);
    try {
      const response = await fetch("/api/automation/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, riskPercent: Number(riskPercent), mode }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not save automation settings");
      setSettings((current) => current ? { ...current, ...body } : body);
      setMode(body.mode ?? mode);
      setRiskPercent(String(body.riskPercent ?? riskPercent));
      toast.success(body.warning ?? (enabled ? "Automation enabled" : "Automation paused"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save automation settings");
    } finally { setBusy(false); }
  };

  const revokeToken = async () => {
    if (!window.confirm("Revoke the MT5 bridge token and pause automation?")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/automation/settings", { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not revoke token");
      setToken("");
      await refresh();
      toast.success("MT5 bridge token revoked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not revoke token");
    } finally { setBusy(false); }
  };

  const runDiagnostics = async () => {
    setDiagnosticBusy(true);
    setDiagnostics(null);
    setLocalHealth(null);
    setLocalError("");
    try {
      const response = await fetch("/api/automation/diagnostics", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not check cloud automation settings");
      setDiagnostics(body as Diagnostics);

      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 8000);
      try {
        const localResponse = await fetch("http://127.0.0.1:8765/health", {
          cache: "no-store",
          mode: "cors",
          signal: controller.signal,
        });
        const localBody = await localResponse.json();
        if (!localResponse.ok) throw new Error("Local bridge rejected the diagnostic request");
        setLocalHealth(localBody as LocalHealth);
      } catch {
        setLocalError("Could not reach the bridge on this computer. Start bridge.py, keep it running, then allow this site to access the local network if your browser asks.");
      } finally {
        window.clearTimeout(timer);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not run automation diagnostics");
    } finally {
      setDiagnosticBusy(false);
    }
  };

  if (loading) return <div className="glass-panel flex items-center gap-2 p-5 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Loading MT5 settings…</div>;
  if (!settings) return null;
  if (!settings.hasBrokerPlan) return <div className="glass-panel mt-5 flex flex-wrap items-center justify-between gap-4 p-5"><div><h2 className="font-heading font-semibold">Broker plan required</h2><p className="mt-1 text-sm text-muted-foreground">MT5 automation is included with the $59 Broker plan.</p></div><Button render={<Link href="/app/pricing"/>} className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400">View Broker Plan</Button></div>;

  return (
    <section className="glass-panel mt-5 space-y-5 p-5 md:p-6">
      <div>
        <h2 className="font-heading text-lg font-semibold">Link your MT5 bridge</h2>
        <p className="mt-1 text-sm text-muted-foreground">Create a private token for the Python bridge on your computer. It is shown once and stored on Legnoova only as a hash.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={issueToken} disabled={busy} className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"><KeyRound className="mr-2 h-4 w-4"/>{settings.tokenIssued ? "Rotate bridge token" : "Create bridge token"}</Button>
        {settings.tokenIssued && <Button onClick={revokeToken} disabled={busy} variant="outline"><RotateCcw className="mr-2 h-4 w-4"/>Revoke token</Button>}
        <Button onClick={runDiagnostics} disabled={diagnosticBusy} variant="outline"><Stethoscope className="mr-2 h-4 w-4"/>{diagnosticBusy ? "Checking setup…" : "Check MT5 connection"}</Button>
      </div>
      {token && <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-4"><p className="text-sm font-semibold text-amber-200">Copy this token now. It will not be shown again.</p><code className="mt-2 block break-all text-xs text-foreground">{token}</code><Button className="mt-3" size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(token); toast.success("Token copied"); }}><Copy className="mr-2 h-3.5 w-3.5"/>Copy token</Button></div>}
      <div className="space-y-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
        <label className="block text-sm font-medium" htmlFor="automation-mode">Automation mode</label>
        <select id="automation-mode" value={mode} onChange={(event) => {
          const next = event.target.value as "normal" | "scalping";
          setMode(next);
          if (next === "scalping" && Number(riskPercent) > 0.25) setRiskPercent("0.25");
        }} className="h-10 w-full rounded-lg border border-white/10 bg-[#101714] px-3 text-sm">
          <option value="normal">Normal · Trend-Pullback Confluence</option>
          <option value="scalping">M1 Scalping · Demo only</option>
        </select>
        {settings.mode !== mode && <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-400/25 bg-amber-400/[0.05] p-3">
          <p className="text-xs leading-5 text-amber-100/90">Saving a mode change pauses automation and skips older queued signals. You must explicitly re-enable it after reviewing the demo safeguards.</p>
          <Button size="sm" onClick={() => saveSettings(false)} disabled={busy} variant="outline">Save mode and pause</Button>
        </div>}
        {mode === "scalping" && <p className="text-xs leading-5 text-amber-200/90">Demo-only M1 testing; not a live scalper or tick-stream service. Uses one open position, at most 3 EA entries per server day, a 1% daily loss stop, a 120-second signal age limit, and ≤0.25% risk per entry. Select M1 Scalping (Demo) and upload an M1 chart. It does not generate hundreds of trades.</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="block text-sm"><span className="font-medium">Max risk per trade (%)</span><span className="mt-1 block text-xs text-muted-foreground">{mode === "scalping" ? "Scalping is capped at 0.25% per entry (about $20 per $8,000 equity, before slippage)." : "Normal automation is capped at 0.5%. Start on a demo account."}</span><input type="number" min="0.1" max={mode === "scalping" ? "0.25" : "0.5"} step="0.05" value={riskPercent} onChange={(event) => setRiskPercent(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3"/></label>
        <Button onClick={() => saveSettings(!settings.enabled)} disabled={busy || !settings.tokenIssued || settings.mode !== mode} variant={settings.enabled ? "outline" : "default"} className={!settings.enabled ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400" : ""}><Power className="mr-2 h-4 w-4"/>{settings.enabled ? "Pause automation" : "Enable automation"}</Button>
      </div>
      <p className="text-xs text-muted-foreground">Legnoova queue switch: <strong className={settings.enabled ? "text-emerald-300" : "text-amber-300"}>{settings.enabled ? "On" : "Off"}</strong>. This alone does not confirm your local bridge or MT5 is connected; use <strong>Check MT5 connection</strong> below. Only your own qualifying chart signals are sent to the bridge.</p>
      {diagnostics && <div className="space-y-4 rounded-xl border border-white/[0.08] bg-black/10 p-4" aria-live="polite">
        <div>
          <h3 className="font-semibold">Cloud and signal checks</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">This check is read-only. It does not send orders, enable execution, or change your queue.</p>
        </div>
        <ul className="space-y-3">
          {diagnostics.checks.map((check) => <DiagnosticRow key={check.id} label={check.label} status={check.status} detail={check.detail}/>) }
        </ul>
        {localError ? <DiagnosticRow label="Bridge / EA on this computer" status="fail" detail={localError}/> : null}
        {localHealth && <div className="space-y-3 border-t border-white/[0.08] pt-4">
          <h3 className="font-semibold">Local MT5 checks</h3>
          <ul className="space-y-3">
            <DiagnosticRow label="Python bridge is running" status={localHealth.bridgeRunning ? "pass" : "fail"} detail={localHealth.bridgeRunning ? "The local bridge responded on 127.0.0.1:8765." : "Start bridge.py on this computer."}/>
            <DiagnosticRow label="Bridge credentials configured" status={localHealth.configurationReady ? "pass" : "fail"} detail={localHealth.configurationReady ? "The bridge has its cloud URL and device credentials configured." : "Check LEGNOOVA_API_URL and LEGNOOVA_DEVICE_TOKEN in the bridge environment."}/>
            <DiagnosticRow label="MT5 Expert Advisor is polling" status={localHealth.eaConnected ? "pass" : "fail"} detail={localHealth.eaConnected ? `EA heartbeat received ${localHealth.eaLastSeenSecondsAgo}s ago; status: ${localHealth.ea?.status ?? "unknown"}.` : "No recent EA heartbeat. Attach the latest LegnoovaBridgeEA to an open chart and check the MT5 Experts tab."}/>
            {localHealth.ea && <>
              <DiagnosticRow label="EA execution switch" status={localHealth.ea.executionEnabled ? "pass" : "fail"} detail={localHealth.ea.executionEnabled ? "ExecutionEnabled is on in the EA inputs." : "ExecutionEnabled is false. The EA will intentionally leave signals untraded; enable it only after demo testing and risk review."}/>
              <DiagnosticRow label="MT5 trading permissions" status={localHealth.ea.terminalTradeAllowed && localHealth.ea.accountTradeAllowed && localHealth.ea.expertTradeAllowed ? "pass" : "fail"} detail={localHealth.ea.terminalTradeAllowed && localHealth.ea.accountTradeAllowed && localHealth.ea.expertTradeAllowed ? "Terminal, account, and Expert Advisor trading permissions are enabled." : "Enable Algo Trading and check terminal/account Expert Advisor trading permissions."}/>
              <DiagnosticRow label="Account safety mode" status={localHealth.ea.demoAccount ? "pass" : diagnostics.mode === "scalping" || !localHealth.ea.liveTradingAllowed ? "fail" : "info"} detail={localHealth.ea.demoAccount ? "MT5 is connected to a demo account." : diagnostics.mode === "scalping" ? "M1 Scalping is demo-only. The EA blocks this mode on any live account." : localHealth.ea.liveTradingAllowed ? "This is a live account and the EA input allows it. Review all risk settings before use." : "Live-account trading is blocked by the EA safety setting; use a demo account for setup checks."}/>
              {diagnostics.mode === "scalping" && <DiagnosticRow label="MT5 chart timeframe" status={localHealth.ea.chartM1 ? "pass" : "fail"} detail={localHealth.ea.chartM1 ? "The EA is attached to an M1 chart." : "Attach the EA to an M1 chart before running scalping mode."}/>}
            </>}
            <DiagnosticRow label="Cloud connection from bridge" status={localHealth.cloud ? "pass" : "fail"} detail={localHealth.cloud ? "The device token authenticated to Legnoova." : localHealth.cloudError === "device_token_rejected" ? "Legnoova rejected this device token. Create a new token and reconfigure the bridge." : localHealth.cloudError === "bridge_credentials_missing" ? "The bridge is missing its cloud URL or device token." : "The bridge could not reach the Legnoova diagnostics API. Check the API URL, network, and bridge terminal output."}/>
            {localHealth.cloud?.checks.map((check) => <DiagnosticRow key={`bridge-${check.id}`} label={`Bridge · ${check.label}`} status={check.status} detail={check.detail}/>) }
          </ul>
          <p className="text-xs leading-5 text-muted-foreground">A ready result means the bridge/EA settings passed these checks and it can process future eligible signals. It cannot guarantee a trade: a new analysis must pass the automation filters, and your broker can still reject an order. Verify fills in MT5 history.</p>
        </div>}
      </div>}
    </section>
  );
}

function DiagnosticRow({ label, status, detail }: { label: string; status: "pass" | "fail" | "waiting" | "info"; detail: string }) {
  const Icon = status === "pass" ? CheckCircle2 : status === "fail" ? XCircle : AlertCircle;
  const color = status === "pass" ? "text-emerald-400" : status === "fail" ? "text-red-400" : "text-amber-300";
  return <li className="flex items-start gap-2 text-sm"><Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`}/><div><p className="font-medium">{label}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{detail}</p></div></li>;
}
