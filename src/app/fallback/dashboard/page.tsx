"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Loader2, Sparkles, Upload, Feather } from "lucide-react";

export default function FallbackDashboardPage() {
  const [file, setFile] = useState<File | null>(null);
  const [goal, setGoal] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const improve = async () => {
    if (!file && !goal.trim()) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setResult("Your improved letter will appear here after the AI writing service is connected. The workspace is ready for document upload, role details and reviewable output.");
    setLoading(false);
  };

  return <main className="min-h-screen bg-background"><header className="border-b border-white/[0.06]"><nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"><Link href="/fallback" className="flex items-center gap-2 font-heading text-lg font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 text-white"><Feather className="h-4 w-4" /></span>LetterLift</Link><Link href="/fallback" className="text-sm text-muted-foreground hover:text-foreground">Back to home</Link></nav></header><div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-violet-300">Writing workspace</p><h1 className="mt-2 font-heading text-3xl font-bold">Improve your job letter</h1><p className="mt-2 text-sm text-muted-foreground">Upload a draft and tell us what role you are applying for.</p></div><div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]"><section className="space-y-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"><label className="block"><span className="text-sm font-semibold">Your draft</span><span className="mt-2 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] p-5 text-center hover:border-violet-400/50"><Upload className="h-7 w-7 text-violet-300" /><span className="mt-3 text-sm">{file ? file.name : "Choose a document or text file"}</span><span className="mt-1 text-xs text-muted-foreground">DOCX, PDF or TXT</span><input type="file" className="hidden" accept=".docx,.pdf,.txt" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></span></label><label className="block"><span className="text-sm font-semibold">What role are you applying for?</span><textarea value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="Example: Marketing coordinator at a growing software company" className="mt-2 min-h-28 w-full rounded-xl border border-white/10 bg-black/10 p-3 text-sm outline-none focus:border-violet-400" /></label><button onClick={() => void improve()} disabled={loading || (!file && !goal.trim())} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-500 font-semibold text-white hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}{loading ? "Improving…" : "Improve my letter"}</button></section><section className="min-h-[420px] rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-violet-300" /><h2 className="font-heading font-semibold">Your improved letter</h2></div>{result ? <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-foreground/80">{result}</p> : <div className="flex h-80 flex-col items-center justify-center text-center"><Sparkles className="h-8 w-8 text-muted-foreground/40" /><p className="mt-4 text-sm text-muted-foreground">Your result will appear here for review.</p></div>}</section></div></div></main>;
}
