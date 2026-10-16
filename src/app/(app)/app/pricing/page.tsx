import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CreditCard,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { PLANS, PLAN_BADGES } from "@/config/plans";
import { PricingCard } from "@/components/marketing/pricing-card";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Plans & Pricing",
  robots: { index: false, follow: false },
};

const TRUST = [
  { icon: ShieldCheck, label: "Encrypted card storage" },
  { icon: Lock, label: "Cancel anytime" },
  { icon: BadgeCheck, label: "Instant activation" },
];

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ upgrade?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/app/pricing");
  }

  await dbConnect();
  const user = await User.findById(session.user.id).select(
    "plan planStatus planCurrentPeriodEnd"
  );

  const sp = await searchParams;
  const upgradeRequired = sp?.upgrade === "required";
  const currentPlan = user?.plan ?? null;
  const planLabel = currentPlan ? PLAN_BADGES[currentPlan] : null;
  const hasPlan = Boolean(currentPlan);

  return (
    <div className="mx-auto max-w-5xl">
      {upgradeRequired && !hasPlan && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] px-4 py-3.5 text-sm text-amber-200/90">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <p>
            <strong className="font-semibold">Choose a plan to continue.</strong>{" "}
            Your workspace unlocks the moment your subscription is active.
          </p>
        </div>
      )}

      <PageHeader
        eyebrow="Membership"
        title={hasPlan ? "Your plan" : "Choose your edge"}
        description={
          hasPlan
            ? "You have full access. Manage your subscription or switch plans below."
            : "Every plan unlocks the full Legnoova AI desk. Upgrade, cancel, or switch anytime."
        }
        actions={
          hasPlan ? (
            <Link
              href="/app/billing"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.02] px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/[0.06]"
            >
              <CreditCard className="h-4 w-4" />
              Manage billing
            </Link>
          ) : undefined
        }
      />

      {hasPlan && planLabel && (
        <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/[0.08] to-transparent p-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
            <Check className="h-5 w-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Current plan</p>
            <p className="font-heading text-lg font-semibold">{planLabel}</p>
          </div>
          <span className="ml-auto rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium capitalize text-emerald-400">
            {user?.planStatus ?? "active"}
          </span>
        </div>
      )}

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <PricingCard
              key={plan.id}
              plan={plan}
              current={isCurrent}
              href={`/app/billing/checkout?plan=${plan.id}`}
              ctaLabel={isCurrent ? "Current plan" : plan.cta}
            />
          );
        })}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {TRUST.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-3 text-xs text-muted-foreground"
          >
            <Icon className="h-4 w-4 shrink-0 text-emerald-400" />
            {label}
          </div>
        ))}
      </div>

      {!hasPlan && (
        <Link
          href="/app"
          className="mt-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Back to dashboard <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}

      <p className="mt-12 text-center text-xs text-muted-foreground/60">
        Legnoova AI provides market analysis for informational purposes and does
        not guarantee trading results. Always verify a setup before trading.
      </p>
    </div>
  );
}
