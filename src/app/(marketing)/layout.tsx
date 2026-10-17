import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* Page-wide grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Subtle grid across the whole page */}
        <div className="grid-bg-pattern-fine absolute inset-0 opacity-60" />
        {/* Spotlight grid behind the hero for emphasis */}
        <div className="grid-bg-pattern-fine mask-radial-top absolute inset-0" />
        {/* Fade the grid toward the footer */}
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
