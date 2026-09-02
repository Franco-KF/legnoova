import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Is Legnoova financial advice?",
    answer:
      "No. Legnoova is an analysis and education tool. It provides AI-generated market analysis for informational purposes only and never claims to guarantee trading results. Always do your own research and verify a setup before placing any trade.",
  },
  {
    question: "What chart screenshots do you accept?",
    answer:
      "We accept PNG, JPG, JPEG and WEBP images. Your chart should be a clear screenshot of an open position or chart view so the AI can reliably extract visible structure.",
  },
  {
    question: "What does 'WAIT' mean?",
    answer:
      "When your uploaded chart lacks clear evidence, or the independent strategies strongly disagree, the consensus engine returns WAIT rather than inventing a setup. This is by design — we never force a signal when conditions aren't clear.",
  },
  {
    question: "How do the six strategies work together?",
    answer:
      "Each strategy module analyzes the chart independently (Price Action, Market Structure, Trend, Support & Resistance, Breakout, Supply & Demand). A consensus engine weighs their agreement using configurable thresholds to produce a final signal with a confidence score.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes. You can manage or cancel your subscription through your billing page. Your access continues until the end of the current billing period.",
  },
  {
    question: "Is my data private?",
    answer:
      "Your charts and analyses are private and only accessible to you. We never sell your data, and we follow industry-standard security practices including encryption and secure authentication.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
          FAQ
        </span>
        <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          Frequently Asked Questions
        </h2>
      </div>

      <Accordion className="mt-12 space-y-4">
        {faqs.map((faq) => (
          <AccordionItem
            key={faq.question}
            value={faq.question}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 transition-colors hover:border-white/[0.12]"
          >
            <AccordionTrigger className="text-left font-heading text-base font-medium">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm leading-7 text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
