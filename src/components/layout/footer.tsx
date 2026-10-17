import Link from "next/link";
import { Logo } from "./logo";
import { MONEY_BACK_DAYS, TRIAL_DAYS } from "@/config/billing";
import { siteConfig } from "@/config/site";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/how-it-works", label: "How It Works" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/#faq", label: "FAQ" },
      { href: `mailto:${siteConfig.contactEmail}`, label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-5">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
              Legnoova helps you take a closer look at your forex chart before
              you decide what to do next. You stay in control of every trade.
            </p>
            <p className="mt-4 text-xs font-medium text-emerald-400/90">
              {TRIAL_DAYS}-day free trial · {MONEY_BACK_DAYS}-day money-back
              guarantee · Cancel anytime
            </p>
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="mt-4 inline-block text-sm text-foreground/80 transition-colors hover:text-emerald-400"
            >
              {siteConfig.contactEmail}
            </a>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    {link.href.startsWith("/") ? (
                      <Link
                        href={link.href}
                        className="text-sm text-foreground/80 transition-colors hover:text-emerald-400"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-foreground/80 transition-colors hover:text-emerald-400"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-center gap-4 border-t border-white/[0.06] pt-8">
          <p className="text-xs text-muted-foreground/70">
            © {new Date().getFullYear()} Legnoova. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
