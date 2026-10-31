import Link from "next/link";
import { ArrowRight, Mail, MessageCircleQuestion, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/config/site";

export function SupportSection() {
  return (
    <section id="support" className="border-t border-white/[0.06] py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Need help?</span>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">A real support contact when you need us.</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">Questions about chart analysis, your subscription or MT5 setup? Our support team can help you understand the next step.</p>
            <a href={`mailto:${siteConfig.contactEmail}`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"><Mail className="h-4 w-4" /> Email support</a>
          </div>
          <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="flex items-start gap-3"><MessageCircleQuestion className="mt-0.5 h-5 w-5 text-teal-300" /><div><h3 className="font-semibold">Common questions</h3><Link href="/#faq" className="mt-1 inline-flex items-center gap-1 text-sm text-emerald-300 hover:text-emerald-200">Read the FAQ <ArrowRight className="h-3.5 w-3.5" /></Link></div></div>
            <div className="flex items-start gap-3 border-t border-white/[0.08] pt-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" /><p className="text-sm leading-6 text-muted-foreground">We explain the product clearly and never promise trading results.</p></div>
            <p className="border-t border-white/[0.08] pt-3 text-xs text-muted-foreground">Support email: {siteConfig.contactEmail}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
