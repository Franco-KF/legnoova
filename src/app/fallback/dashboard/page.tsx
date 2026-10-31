"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Feather, FileText, Loader2, Sparkles, Upload } from "lucide-react";

export default function FallbackDashboardPage() {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [instructions, setInstructions] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const improve = async () => {
    if (!text.trim() && !file) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setResult("Your improved document will appear here. Connect your AI writing service to transform the uploaded content while keeping the writer's meaning and voice.");
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#0d1117] text-[#f4f7fb]">
      <header className="border-b border-[#f4f7fb]/10 bg-[#0d1117]/95">
        <nav className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/fallback" className="flex items-center gap-2.5 font-serif text-xl font-bold"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f7fb] text-[#0d1117]"><Feather className="h-4 w-4" /></span>Legnoova</Link>
          <Link href="/fallback" className="inline-flex items-center gap-2 text-sm text-[#f4f7fb]/60 hover:text-[#67e8f9]"><ArrowLeft className="h-4 w-4" /> Back home</Link>
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#67e8f9]">Legnoova editor</p><h1 className="mt-2 font-serif text-4xl font-bold">Improve your document</h1><p className="mt-2 max-w-2xl text-[#f4f7fb]/60">Paste your text or upload a document. Legnoova can make it clearer, more professional and easier to read while keeping the original meaning.</p></div>
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="rounded-[1.5rem] border border-[#f4f7fb]/15 bg-[#151d2b] p-5 shadow-sm sm:p-7">
            <label className="block text-sm font-semibold">Your text</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your letter, email, report or other document text here…" className="mt-2 min-h-64 w-full resize-y rounded-xl border border-[#f4f7fb]/15 bg-[#0d1117] p-4 text-sm leading-6 outline-none placeholder:text-[#f4f7fb]/35 focus:border-[#67e8f9]" />
            <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#f4f7fb]/20 bg-[#0d1117] p-4 text-sm hover:border-[#67e8f9]"><Upload className="h-5 w-5 text-[#67e8f9]" /><span><strong>{file ? file.name : "Upload a document"}</strong><span className="block text-xs text-[#f4f7fb]/50">TXT, PDF or DOCX</span></span><input type="file" accept=".txt,.pdf,.doc,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></label>
            <label className="mt-5 block text-sm font-semibold">What should improve?</label>
            <input value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Example: Make it shorter and more confident" className="mt-2 h-11 w-full rounded-xl border border-[#f4f7fb]/15 bg-[#0d1117] px-3 text-sm outline-none focus:border-[#67e8f9]" />
            <button onClick={() => void improve()} disabled={loading || (!text.trim() && !file)} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#f4f7fb] font-semibold text-[#0d1117] hover:bg-[#dfe8f2] disabled:cursor-not-allowed disabled:opacity-45">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-[#a78bfa]" />}{loading ? "Improving…" : "Improve my document"}</button>
          </section>
          <section className="min-h-[520px] rounded-[1.5rem] border border-[#f4f7fb]/15 bg-[#f4f7fb] p-5 text-[#0d1117] shadow-sm sm:p-7"><div className="flex items-center gap-3 border-b border-white/15 pb-4"><FileText className="h-5 w-5 text-[#a78bfa]" /><div><h2 className="font-serif text-xl font-bold">Improved version</h2><p className="text-xs text-white/55">Review every change before you use it</p></div></div>{result ? <div className="mt-6 whitespace-pre-wrap text-sm leading-7 text-white/80">{result}</div> : <div className="flex h-96 flex-col items-center justify-center text-center text-white/45"><Sparkles className="h-9 w-9 text-[#a78bfa]" /><p className="mt-4 max-w-xs text-sm">Your improved content will appear here.</p><p className="mt-3 flex items-center gap-1 text-xs"><Check className="h-3.5 w-3.5 text-[#a78bfa]" /> You stay in control of the final document</p></div>}</section>
        </div>
      </div>
    </main>
  );
}
