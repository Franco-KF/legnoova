"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, User as UserIcon, Check, Mail, BellRing } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [alerts, setAlerts] = useState(true);
  const [alertsLoaded, setAlertsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingAlerts, setSavingAlerts] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/account");
        const data = await res.json();
        if (active && res.ok && data.user) {
          setAlerts(data.user.signalEmailAlerts !== false);
          setAlertsLoaded(true);
        }
      } catch {
        /* keep default on failure */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (session?.user && !initialized) {
    setName(session.user.name || "");
    setEmail(session.user.email || "");
    setInitialized(true);
  }

  const saveName = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      await update({ name: data.user.name });
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const toggleAlerts = async () => {
    const next = !alerts;
    setSavingAlerts(true);
    setAlerts(next);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signalEmailAlerts: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");
      const confirmed = data.user?.signalEmailAlerts !== false;
      setAlerts(confirmed);
      toast.success(next ? "Signal alerts on" : "Signal alerts off");
    } catch (err) {
      setAlerts(!next);
      toast.error(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSavingAlerts(false);
    }
  };

  if (!session?.user) {
    return (
      <div className="flex justify-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">Dashboard</p>
        <h1 className="mt-1 font-heading text-2xl font-bold sm:text-3xl">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your profile and account preferences.
        </p>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="flex items-center gap-4 border-b border-white/[0.06] p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-base font-bold text-emerald-400 ring-2 ring-emerald-500/30">
            {name
              ? name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "?"}
          </div>
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <p className="font-heading text-lg font-semibold">Personal Info</p>
          </div>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Display name
            </label>
            <div className="flex gap-2">
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <button
                onClick={saveName}
                disabled={saving || !name.trim()}
                className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
              className="h-9 w-full cursor-not-allowed rounded-lg border border-input bg-input/30 px-3 text-sm text-muted-foreground outline-none"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Email cannot be changed here.
            </p>
          </div>
        </div>
      </div>

      {/* Signal alerts */}
      <div className="glass-panel mt-6 overflow-hidden">
        <div className="flex items-center gap-4 border-b border-white/[0.06] p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
            <BellRing className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="font-heading text-lg font-semibold">Signal Alerts</p>
            <p className="text-sm text-muted-foreground">
              Get an email the moment Legnoova AI publishes a signal on a pair
              you watch.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Email me new signals matching my watchlist
              </p>
              <p className="text-xs text-muted-foreground">
                Only fires for pairs already on your watchlist. No spam.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={alerts}
            onClick={toggleAlerts}
            disabled={savingAlerts || !alertsLoaded}
            className={cn(
              "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors",
              alerts
                ? "border-emerald-500/50 bg-emerald-500"
                : "border-white/[0.1] bg-white/[0.06]",
              (savingAlerts || !alertsLoaded) && "opacity-60"
            )}
          >
            <span
              className={cn(
                "absolute h-5 w-5 rounded-full bg-white transition-all",
                alerts ? "left-[calc(100%-22px)]" : "left-1"
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
