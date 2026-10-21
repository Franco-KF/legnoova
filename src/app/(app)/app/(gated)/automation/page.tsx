import { PageHeader } from "@/components/layout/page-header";
import { AutomationCenter } from "@/components/mt5/automation-center";

export const metadata = { title: "Broker Automation", robots: { index: false, follow: false } };

export default function AutomationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="MT5 · Demo account controls"
        title="Broker Automation"
        description="Connect, activate, pause, and verify your Legnoova MT5 automation. Trade execution runs only through your own running MT5 terminal and local bridge."
      />
      <AutomationCenter />
    </div>
  );
}
