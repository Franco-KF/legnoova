import Link from "next/link";
import { Feather } from "lucide-react";

export default function FallbackLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#24231f]">
      <header className="border-b border-[#24231f]/10 bg-[#f7f4ee]/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/fallback" className="flex items-center gap-2.5 font-serif text-xl font-bold tracking-tight"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#24231f] text-[#f7f4ee]"><Feather className="h-4 w-4" /></span>Legnoova</Link>
          <div className="hidden items-center gap-6 text-sm font-medium sm:flex"><Link href="/fallback/pricing" className="hover:text-[#b45309]">Pricing</Link><Link href="/fallback/faq" className="hover:text-[#b45309]">Questions</Link><Link href="/fallback/dashboard" className="rounded-full bg-[#24231f] px-4 py-2.5 text-[#f7f4ee] transition-transform hover:-translate-y-0.5">Open editor</Link></div>
          <Link href="/fallback/dashboard" className="rounded-full bg-[#24231f] px-3.5 py-2 text-xs font-semibold text-[#f7f4ee] sm:hidden">Open editor</Link>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="border-t border-[#24231f]/10 bg-[#eee9df] py-10"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-5 text-xs text-[#24231f]/65 sm:px-8"><span>© 2026 Legnoova Studio</span><div className="flex flex-wrap gap-x-5 gap-y-2"><Link href="/fallback/about">About</Link><Link href="/fallback/contact">Contact</Link><Link href="/fallback/privacy">Privacy</Link><Link href="/fallback/terms">Terms</Link><Link href="/fallback/refunds">Refunds</Link></div></div></footer>
    </div>
  );
}
