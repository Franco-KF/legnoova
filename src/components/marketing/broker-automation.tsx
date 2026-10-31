import Link from "next/link";
import { ArrowRight, CheckCircle2, Monitor, Play, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: "1",
    icon: Monitor,
    title: "Connect MT5",
    text: "Install the small Legnoova connector and link your MT5 demo account. Your broker password stays in MT5.",
  },
  {
    number: "2",
    icon: ShieldCheck,
    title: "Choose your risk",
    text: "Pick Normal or M1 Demo mode. Set the amount you are comfortable risking before anything can run.",
  },
  {
    number: "3",
    icon: Play,
    title: "Press Start",
    text: "Legnoova checks the setup, waits for a qualifying signal and sends it to your MT5 terminal. Pause anytime.",
  },
];

export function BrokerAutomation() {
  return (
    <section id="broker-automation" className="border-t border-white/[0.06] bg-gradient-to-b from-emerald-500/[0.04] to-transparent py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Broker tools</span>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">From your chart to MT5—without the busywork.</h2>
            <p className="mt-5 text-base leading-7 text-muted-foreground">
              No broker password in Legnoova. No confusing control panel. Connect your own MT5 demo account, choose your risk and stay in control from one simple screen.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-foreground/80">
              {["Start on demo with execution off", "Clear checks before automation can start", "Pause new orders with one click", "Your account and trade activity stay visible"].map((item) => (
                <li key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" />{item}</li>
              ))}
            </ul>
            <Button render={<Link href="/register?plan=broker" />} className="mt-8 h-11 rounded-xl bg-emerald-500 px-6 text-emerald-950 hover:bg-emerald-400">
              Try Broker Tools <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">Demo-first setup · No guaranteed results · Cancel anytime</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="relative rounded-2xl border border-white/[0.08] bg-background/60 p-5 shadow-xl">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-sm font-bold text-emerald-300">{step.number}</span>
                <step.icon className="mt-6 h-5 w-5 text-teal-300" />
                <h3 className="mt-4 font-heading font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
