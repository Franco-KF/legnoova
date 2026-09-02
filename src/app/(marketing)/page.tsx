import { Hero } from "@/components/marketing/hero";
import { ProductExplanation } from "@/components/marketing/product-explanation";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Features } from "@/components/marketing/features";
import { Strategies } from "@/components/marketing/strategies";
import { Pricing } from "@/components/marketing/pricing";
import { FAQ } from "@/components/marketing/faq";
import { CTASection } from "@/components/marketing/cta-section";

export default function Home() {
  return (
    <>
      <Hero />
      <ProductExplanation />
      <HowItWorks />
      <Features />
      <Strategies />
      <Pricing />
      <FAQ />
      <CTASection />
    </>
  );
}
