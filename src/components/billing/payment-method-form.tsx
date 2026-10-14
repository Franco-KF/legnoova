"use client";

import { useState } from "react";
import { CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CardBrand = "visa" | "mastercard" | "amex" | "discover" | "unknown";

const BRAND_LABELS: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
  unknown: "Card",
};

function detectBrand(digits: string): CardBrand {
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^(6011|65)/.test(digits)) return "discover";
  return "unknown";
}

function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatCvc(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

/**
 * UI-only payment method form (mockup).
 *
 * This is a presentational prototype of the "add a card" experience. It does
 * NOT collect, transmit, or store card data: on submit it only shows a toast
 * and clears. Real card capture must be handled by a PCI-compliant processor
 * (hosted fields / tokenization) so raw numbers and CVC never reach our code.
 */
export function PaymentMethodForm({
  className,
  submitLabel = "Add card",
  successMessage = "Card added (demo)",
  onDone,
}: {
  className?: string;
  submitLabel?: string;
  successMessage?: string;
  onDone?: () => void;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const brand = detectBrand(cardNumber.replace(/\D/g, ""));
  const canSubmit =
    cardNumber.replace(/\D/g, "").length >= 12 &&
    name.trim().length >= 2 &&
    expiry.length === 5 &&
    cvc.length >= 3;

  const reset = () => {
    setCardNumber("");
    setName("");
    setExpiry("");
    setCvc("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    // Mockup only — nothing is sent anywhere. No fetch, no persistence.
    setTimeout(() => {
      toast.success(successMessage, {
        description: "Test mode — no card details were stored or transmitted.",
      });
      reset();
      setSubmitting(false);
      onDone?.();
    }, 600);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-5", className)}
      autoComplete="off"
    >
      <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-300/90">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        <span>
          Test mode — card details are <strong>not</strong> stored or transmitted.
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="card-number">Card number</Label>
        <div className="relative">
          <CreditCard className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="card-number"
            inputMode="numeric"
            placeholder="4242 4242 4242 4242"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            className="h-10 pl-9 pr-24 font-mono tracking-wider"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-muted-foreground">
            {BRAND_LABELS[brand]}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="card-name">Name on card</Label>
        <Input
          id="card-name"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-10"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="card-expiry">Expiry</Label>
          <Input
            id="card-expiry"
            inputMode="numeric"
            placeholder="MM/YY"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            className="h-10 font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="card-cvc">CVC</Label>
          <Input
            id="card-cvc"
            inputMode="numeric"
            placeholder="123"
            value={cvc}
            onChange={(e) => setCvc(formatCvc(e.target.value))}
            className="h-10 font-mono"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={!canSubmit || submitting}
        className="h-10 w-full bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
      >
        {submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
        {submitting ? "Processing…" : submitLabel}
      </Button>
    </form>
  );
}
