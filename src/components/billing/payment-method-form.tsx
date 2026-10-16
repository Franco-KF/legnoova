"use client";

import { useState } from "react";
import { CreditCard, Loader2, Lock, ShieldCheck } from "lucide-react";
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

function hasValidLength(digits: string, brand: CardBrand): boolean {
  return BRAND_RULES[brand].lengths.includes(digits.length);
}

/** Luhn checksum — catches single-digit typos. */
function luhnValid(digits: string): boolean {
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return digits.length > 0 && sum % 10 === 0;
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
  const lengthOk = hasValidLength(digits, brand);
  const canSubmit =
    lengthOk &&
    luhnValid(digits) &&
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
    } else if (!lengthOk) {
      next.card = `${BRAND_RULES[brand].label} cards must be ${BRAND_RULES[
        brand
      ].lengths.join(" or ")} digits`;
    } else if (!luhnValid(digits)) {
      next.card = "That card number is invalid — check for a typo";
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
          cardNumber: digits,
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
        description: "Your card was encrypted and saved securely.",
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
            <p
              className={cn(
                "text-xs",
                lengthOk && luhnValid(digits)
                  ? "text-emerald-400"
                  : "text-muted-foreground"
              )}
            >
              {BRAND_RULES[brand].label} · accepts{" "}
              {BRAND_RULES[brand].lengths.join("/")} digits
              {lengthOk &&
                (luhnValid(digits)
                  ? " · looks valid"
                  : " · check digit doesn't match")}
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
