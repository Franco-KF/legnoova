"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Lock, CheckCircle2 } from "lucide-react";
import { PasswordInput } from "@/components/auth/password-input";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15">
          <Lock className="h-6 w-6 text-red-400" />
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground">
          Invalid reset link
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This password reset link is invalid. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-500 px-6 text-sm font-semibold text-emerald-950 transition-all hover:bg-emerald-400"
        >
          Request new link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
          <CheckCircle2 className="h-6 w-6 text-emerald-400" />
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground">
          Password reset successfully
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your password has been updated. You can now sign in with your new password.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-500 px-6 text-sm font-semibold text-emerald-950 transition-all hover:bg-emerald-400"
        >
          Sign in
        </button>
      </div>
    );
  }

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    else if (!/[A-Za-z]/.test(password))
      newErrors.password = "Password must contain a letter";
    else if (!/\d/.test(password))
      newErrors.password = "Password must contain a number";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ general: data.error });
      } else {
        setSuccess(true);
        toast.success("Password reset successfully");
      }
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15">
          <Lock className="h-6 w-6 text-emerald-400" />
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your new password below.
        </p>
      </div>

      {errors.general && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-foreground/80"
          >
            New password
          </label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Min 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-sm font-medium text-foreground/80"
          >
            Confirm password
          </label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex h-11 w-full items-center justify-center rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-emerald-950 transition-all hover:bg-emerald-400 active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <svg
              className="h-5 w-5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
          ) : (
            "Reset password"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-medium text-emerald-400 transition-colors hover:text-emerald-300"
        >
          ← Back to sign in
        </Link>
      </p>
    </>
  );
}