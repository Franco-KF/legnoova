import { MONEY_BACK_DAYS, TRIAL_DAYS } from "./billing";

export const faqs = [
  {
    question: "How does the free trial work?",
    answer: `Every paid plan starts with a ${TRIAL_DAYS}-day free trial. You add a payment method to begin, but you are not charged during the trial. We'll remind you before it ends — cancel any time before then and you'll never be charged. If you do nothing, your subscription simply continues at the plan's monthly price.`,
  },
  {
    question: "Is Legnoova financial advice?",
    answer:
      "No. Legnoova AI is an analysis and education tool. It provides market analysis for informational purposes only and never claims to guarantee trading results. Every signal is generated analysis — use it to validate your own decisions, and always do your own research before placing any trade.",
  },
  {
    question: "How is this different from a signal group?",
    answer:
      "Signal groups just tell you what to do. Legnoova publishes signals that show their work — every call ships with the entry, stop-loss, take-profit targets, risk:reward and the market structure evidence behind it. You keep making the decision; Legnoova AI gives you the reasoning to challenge it.",
  },
  {
    question: "What do I actually get with a signal?",
    answer:
      "A structured signal: direction (BUY/SELL with a confidence score), a precise entry, a stop-loss, dynamic take-profit targets (TP1–TP3) with risk:reward, and a collapsible breakdown explaining the setup. If there's no clear edge, you get a clear 'no trade' instead of a forced call.",
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