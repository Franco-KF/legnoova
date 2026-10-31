import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { siteUrl } from "@/config/site";

export const metadata: Metadata = {
  title: "Forex Trading Bot for MT5 Demo Accounts | Legnoova",
  description: "Use Legnoova as a controlled forex trading assistant for MT5. Review chart setups, apply risk limits and test automation on demo first.",
  alternates: { canonical: `${siteUrl}/forex-trading-bot` },
  openGraph: { title: "Forex Trading Bot for MT5 | Legnoova AI", description: "A controlled, demo-first MT5 workflow for chart analysis and qualifying trade setups.", url: `${siteUrl}/forex-trading-bot`, type: "website" },
};

export default function Page() {
  return <SeoLandingPage path="/forex-trading-bot" eyebrow="Forex trading bot" title="A forex trading assistant built around your plan" description={metadata.description as string} intro="Legnoova combines chart analysis, structured trade ideas and controlled MT5 automation. Start on demo, review the checks and stay in charge of your account." benefits={["Built for MT5 demo testing", "Risk and spread checks", "Signal entry, stop and target levels", "Duplicate and stale-signal protection", "Trade activity and P/L reporting", "No profit or win-rate promises"]} questions={[{ question: "Is this a guaranteed forex bot?", answer: "No. There is no guaranteed trading bot. Legnoova is a risk-aware trading assistant and automation workflow for demo testing." }, { question: "Does Legnoova hold my trading funds?", answer: "No. Your broker account and funds remain with your broker. Legnoova connects to your own MT5 terminal through the local connector." }]} />;
}
