"use client";

import { useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { startCheckout } from "@/lib/paddle-client";
import type { PlanId } from "@/config/plans";

type AccessSnapshot = {
  plan: string | null;
  planStatus: string | null;
  paddleSubscriptionId: string | null;
};

export function PaddleInlineCheckout({
  planId,
  planName,
}: {
  planId: PlanId;
  planName: string;
}) {
  const frameTarget = "legnoova-paddle-inline-frame";
  const [loading, setLoading] = useState(true);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let alive = true;
    startCheckout(planId, frameTarget, () => {
      if (!alive) return;
      setConfirming(true);
      void confirmProvisioning();
    })
      .then(() => {
        if (alive) {
          setCheckoutReady(true);
          setLoading(false);
        }
      })
      .catch((error) => {
        if (!alive) return;
        setLoading(false);
        toast.error(error instanceof Error ? error.message : "Could not load secure Paddle checkout.");
      });

    return () => {
      alive = false;
    };

    async function confirmProvisioning() {
      for (let attempt = 0; attempt < 20; attempt++) {
        if (!alive) return;
        try {
          const response = await fetch("/api/account", { cache: "no-store" });
          const body = await response.json();
          const user = body.user as AccessSnapshot | undefined;
          if (response.ok && user?.plan === planId && (user.planStatus === "trialing" || user.planStatus === "active")) {
            if (!alive) return;
            setConfirmed(true);
            setConfirming(false);
            toast.success(`${planName} is ready`, { description: user.planStatus === "trialing" ? "Your free trial has started." : "Your subscription is active." });
            return;
          }
        } catch {
          // A short polling delay is expected while the signed webhook is processed.
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      if (alive) {
        setConfirming(false);
        toast.info("Checkout received", { description: "We are still confirming your plan. Refresh your billing page in a moment." });
      }
    }
  }, [frameTarget, planId, planName]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
        <div className="text-sm">
          <p className="font-semibold text-foreground">Secure payment by Paddle</p>
          <p className="mt-1 text-muted-foreground">Your payment details go directly into Paddle&apos;s protected checkout frame. Legnoova does not receive or store your card number or security code.</p>
        </div>
      </div>
      {loading && <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Loading secure checkout…</div>}
      <div
        id="paddle-inline-checkout"
        aria-label={`Paddle secure checkout for ${planName}`}
        className={`${frameTarget} min-h-[620px] w-full overflow-hidden rounded-xl bg-background`}
      />
      {confirming && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Paddle confirmed checkout. Waiting for Legnoova to activate your plan…</p>}
      {confirmed && <p role="status" className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-200">Your plan is active in Legnoova. You can continue to your dashboard.</p>}
      {!checkoutReady && !loading && <p className="text-xs text-muted-foreground">If secure checkout did not load, check that Paddle is enabled for this domain and that the environment, client token, and selected plan price belong to the same Paddle account.</p>}
    </div>
  );
}
