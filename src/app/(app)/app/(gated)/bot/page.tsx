import { Bot, Lock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Trade with Bot",
  robots: { index: false, follow: false },
};

export default function BotPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="Automation"
        title="Trade with Bot"
        description="Connect your broker and let Legnoova AI execute and manage signals automatically."
      />

      <div className="glass-panel flex flex-col items-center justify-center p-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
          <Bot className="h-7 w-7 text-emerald-400" />
        </div>
        <h2 className="font-heading text-lg font-semibold">
          Coming soon
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          The trading bot is on its way. It will connect to your broker and turn
          Legnoova AI signals into automated executions — with the risk controls
          you set.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          Requires the Everything + Broker plan
        </div>
      </div>
    </div>
  );
}
