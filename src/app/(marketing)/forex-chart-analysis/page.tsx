import type { Metadata } from "next";
import { SeoLandingPage } from "@/components/marketing/seo-landing-page";
import { siteUrl } from "@/config/site";

export const metadata: Metadata = {
  title: "Forex Chart Analysis Tool with AI Second Opinions",
  description: "Upload a forex chart and get a clear AI second opinion with trend, market structure, possible entry, stop loss and take-profit levels.",
  alternates: { canonical: `${siteUrl}/forex-chart-analysis` },
  openGraph: { title: "Forex Chart Analysis Tool | Legnoova AI", description: "A clear second opinion for your forex chart before you trade.", url: `${siteUrl}/forex-chart-analysis`, type: "website" },
};

export default function Page() {
  return <SeoLandingPage path="/forex-chart-analysis" eyebrow="Forex chart analysis" title="A clearer second opinion for every forex chart" description={metadata.description as string} intro="Upload a chart screenshot and Legnoova explains the trend, important price areas and possible trade levels in plain English. You decide whether to trade." benefits={["Upload your chart in seconds", "See trend and market structure", "Review entry, stop and targets", "Compare several trading views", "Get WAIT when the chart is unclear", "Keep every review in your history"]} questions={[{ question: "What does the forex chart analysis show?", answer: "It can show a possible direction, entry area, stop loss and take-profit levels, together with the visible reasons behind the review." }, { question: "Does AI guarantee a winning trade?", answer: "No. The analysis is an educational second opinion. Markets are uncertain and you remain responsible for every trade." }]} />;
}
