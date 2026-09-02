import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Subtle background glows */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-emerald-400/5 blur-3xl" />
      </div>

      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" aria-label="Legnoova home">
            <Logo className="mx-auto" />
          </Link>
        </div>

        {/* Main card */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 shadow-xl backdrop-blur-xl">
          {children}
        </div>

        {/* Footer links */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
