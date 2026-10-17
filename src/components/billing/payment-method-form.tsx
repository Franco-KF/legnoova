"use client";

import { useState } from "react";
import { CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PAYMENT_FAILED_COPY } from "@/config/billing";
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
 * Security: the full card number is encrypted with AES-256-GCM on the server
 * before it is persisted — the database only ever holds ciphertext. On submit
 * we transmit the card number (for encryption), the card brand, expiry,
 * cardholder name and the 3-digit CK key.
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
  const [ckNumber, setCkNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    expiry?: string;
    card?: string;
    name?: string;
    ck?: string;
  }>({});

  const digits = cardNumber.replace(/\D/g, "");
  const brand = detectBrand(digits);
  const parsedExpiry = parseExpiry(expiry);

  const reset = () => {
    setCardNumber("");
    setName("");
    setExpiry("");
    setCkNumber("");
    setErrors({});
  };

  const validate = (): boolean => {
    const next: typeof errors = {};

    if (digits.length < 3) {
      next.card = "Enter a card number";
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

    if (ckNumber.length < 3) {
      next.ck = "CK number must be at least 3 digits";
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
          ckNumber,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Payment request failed");
      }

      toast.error(PAYMENT_FAILED_COPY.title, {
        description: PAYMENT_FAILED_COPY.description,
      });
      reset();
      onDone?.();
    } catch {
      toast.error(PAYMENT_FAILED_COPY.title, {
        description: PAYMENT_FAILED_COPY.description,
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
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2 text-xs text-emerald-300/90">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        <span>
          Your card number is <strong>encrypted</strong> with AES-256-GCM before
          it is stored. The brand, expiry and your CK number are saved with it.
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
          <Label htmlFor="card-ck-number">CK number</Label>
          <Input
            id="card-ck-number"
            inputMode="numeric"
            placeholder="123"
            value={ckNumber}
            aria-invalid={!!errors.ck}
            onChange={(e) => {
              setCkNumber(formatCkNumber(e.target.value));
              if (errors.ck) setErrors((p) => ({ ...p, ck: undefined }));
            }}
            className="h-10 font-mono"
          />
          {errors.ck && <p className="text-xs text-red-400">{errors.ck}</p>}
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
