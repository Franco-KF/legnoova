import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig, siteUrl } from "@/config/site";

type Props = {
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  benefits: string[];
  questions: Array<{ question: string; answer: string }>;
  path: string;
};

export function SeoLandingPage({ title, description, eyebrow, intro, benefits, questions, path }: Props) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  const pageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: `${siteUrl}${path}`,
    isPartOf: { "@type": "WebSite", name: siteConfig.name, url: siteUrl },
  };

  return (
    <>
      <JsonLd data={faqSchema} />
      <JsonLd data={pageSchema} />
      <section className="relative overflow-hidden border-b border-white/[0.06] py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(52,211,153,0.16),transparent_55%)]" />
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">{eyebrow}</p>
          <h1 className="mt-5 font-heading text-4xl font-bold tracking-tight sm:text-6xl">{title}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{intro}</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button render={<Link href="/register" />} size="lg" className="h-12 rounded-xl bg-emerald-500 px-7 text-emerald-950 hover:bg-emerald-400">
              Try Legnoova free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button render={<Link href="/how-it-works" />} size="lg" variant="outline" className="h-12 rounded-xl border-white/10 px-7">See how it works</Button>
          </div>
          <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Demo-first tools · No guaranteed results</p>
        </div>
      </section>
      <section className="py-20">
        <div className="mx-auto grid max-w-5xl gap-5 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
          {benefits.map((benefit) => (
            <article key={benefit} className="glass-panel p-6"><CheckCircle2 className="h-5 w-5 text-emerald-400" /><h2 className="mt-4 font-heading font-semibold">{benefit}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Legnoova gives you a clear, practical view of the chart so you can make your own trading decision.</p></article>
          ))}
        </div>
      </section>
      <section className="border-t border-white/[0.06] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6"><h2 className="font-heading text-3xl font-bold">Questions traders ask</h2><div className="mt-8 space-y-6">{questions.map((item) => <article key={item.question}><h3 className="font-semibold">{item.question}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p></article>)}</div></div>
      </section>
    </>
  );
}
