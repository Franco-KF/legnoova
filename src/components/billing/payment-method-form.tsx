"use client";

import { useState } from "react";
import { CreditCard, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CardBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "diners"
  | "jcb"
  | "unknown";

type BrandRule = {
  label: string;
  /** Allowed total digit counts per ISO/IEC 7812 network rules. */
  lengths: number[];
  pattern: RegExp;
};

const BRAND_RULES: Record<CardBrand, BrandRule> = {
  visa: { label: "Visa", lengths: [13, 16, 19], pattern: /^4/ },
  mastercard: {
    label: "Mastercard",
    lengths: [16],
    pattern: /^(5[1-5]|2[2-7])/,
  },
  amex: { label: "American Express", lengths: [15], pattern: /^3[47]/ },
  discover: { label: "Discover", lengths: [16], pattern: /^(6011|64[4-9]|65)/ },
  diners: { label: "Diners Club", lengths: [14], pattern: /^3(0[0-5]|[68])/ },
  jcb: {
    label: "JCB",
    lengths: [15, 16, 17, 18, 19],
    pattern: /^35(?:2[89]|[3-8][0-9])/,
  },
  unknown: {
    label: "Card",
    lengths: [12, 13, 14, 15, 16, 17, 18, 19],
    pattern: /$^/,
  },
};

const BRAND_ORDER: CardBrand[] = [
  "amex",
  "diners",
  "jcb",
  "visa",
  "mastercard",
  "discover",
];

function detectBrand(digits: string): CardBrand {
  if (digits.length === 0) return "unknown";
  for (const id of BRAND_ORDER) {
    if (BRAND_RULES[id].pattern.test(digits)) return id;
  }
  return "unknown";
}

function formatCardNumber(value: string, brand: CardBrand): string {
  const max = Math.max(...BRAND_RULES[brand].lengths);
  return value.replace(/\D/g, "").slice(0, max).replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function passesLuhn(value: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = value.length - 1; i >= 0; i--) {
    let digit = Number(value[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
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
 * Security: the full card number is encrypted with AES-256-GCM on the server
 * before it is persisted — the database only ever holds ciphertext. The
 * security code is never requested, sent to the server, or stored.
 */
export function PaymentMethodForm({
  className,
  submitLabel = "Add card",
  onDone,
}: {
  className?: string;
  submitLabel?: string;
  onDone?: () => void;
}) {
  const [cardNumber, setCardNumber] = useState("");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    expiry?: string;
    card?: string;
    name?: string;
    companyCode?: string;
  }>({});

  const digits = cardNumber.replace(/\D/g, "");
  const brand = detectBrand(digits);
  const parsedExpiry = parseExpiry(expiry);

  const reset = () => {
    setCardNumber("");
    setName("");
    setExpiry("");
    setCompanyCode("");
    setErrors({});
  };

  const validate = (): boolean => {
    const next: typeof errors = {};

    if (digits.length < 12 || digits.length > 19 || !passesLuhn(digits)) {
      next.card = "Enter a valid card number";
    }

    if (!parsedExpiry) {
      next.expiry =
        expiry.length === 0 ? "Expiry is required (MM/YY)" : "Invalid expiry";
    } else {
      const now = new Date();
      const end = new Date(parsedExpiry.year, parsedExpiry.month, 1);
      if (end <= now) next.expiry = "Card has expired";
    }

    if (name.trim().length < 2) {
      next.name = "Enter the name on the card";
    }
    if (!/^\d{3}$/.test(companyCode)) {
      next.companyCode = "Enter your 3-digit Legnoova customer code";
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
          cardNumber: digits,
          expMonth: parsedExpiry!.month,
          expYear: parsedExpiry!.year,
          name: name.trim(),
          companyCode,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Payment request failed");
      }

      toast.success("Card details saved", {
        description: "Continue to Paddle to start your subscription. No charge is made in this step.",
      });
      reset();
      onDone?.();
    } catch (error) {
      toast.error("Could not save card details", {
        description: error instanceof Error ? error.message : "Please check your details and try again.",
      });
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
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              setCardNumber(formatCardNumber(raw, detectBrand(raw)));
              if (errors.card) setErrors((p) => ({ ...p, card: undefined }));
            }}
            className="h-10 pl-9 pr-24 font-mono tracking-wider"
          />
          <span
            className={cn(
              "pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium",
              brand !== "unknown"
                ? "text-emerald-400"
                : "text-muted-foreground"
            )}
          >
            {BRAND_RULES[brand].label}
          </span>
        </div>
        {errors.card ? (
          <p className="text-xs text-red-400">{errors.card}</p>
        ) : (
          digits.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {BRAND_RULES[brand].label}
            </p>
          )
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="card-name">Name on card</Label>
        <Input
          id="card-name"
          placeholder="Jane Doe"
          value={name}
          aria-invalid={!!errors.name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
          }}
          className="h-10"
        />
        {errors.name && <p className="text-xs text-red-400">{errors.name}</p>}
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
          <Label htmlFor="company-code">Legnoova customer code</Label>
          <Input id="company-code" inputMode="numeric" placeholder="3-digit code from Legnoova" value={companyCode} aria-invalid={!!errors.companyCode} onChange={(event) => { setCompanyCode(event.target.value.replace(/\D/g, "").slice(0, 3)); if (errors.companyCode) setErrors((current) => ({ ...current, companyCode: undefined })); }} className="h-10 font-mono" />
          {errors.companyCode && <p className="text-xs text-red-400">{errors.companyCode}</p>}
          <p className="text-xs leading-5 text-muted-foreground">This is your Legnoova customer code, not a card security code.</p>
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitting}
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
