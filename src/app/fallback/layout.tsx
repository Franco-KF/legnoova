import Link from "next/link";
import { WandSparkles } from "lucide-react";

export default function FallbackLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/[0.06] bg-background/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/fallback" className="flex items-center gap-2 font-heading text-lg font-bold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-indigo-500 text-white"><WandSparkles className="h-4 w-4" /></span>LetterLift</Link>
          <div className="flex items-center gap-1 sm:gap-3"><Link href="/fallback/pricing" className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Pricing</Link><Link href="/fallback/dashboard" className="rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground">Workspace</Link></div>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="border-t border-white/[0.06] py-8"><div className="mx-auto flex max-w-7xl flex-wrap gap-x-5 gap-y-2 px-4 text-xs text-muted-foreground sm:px-6 lg:px-8"><span>© 2026 LetterLift</span><Link href="/fallback/about">About</Link><Link href="/fallback/contact">Contact</Link><Link href="/fallback/faq">FAQ</Link><Link href="/fallback/privacy">Privacy</Link><Link href="/fallback/terms">Terms</Link><Link href="/fallback/refunds">Refund policy</Link></div></footer>
    </div>
  );
}
