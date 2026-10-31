import Link from "next/link";
import { Feather } from "lucide-react";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f4f7fb]">
      <header className="border-b border-[#f4f7fb]/10 bg-[#0d1117]/95 backdrop-blur-xl">
        <nav className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-serif text-xl font-bold"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f4f7fb] text-[#0d1117]"><Feather className="h-4 w-4" /></span>Legnoova AI</Link>
          <div className="hidden items-center gap-6 text-sm font-medium sm:flex"><Link href="/#how" className="hover:text-[#67e8f9]">How it works</Link><Link href="/pricing" className="hover:text-[#67e8f9]">Pricing</Link><Link href="/#support" className="hover:text-[#67e8f9]">Support</Link><Link href="/fallback/dashboard" className="rounded-full bg-[#f4f7fb] px-4 py-2.5 text-[#0d1117] hover:bg-[#dfe8f2]">Open workspace</Link></div><Link href="/fallback/dashboard" className="rounded-full bg-[#f4f7fb] px-3.5 py-2 text-xs font-semibold text-[#0d1117] sm:hidden">Open workspace</Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
