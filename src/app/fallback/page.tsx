import Link from "next/link";
import { ArrowRight, FileText, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";

export const metadata = {
  title: "LetterLift — Improve job letters with AI",
  description: "Upload a draft job application letter and turn it into a clear, professional, role-focused document with AI.",
};

export default function FallbackLandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-white/[0.06]">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/fallback" className="flex items-center gap-2 font-heading text-lg font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 text-white"><WandSparkles className="h-4 w-4" /></span>LetterLift</Link>
          <div className="flex items-center gap-2"><Link href="/fallback/dashboard" className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Open workspace</Link><Link href="/register" className="rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400">Get started</Link></div>
        </nav>
      </header>
      <section className="relative overflow-hidden py-24 sm:py-32"><div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.2),transparent_55%)]" /><div className="mx-auto max-w-4xl px-4 text-center sm:px-6"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">AI writing workspace</p><h1 className="mt-5 font-heading text-4xl font-bold tracking-tight sm:text-6xl">Turn a rough draft into a stronger job letter.</h1><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">Upload your draft, add the role you want and get a clearer, more professional letter that still sounds like you.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/fallback/dashboard" className="inline-flex h-12 items-center justify-center rounded-xl bg-violet-500 px-7 font-semibold text-white shadow-lg shadow-violet-500/20 hover:bg-violet-400">Improve a letter <ArrowRight className="ml-2 h-4 w-4" /></Link><Link href="#how" className="inline-flex h-12 items-center justify-center rounded-xl border border-white/10 px-7 font-semibold hover:bg-white/[0.05]">See how it works</Link></div><p className="mt-5 text-xs text-muted-foreground">Digital writing software · You review and approve every change</p></div></section>
      <section id="how" className="border-t border-white/[0.06] py-20"><div className="mx-auto grid max-w-6xl gap-5 px-4 sm:grid-cols-3 sm:px-6">{[{ icon: FileText, title: "Upload your draft", text: "Bring a job letter, cover letter or personal statement draft." }, { icon: Sparkles, title: "Choose your goal", text: "Add the role, company and tone you want the letter to use." }, { icon: ShieldCheck, title: "Review the result", text: "Edit, copy or download the improved version. Your final say stays with you." }].map(({ icon: Icon, title, text }) => <article key={title} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"><Icon className="h-5 w-5 text-violet-300" /><h2 className="mt-4 font-heading font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div></section>
      <footer className="border-t border-white/[0.06] py-8"><div className="mx-auto flex max-w-6xl flex-wrap gap-4 px-4 text-xs text-muted-foreground sm:px-6"><span>© 2026 LetterLift</span><Link href="/fallback/privacy">Privacy</Link><Link href="/fallback/terms">Terms</Link><Link href="/fallback/refunds">Refund policy</Link></div></footer>
    </main>
  );
}
