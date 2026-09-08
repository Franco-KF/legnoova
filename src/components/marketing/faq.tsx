import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqs } from "@/config/faqs";

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
