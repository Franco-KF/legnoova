import { MONEY_BACK_DAYS, TRIAL_DAYS } from "./billing";

export const faqs = [
  {
    question: "How does the free trial work?",
    answer: `Start with a ${TRIAL_DAYS}-day free trial. You need to add a payment method, but we won't charge you during the trial. Cancel before it ends to avoid the monthly charge. If you keep your plan, it will renew at its listed price.`,
  },
  {
    question: "Is Legnoova financial advice?",
    answer:
      "No. Legnoova helps you read a chart. It is not a broker and cannot promise trading results. Check the analysis, manage your risk and make your own choice.",
  },
  {
    question: "How is this different from a signal group?",
    answer:
      "Stop jumping between chats. Check your chart, follow signals, get alerts and keep your notes in one place. Legnoova explains its view, but it cannot promise a winning trade.",
  },
  {
    question: "What do I actually get with a signal?",
    answer:
      "A possible direction, entry, stop and take-profit levels, plus the reasons behind them. These are estimates, not orders. If the chart is unclear, Legnoova may say WAIT.",
  },
  {
    question: "What chart screenshots do you accept?",
    answer:
      "Upload a clear PNG, JPG, JPEG or WEBP screenshot of one chart. A sharp, easy-to-read image helps Legnoova give you a better review.",
  },
  {
    question: "What does 'WAIT' / no trade mean?",
    answer:
      "It means the chart is unclear or the different chart checks do not agree. Legnoova would rather tell you to wait than push a weak idea.",
  },
  {
    question: "How do the strategies work together?",
    answer:
      "Legnoova checks price moves, trends, key levels and other common trading ideas. It shows where those views agree or differ. Agreement does not mean a trade will win.",
  },
  {
    question: "Does Legnoova automate trades through my broker?",
    answer:
      "Broker automation is being built for the $59 plan. The current app does not place trades. You stay in control of every decision.",
  },
  {
    question: "Is the win rate 92%, and will Legnoova make me profitable?",
    answer:
      "No. We do not claim a verified 92% win rate or promise profits. Trading is risky, and AI can be wrong. Never risk money you cannot afford to lose.",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes. Cancel from your billing page at any time. You can keep using the plan until your paid time ends.",
  },
  {
    question: "What is your money-back guarantee?",
    answer: `If Legnoova isn't right for you, ask for a refund within ${MONEY_BACK_DAYS} days of your first payment. After that, you can still cancel to stop future payments.`,
  },
  {
    question: "Is my data private?",
    answer:
      "Your charts and analyses are private to your account. Some signals may appear in the market feed without your personal details. We do not sell your data.",
  },
];
