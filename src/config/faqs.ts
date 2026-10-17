import { MONEY_BACK_DAYS, TRIAL_DAYS } from "./billing";

export const faqs = [
  {
    question: "How does the free trial work?",
    answer: `Every paid plan starts with a ${TRIAL_DAYS}-day free trial. You add a payment method to begin, but you are not charged during the trial. We'll remind you before it ends — cancel any time before then and you'll never be charged. If you do nothing, your subscription simply continues at the plan's monthly price.`,
  },
  {
    question: "Is Legnoova financial advice?",
    answer:
      "No. Legnoova AI is a chart-analysis tool, not a broker or a guarantee of trading results. Treat its output as information to review alongside your own research and risk management. You make every trading decision.",
  },
  {
    question: "How is this different from a signal group?",
    answer:
      "Instead of piecing together calls across multiple chats, use one workspace for chart screenshot analysis, structured levels, a signals feed, alerts and a journal. Legnoova shows its reasoning so you can review it; it does not promise better or profitable trades.",
  },
  {
    question: "What do I actually get with a signal?",
    answer:
      "A structured analysis with a potential direction, entry, stop-loss, take-profit targets and a breakdown of the chart evidence. These are estimates, not instructions or guaranteed execution prices. If evidence is unclear, the analysis can return a no-trade view.",
  },
  {
    question: "What chart screenshots do you accept?",
    answer:
      "We accept PNG, JPG, JPEG and WEBP images. Your chart should be a clear screenshot of a chart view so Legnoova AI can reliably extract visible structure.",
  },
  {
    question: "What does 'WAIT' / no trade mean?",
    answer:
      "When your uploaded chart lacks clear evidence, or the independent strategies strongly disagree, Legnoova AI returns a no-trade verdict rather than inventing a setup. This is by design — we never force a signal when conditions aren't clear.",
  },
  {
    question: "How do the strategies work together?",
    answer:
      "Each strategy module analyzes the chart independently (Price Action, Market Structure, Trend, Support & Resistance, Breakout, Supply & Demand, Smart Money Concepts). A consensus engine weighs their agreement and produces the final signal with a confidence score.",
  },
  {
    question: "Does Legnoova automate trades through my broker?",
    answer:
      "Broker automation is the next implementation focus for the $59 plan and is in development. Current chart analysis does not place or execute trades for you. You remain responsible for every trade decision.",
  },
  {
    question: "Is the win rate 92%, and will Legnoova make me profitable?",
    answer:
      "Legnoova does not guarantee a win rate or profitability. We do not publish a verified 92% performance claim. Trading results vary, and AI-generated analysis can be wrong. Evaluate any performance claim using a transparent, independently verifiable track record before relying on it.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes — cancel whenever you like from your billing page, with no fees or penalties. Your access continues until the end of the period you've already paid for, and you can resubscribe at any time.",
  },
  {
    question: "What is your money-back guarantee?",
    answer: `If Legnoova isn't right for you, request a full refund within ${MONEY_BACK_DAYS} days of your first charge (the day your free trial ends) and we'll return it in full — no questions asked. After that window, subscriptions are non-refundable, but you can still cancel at any time to stop future charges.`,
  },
  {
    question: "Is my data private?",
    answer:
      "Your charts and analyses are private and only accessible to you. High-confidence signals may be aggregated anonymously into the market feed with no personal information attached. We never sell your data.",
  },
];
