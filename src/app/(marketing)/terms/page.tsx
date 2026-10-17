import type { Metadata } from "next";
import { SubpageHero } from "@/components/marketing/subpage-hero";
import { MONEY_BACK_DAYS, TRIAL_DAYS } from "@/config/billing";
import { siteConfig, siteUrl } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Legnoova AI terms of service, including free-trial, billing, auto-renewal, cancellation and refund terms. Informational and educational use only — analysis does not constitute financial advice or guarantee trading results.",
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using Legnoova, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use the service. You must be at least 18 years old and legally able to enter into a binding contract to create an account.",
  },
  {
    title: "2. Informational and Educational Use Only",
    body: "Legnoova AI provides market analysis for informational and educational purposes only. Nothing on the platform constitutes financial, investment, or trading advice, and nothing is a recommendation to buy or sell any instrument. Analysis does not guarantee trading results. You are solely responsible for any trading decisions you make and for managing your own risk.",
  },
  {
    title: "3. Accounts",
    body: "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You agree to provide accurate information and to notify us promptly of any unauthorized use. Access to paid features is tied to an active subscription.",
  },
  {
    title: "4. Free Trial",
    body: `New subscribers may start with a ${TRIAL_DAYS}-day free trial. A valid payment method is required to begin the trial, but you will not be charged during the trial period. We will remind you before the trial ends. If you cancel before the trial ends, you will not be charged and the subscription will not continue. If you do not cancel, your paid subscription begins automatically when the trial ends and you will be charged the then-current monthly price for your selected plan, and thereafter on a recurring basis.`,
  },
  {
    title: "5. Billing, Auto-Renewal and Payment",
    body: "Paid plans are billed in advance on a recurring monthly basis. By starting a subscription you authorize us (and our payment processor) to charge your chosen payment method automatically each billing period until you cancel. Prices are shown in U.S. dollars and may exclude applicable taxes, which will be added where required. If a payment fails, we may retry it and may suspend access until the balance is settled. We will give reasonable notice before changing subscription prices, and continued use after the effective date constitutes acceptance of the new price.",
  },
  {
    title: "6. Cancellation",
    body: "You may cancel your subscription at any time from your billing page, with no cancellation fee. Cancellation takes effect at the end of the billing period you have already paid for; you will continue to have access until then, after which your account moves to the free tier. Canceling does not by itself entitle you to a refund of a charge already made, except as set out in the refund section below or where required by law.",
  },
  {
    title: "7. Refunds and Money-Back Guarantee",
    body: `If you are not satisfied, you may request a full refund of your first paid charge within ${MONEY_BACK_DAYS} days of the date that charge was made (the day your free trial ended). Refund requests can be made by contacting ${siteConfig.contactEmail} from the email address on your account. Approved refunds are returned to the original payment method. After the ${MONEY_BACK_DAYS}-day window, payments are non-refundable, but you may still cancel at any time to prevent future charges. Nothing in this section limits any non-waivable statutory rights you may have under applicable consumer law.`,
  },
  {
    title: "8. Acceptable Use",
    body: "You agree not to misuse the service, upload harmful or unlawful content, attempt to access other users' data, resell or redistribute analysis without permission, or use the platform for any unlawful purpose or in violation of any applicable trading or financial regulations.",
  },
  {
    title: "9. Intellectual Property",
    body: "All content, software, and design associated with Legnoova are the property of Legnoova and its licensors, protected by applicable intellectual property laws. Your subscription grants you a personal, non-transferable, non-exclusive right to access the service for your own use.",
  },
  {
    title: "10. Disclaimers and Limitation of Liability",
    body: "The service is provided on an \"as is\" and \"as available\" basis without warranties of any kind, express or implied. Trading foreign exchange and other financial instruments carries a high level of risk and may not be suitable for all investors. To the maximum extent permitted by law, Legnoova shall not be liable for any indirect, incidental, special, consequential, or trading-related losses arising from your use of the service.",
  },
  {
    title: "11. Changes to These Terms",
    body: "We may update these terms from time to time, including to reflect changes in law or our service. Where changes are material, we will provide reasonable notice. Continued use of the service after changes take effect constitutes acceptance of the revised terms.",
  },
  {
    title: "12. Contact",
    body: `Questions about these terms, your subscription, or a refund request? Contact us at ${siteConfig.contactEmail} and we'll be glad to help.`,
  },
];

export default function TermsPage() {
  return (
    <>
      <SubpageHero
        eyebrow="Legal"
        title="Terms of Service"
        subtitle="Plain-language terms covering your free trial, billing, cancellation and money-back guarantee."
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
