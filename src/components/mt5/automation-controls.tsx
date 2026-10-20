"use client";

import { useEffect, useState } from "react";
import { Copy, KeyRound, Loader2, Power, RotateCcw } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface Settings {
  hasBrokerPlan: boolean;
  enabled: boolean;
  riskPercent: number;
  tokenIssued: boolean;
}

export function AutomationControls() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [riskPercent, setRiskPercent] = useState("0.5");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const response = await fetch("/api/automation/settings", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error ?? "Could not load automation settings");
    setSettings(body);
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
        body: JSON.stringify({ enabled, riskPercent: Number(riskPercent) }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not save automation settings");
      setSettings((current) => current ? { ...current, ...body } : body);
      toast.success(enabled ? "Automation enabled" : "Automation paused");
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
      </div>
      {token && <div className="rounded-xl border border-amber-400/30 bg-amber-400/[0.06] p-4"><p className="text-sm font-semibold text-amber-200">Copy this token now. It will not be shown again.</p><code className="mt-2 block break-all text-xs text-foreground">{token}</code><Button className="mt-3" size="sm" variant="outline" onClick={() => { void navigator.clipboard.writeText(token); toast.success("Token copied"); }}><Copy className="mr-2 h-3.5 w-3.5"/>Copy token</Button></div>}
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="block text-sm"><span className="font-medium">Max risk per trade (%)</span><span className="mt-1 block text-xs text-muted-foreground">Legnoova limits this first version to 0.5%. Start on a demo account.</span><input type="number" min="0.1" max="0.5" step="0.1" value={riskPercent} onChange={(event) => setRiskPercent(event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3"/></label>
        <Button onClick={() => saveSettings(!settings.enabled)} disabled={busy || !settings.tokenIssued} variant={settings.enabled ? "outline" : "default"} className={!settings.enabled ? "bg-emerald-500 text-emerald-950 hover:bg-emerald-400" : ""}><Power className="mr-2 h-4 w-4"/>{settings.enabled ? "Pause automation" : "Enable automation"}</Button>
      </div>
      <p className="text-xs text-muted-foreground">Current state: <strong className={settings.enabled ? "text-emerald-300" : "text-amber-300"}>{settings.enabled ? "On" : "Off"}</strong>. Only your own published chart signals are sent to the bridge.</p>
    </section>
  );
}
