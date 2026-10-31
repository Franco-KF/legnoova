import Link from "next/link";
import { Feather } from "lucide-react";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f4ee] text-[#24231f]">
      <header className="border-b border-[#24231f]/10 bg-[#f7f4ee]/95 backdrop-blur-xl">
        <nav className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-serif text-xl font-bold"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#24231f] text-[#f7f4ee]"><Feather className="h-4 w-4" /></span>Legnoova AI</Link>
          <div className="hidden items-center gap-6 text-sm font-medium sm:flex"><Link href="/#how" className="hover:text-[#b45309]">How it works</Link><Link href="/pricing" className="hover:text-[#b45309]">Pricing</Link><Link href="/#support" className="hover:text-[#b45309]">Support</Link><Link href="/fallback/dashboard" className="rounded-full bg-[#24231f] px-4 py-2.5 text-[#f7f4ee] hover:bg-[#3b3933]">Open workspace</Link></div><Link href="/fallback/dashboard" className="rounded-full bg-[#24231f] px-3.5 py-2 text-xs font-semibold text-[#f7f4ee] sm:hidden">Open workspace</Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
