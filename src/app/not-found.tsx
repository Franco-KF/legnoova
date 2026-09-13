import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pricing } from "@/components/marketing/pricing";
import { LogoMark } from "@/components/branding/logo-mark";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      <header className="border-b border-white/[0.06]">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <LogoMark className="h-8 w-8" />
            <span className="font-heading text-lg font-bold tracking-tight">
              Legnoova AI
            </span>
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="px-4 py-24 text-center sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Error 404
            </span>
            <h1 className="mt-3 font-heading text-4xl font-bold tracking-tight sm:text-5xl">
              This page took a bad trade
            </h1>
            <p className="mt-4 text-muted-foreground">
              The page you&apos;re looking for doesn&apos;t exist or has been
              moved. Let&apos;s get you back on track — or start with a second
              opinion on your next setup below.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                render={<Link href="/" />}
                className="h-11 rounded-xl px-6"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to home
              </Button>
              <Button
                render={<Link href="/app/analyze" />}
                variant="outline"
                className="h-11 rounded-xl px-6"
              >
                <Compass className="h-4 w-4" />
                Analyse a chart
              </Button>
            </div>
          </div>
        </section>

        <Pricing />
      </main>
    </div>
  );
}
