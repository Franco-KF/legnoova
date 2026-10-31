import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { siteUrl } from "@/config/site";

export const metadata: Metadata = {
  title: "Forex Automation for MT5 with Demo-First Risk Controls",
  description: "Connect your MT5 demo account, choose your risk rules and automate qualifying forex setups with Legnoova. Pause new orders anytime.",
  alternates: { canonical: `${siteUrl}/forex-automation` },
  openGraph: { title: "Forex Automation for MT5 | Legnoova AI", description: "Simple, demo-first forex automation with clear checks and risk controls.", url: `${siteUrl}/forex-automation`, type: "website" },
};

export default function Page() {
  return <SeoLandingPage path="/forex-automation" eyebrow="Forex automation" title="Simple MT5 automation for traders who want control" description={metadata.description as string} intro="Connect your own MT5 demo terminal, choose a mode and start only after the safety checks are green. Pause new orders from your dashboard whenever you want." benefits={["Start with an MT5 demo account", "Connect without sharing your broker password", "Choose your risk before starting", "Normal and M1 demo modes", "See connection and trade activity", "Pause new orders with one click"]} questions={[{ question: "How does Legnoova forex automation work?", answer: "Legnoova checks qualifying chart setups and sends them through your local connector to your own MT5 terminal. The terminal, connector and dashboard must remain connected." }, { question: "Can I stop automation?", answer: "Yes. You can pause new orders from Broker Automation. Pausing does not close an existing position, so manage open positions inside MT5." }]} />;
}
