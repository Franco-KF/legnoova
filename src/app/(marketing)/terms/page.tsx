import { SubpageHero } from "@/components/marketing/subpage-hero";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of service for Legnoova.",
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using Legnoova, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.",
  },
  {
    title: "2. Informational Use Only",
    body: "Legnoova provides AI-generated market analysis for informational and educational purposes only. Nothing on the platform constitutes financial, investment, or trading advice. Analysis does not guarantee trading results. You are solely responsible for any trading decisions you make.",
  },
  {
    title: "3. Accounts and Subscriptions",
    body: "You are responsible for maintaining the confidentiality of your account credentials. Subscriptions are billed on a recurring basis and can be managed or canceled through your billing page.",
  },
  {
    title: "4. Acceptable Use",
    body: "You agree not to misuse the service, upload harmful content, attempt to access other users' data, or use the platform for any unlawful purpose.",
  },
  {
    title: "5. Intellectual Property",
    body: "All content, software, and design associated with Legnoova are the property of Legnoova and its licensors, protected by applicable intellectual property laws.",
  },
  {
    title: "6. Limitation of Liability",
    body: "To the maximum extent permitted by law, Legnoova shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.",
  },
  {
    title: "7. Changes to Terms",
    body: "We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the revised terms.",
  },
];

export default function TermsPage() {
  return (
    <>
      <SubpageHero
        eyebrow="Legal"
        title="Terms of Service"
        subtitle="Please read these terms carefully before using Legnoova."
      />
      <section className="py-16">
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6 lg:px-8">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="font-heading text-lg font-semibold">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {section.body}
              </p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground/70">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </section>
    </>
  );
}
