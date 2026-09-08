import { Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "I use Legnoova AI as a second opinion before entering trades. It helps me spot things I sometimes miss.",
    role: "Independent trader",
  },
  {
    quote:
      "Instead of blindly following signals, I can compare the Legnoova AI analysis with my own strategy.",
    role: "Swing trader",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="border-t border-white/[0.06] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
            Trader Stories
          </span>
          <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Traders Don&apos;t Need More Noise.
            <br className="hidden sm:block" />
            They Need Better Decisions.
          </h2>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-2">
          {testimonials.map((t) => (
            <figure
              key={t.role}
              className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 transition-all duration-300 hover:border-white/[0.14] hover:bg-white/[0.04]"
            >
              <div className="absolute right-6 top-6 opacity-20">
                <Quote className="h-8 w-8 text-emerald-400" />
              </div>
              <blockquote className="text-base leading-7 text-foreground/90">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30 font-heading text-sm font-bold text-emerald-400">
                  {t.role.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-semibold">{t.role}</p>
                  <p className="text-xs text-muted-foreground">
                    Legnoova user
                  </p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs text-muted-foreground/70">
          Replace with genuine testimonials from your actual users as soon as
          they&apos;re available.
        </p>
      </div>
    </section>
  );
}