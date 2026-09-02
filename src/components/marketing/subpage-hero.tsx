import { ReactNode } from "react";

interface SubpageHeroProps {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
}

export function SubpageHero({ eyebrow, title, subtitle }: SubpageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-white/[0.06]">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="grid-bg-pattern mask-fade-bottom absolute inset-0 opacity-40" />
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-500/15 via-teal-500/5 to-transparent blur-3xl" />
      </div>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            {eyebrow}
          </span>
          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            {title}
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
            {subtitle}
          </p>
        </div>
      </div>
    </section>
  );
}
