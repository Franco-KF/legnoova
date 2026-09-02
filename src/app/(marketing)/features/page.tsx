import { Features } from "@/components/marketing/features";
import { SubpageHero } from "@/components/marketing/subpage-hero";
import { CTASection } from "@/components/marketing/cta-section";

export const metadata = {
  title: "Features",
  description:
    "Explore the features of Legnoova — an AI-powered forex chart analysis platform with multi-strategy consensus.",
};

export default function FeaturesPage() {
  return (
    <>
      <SubpageHero
        eyebrow="Features"
        title={<>A Terminal Built for<br className="hidden sm:block" /> Serious Analysis</>}
        subtitle="Every feature of Legnoova is engineered to give you clear, structured insight — grounded in what's actually on your chart."
      />
      <Features />
      <CTASection />
    </>
  );
}
