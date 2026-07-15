// MILVERSE — "Inspired by a real case" registry.
// Attach to official scenarios. Community stories generate this from submission data.
// Rule: describe PATTERNS ONLY. No victim names, no real quotes, no PII.

export interface InspiredByCase {
  patternName: string;
  country: string;
  year: string;
  whatHappened: string; // 2-3 sentences, tactics only
  prevention: string[];
}

// Keyed by scenario id. Pakistan-rooted patterns for official Mirror + Feed scenarios.
// Keyed by scenario id.
export const INSPIRED_BY: Record<string, InspiredByCase> = {
  "pk-prize-sms": {
    patternName: "SMS Prize / Inam Fraud",
    country: "Pakistan",
    year: "2018–ongoing",
    whatHappened:
      "Fraud rings send bulk SMS congratulating victims on a lottery, jazz balance bonus, or corporate 'inam' scheme. A follow-up call collects an 'unlocking fee' via easypaisa/jazzcash. FIA and PTA have flagged thousands of complaints annually.",
    prevention: [
      "Real lotteries never require a fee to release winnings.",
      "Cross-check the claimed brand's official helpline — never the number in the SMS.",
      "Any request to share an OTP or PIN is the scam itself.",
    ],
  },
  "pk-wrong-txn": {
    patternName: "Wrong-Transaction Wallet Reversal",
    country: "Pakistan",
    year: "2020–ongoing",
    whatHappened:
      "Scammer sends a fake JazzCash/Easypaisa 'received' SMS then calls apologising for the wrong transfer, begging the victim to send it back. The original transfer never happened — the SMS was spoofed or a screenshot.",
    prevention: [
      "Check your actual wallet balance in the app before returning any amount.",
      "SMS sender IDs can be spoofed — screenshots are not proof.",
      "If money truly arrived by mistake, the sender can reverse it via their own bank/wallet, not through you.",
    ],
  },
  "pk-online-buyer": {
    patternName: "OLX / Online-Marketplace 'Buyer' QR Scam",
    country: "Pakistan",
    year: "2021–ongoing",
    whatHappened:
      "A fake buyer messages a seller, insists on paying by QR, and shares a QR that actually initiates a debit from the seller's account. The 'buyer' walks the seller through scanning while claiming it's a receive-code.",
    prevention: [
      "Scanning a QR to RECEIVE money is not how wallets work — sellers show, buyers scan.",
      "If a 'buyer' insists you scan their code, end the conversation.",
      "Meet in person for cash on delivery whenever possible.",
    ],
  },
  "pk-dream-job": {
    patternName: "Task-Job / Telegram Commission Scam",
    country: "Pakistan / South Asia",
    year: "2022–ongoing",
    whatHappened:
      "Victims are recruited into a Telegram/WhatsApp group promising per-task commissions (like/rate/review). Small early payouts build trust; then a 'combo task' requires the victim to deposit their own money to 'unlock' bigger commissions — which never arrive.",
    prevention: [
      "Legitimate employers never ask employees to deposit their own money.",
      "Reverse-search the company name + 'scam' before joining.",
      "A job that requires you to recruit others is a pyramid, not a job.",
    ],
  },
  "survivor-bankfraud": {
    patternName: "Fake Bank Helpline / OTP Handover",
    country: "Pakistan",
    year: "2019–ongoing",
    whatHappened:
      "Caller poses as a bank fraud team, warns of a 'suspicious transaction,' and manufactures urgency so the victim reads out an OTP or clicks a phishing link. Once the OTP is shared, the account is drained within minutes.",
    prevention: [
      "No real bank will ever ask you to read an OTP over the phone.",
      "Hang up and call the number printed on the back of your card.",
      "Urgency is the whole scam — the more they rush you, the more you should slow down.",
    ],
  },
  // Feed scenarios
  "bank-rumor": {
    patternName: "Bank-Closure / Cash-Rush WhatsApp Rumor",
    country: "Pakistan",
    year: "2020, 2022, 2023",
    whatHappened:
      "Cyclical forwards claim all banks will shut for several days, driving families to withdraw cash in a panic. The rumour tends to spike during political or economic instability and is regularly denied by the State Bank of Pakistan.",
    prevention: [
      "Check the State Bank of Pakistan's official website or verified socials before acting.",
      "Panic-cash-withdrawals are exactly what rumour-spreaders want.",
      "Ask: is this on any TV news channel, or only in family WhatsApp?",
    ],
  },
  "flood-photo": {
    patternName: "Disaster-Donation Impersonation",
    country: "Pakistan",
    year: "2010, 2022 floods",
    whatHappened:
      "Fake relief posts circulate during floods, mimicking Edhi, Alkhidmat, or JDC branding but redirecting donations to personal wallets. The urgency of the disaster suppresses verification.",
    prevention: [
      "Donate only through the official website printed on the organisation's verified social account.",
      "Verified relief orgs publish audited account numbers — screenshot forwards do not.",
      "Slow down 24 hours before donating from a forwarded message.",
    ],
  },
};
