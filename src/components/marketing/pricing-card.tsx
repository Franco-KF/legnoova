import Link from "next/link";
import { CalendarDays, Check, ShieldCheck, Sparkles, Lock } from "lucide-react";
import type { Plan } from "@/config/plans";
import { MONEY_BACK_DAYS, TRIAL_DAYS } from "@/config/billing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PricingCardProps {
  plan: Plan;
  /** Where the CTA points. Defaults to the public register flow. */
  href?: string;
  /** Override the button label. */
  ctaLabel?: string;
  /** Marks the plan the user is already on. */
  current?: boolean;
  /** Renders a non-interactive "coming soon" state. */
  disabled?: boolean;
  /** Controls the "Most Popular" treatment. Defaults to the plan's highlight flag. */
  popular?: boolean;
  /** Optional small note rendered under the guarantee line. */
  footnote?: string;
}

export function PricingCard({
  plan,
  href,
  ctaLabel,
  current = false,
  disabled = false,
  popular,
  footnote,
}: PricingCardProps) {
  const defaultHref =
    plan.price === 0 ? "/register" : `/register?plan=${plan.id}`;
  const target = href ?? defaultHref;
  const label = current ? "Current plan" : ctaLabel ?? plan.cta;
  const inactive = current || disabled;
  const emphasized = popular ?? plan.highlight;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-8 transition-all duration-300",
        current
          ? "border-emerald-500/60 bg-gradient-to-b from-emerald-500/[0.12] to-transparent shadow-glow-emerald"
          : emphasized
            ? "border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.08] to-transparent shadow-glow-emerald lg:-translate-y-4"
            : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.14]"
      )}
    >
      {current ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-950 shadow-glow-emerald">
            <Check className="h-3 w-3" />
            Your plan
          </span>
        </div>
      ) : (
        emphasized && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-950 shadow-glow-emerald">
              <Sparkles className="h-3 w-3" />
              Most Popular
            </span>
          </div>
        )
      )}

      <h3 className="font-heading text-lg font-semibold">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-heading text-5xl font-bold tracking-tight">
          ${plan.price}
        </span>
        <span className="text-sm text-muted-foreground">{plan.period}</span>
      </div>

      <p className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
        <CalendarDays className="h-3.5 w-3.5" />
        {TRIAL_DAYS}-day free trial
      </p>

      <div className="mt-8 flex-1">
        <ul className="space-y-3.5">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm">
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  plan.highlight || current
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-white/[0.06] text-muted-foreground"
                )}
              >
                <Check className="h-3 w-3" />
              </span>
              <span className="text-foreground/80">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {inactive ? (
        <Button
          type="button"
          disabled
          variant={current ? "default" : emphasized ? "default" : "outline"}
          className="mt-8 h-11 w-full rounded-xl"
        >
          {disabled && !current ? (
            <>
              <Lock className="h-4 w-4" /> {label}
            </>
          ) : (
            label
          )}
        </Button>
      ) : (
        <Button
          render={<Link href={target} />}
          variant={emphasized ? "default" : "outline"}
          className="mt-8 h-11 w-full rounded-xl"
        >
          {label}
        </Button>
      )}

      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] leading-4 text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400/70" />
        {MONEY_BACK_DAYS}-day money-back guarantee · Cancel anytime
      </p>

      {footnote && (
        <p className="mt-2 text-center text-[11px] leading-4 text-amber-300/70">
          {footnote}
        </p>
      )}
    </div>
  );
}
