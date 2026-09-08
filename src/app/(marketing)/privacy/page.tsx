import type { Metadata } from "next";
import { SubpageHero } from "@/components/marketing/subpage-hero";
import { siteUrl } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Legnoova AI privacy policy — how we collect, use and protect your data. Your charts and analyses are private and only accessible to you.",
  alternates: {
    canonical: `${siteUrl}/privacy`,
  },
};

const sections = [
  {
    title: "1. Information We Collect",
    body: "We collect information you provide directly, such as your name, email address, and account details. We also collect data about your usage of the platform, including charts you upload and analyses you run.",
  },
  {
    title: "2. How We Use Information",
    body: "We use your information to provide and improve the service, process analyses, manage your subscription, and communicate with you about your account.",
  },
  {
    title: "3. Data Security",
    body: "We implement industry-standard security measures including encryption and secure authentication to protect your personal data. Broker credentials, where applicable, are never stored in plaintext.",
  },
  {
    title: "4. Sharing of Information",
    body: "We do not sell your personal data. We only share information with trusted service providers who need it to operate the platform (such as our Legnoova AI engine and billing providers), and only to the extent necessary.",
  },
  {
    title: "5. Data Retention",
    body: "We retain your data for as long as your account is active. You may delete your account and associated data at any time through the settings page.",
  },
  {
    title: "6. Your Rights",
    body: "Depending on your jurisdiction, you may have rights to access, correct, or delete your personal data, or to object to certain processing. Contact us to exercise these rights.",
  },
  {
    title: "7. Contact",
    body: "If you have questions about this privacy policy or your data, please contact us through the platform.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SubpageHero
        eyebrow="Legal"
        title="Privacy Policy"
        subtitle="We take your privacy seriously."
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
