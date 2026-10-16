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

function formatCkNumber(value: string): string {
  return value.replace(/\D/g, "").slice(0, 3);
}

function parseExpiry(expiry: string): { month: number; year: number } | null {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry);
  if (!match) return null;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { month, year };
}

/**
 * Payment method form.
 *
 * Security: the full card number is used only for local formatting and is
 * NEVER sent to the server. On submit we transmit only the card brand, last
 * four digits, expiry, cardholder name and the 3-digit CK key — the same
 * non-sensitive data real PCI-compliant platforms store. To actually charge a
 * card, integrate a processor's hosted fields and store its token.
 */
export function PaymentMethodForm({
  className,
  submitLabel = "Add card",
  successMessage = "Card saved",
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
  const [ckNumber, setCkNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ expiry?: string; card?: string }>({});

  const digits = cardNumber.replace(/\D/g, "");
  const brand = detectBrand(digits);
  const parsedExpiry = parseExpiry(expiry);
  const canSubmit =
    digits.length >= 12 &&
    name.trim().length >= 2 &&
    parsedExpiry !== null &&
    ckNumber.length >= 3;

  const reset = () => {
    setCardNumber("");
    setName("");
    setExpiry("");
    setCkNumber("");
    setErrors({});
  };

  const validate = (): boolean => {
    const next: typeof errors = {};

    if (digits.length < 12) {
      next.card = "Enter a valid card number";
    }

    if (expiry.length === 5) {
      if (!parsedExpiry) {
        next.expiry = "Invalid month";
      } else {
        const now = new Date();
        const end = new Date(parsedExpiry.year, parsedExpiry.month, 1);
        if (end <= now) next.expiry = "Card has expired";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Only non-sensitive metadata leaves the browser.
      const res = await fetch("/api/billing/payment-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand,
          last4: digits.slice(-4),
          expMonth: parsedExpiry!.month,
          expYear: parsedExpiry!.year,
          name: name.trim(),
          ckNumber,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not save card. Please try again.");
      }

      toast.success(successMessage, {
        description: "Card brand, last 4 digits, expiry and CK number were saved.",
      });
      reset();
      onDone?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-5", className)}
      autoComplete="off"
    >
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2 text-xs text-emerald-300/90">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        <span>
          Your full card number is <strong>never</strong> sent or stored. The
          brand, last 4 digits, expiry and your CK number are saved.
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
            aria-invalid={!!errors.card}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            className="h-10 pl-9 pr-24 font-mono tracking-wider"
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-muted-foreground">
            {BRAND_LABELS[brand]}
          </span>
        </div>
        {errors.card && (
          <p className="text-xs text-red-400">{errors.card}</p>
        )}
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
            aria-invalid={!!errors.expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            className="h-10 font-mono"
          />
          {errors.expiry && (
            <p className="text-xs text-red-400">{errors.expiry}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="card-ck-number">CK number</Label>
          <Input
            id="card-ck-number"
            inputMode="numeric"
            placeholder="123"
            value={ckNumber}
            onChange={(e) => setCkNumber(formatCkNumber(e.target.value))}
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
        {submitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
