import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import type { Plan } from "@/config/plans";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PricingCardProps {
  plan: Plan;
}

export function PricingCard({ plan }: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-2xl border p-8 transition-all duration-300",
        plan.highlight
          ? "border-emerald-500/40 bg-gradient-to-b from-emerald-500/[0.08] to-transparent shadow-glow-emerald lg:-translate-y-4"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.14]"
      )}
    >
      {plan.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-950 shadow-glow-emerald">
            <Sparkles className="h-3 w-3" />
            Most Popular
          </span>
        </div>
      )}

      <h3 className="font-heading text-lg font-semibold">{plan.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>

      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-heading text-5xl font-bold tracking-tight">
          ${plan.price}
        </span>
        <span className="text-sm text-muted-foreground">{plan.period}</span>
      </div>

      <div className="mt-8 flex-1">
        <ul className="space-y-3.5">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm">
              <span
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  plan.highlight
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

      <Button
        render={<Link href={plan.price === 0 ? "/register" : "/register?plan=" + plan.id} />}
        variant={plan.highlight ? "default" : "outline"}
        className="mt-8 h-11 w-full rounded-xl"
      >
        {plan.cta}
      </Button>
    </div>
  );
}
