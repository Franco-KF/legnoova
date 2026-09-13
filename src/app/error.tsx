"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
        Error 500
      </span>
      <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
        Something went wrong
      </h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        An unexpected error occurred. Please try again — if the problem
        persists, contact us at hello@legnoova.com.
      </p>
      <Button onClick={reset} variant="outline" className="mt-8 h-11 rounded-xl px-6">
        <RotateCcw className="h-4 w-4" />
        Try again
      </Button>
    </div>
  );
}
