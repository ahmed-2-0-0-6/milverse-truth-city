// MILVERSE — The Feed (mass-deception wing).
// The PERSON is real and sincere. The CLAIM might not be.
// Verdicts: TRUE / FALSE / MISLEADING / UNVERIFIED.

import type { InspiredByCase } from "@/lib/mirror/inspired";

export type FeedTier = 1 | 2 | 3;
export type FeedVerdict = "TRUE" | "FALSE" | "MISLEADING" | "UNVERIFIED";

export interface FeedAction {
  id: string;
  label: string;
  result: string;
  decisive?: boolean;
}

export interface FeedForward {
  headline?: string;
  imageAlt?: string;
  imageEmoji?: string;
  bodyLines: string[];
  meta?: string;
}

export interface FeedScenario {
  id: string;
  title: string;
  teaser: string;
  tier: FeedTier;
  verdict: FeedVerdict;
  sender: {
    name: string;
    relationship: string;
    voice: string;
  };
  senderMotive: string;
  opener: string;
  forward: FeedForward;
  actions: FeedAction[];
  truthNote: string;
  respectfulScript: string;
  inspiredBy?: InspiredByCase;
}

export const FEED_SCENARIOS: FeedScenario[] = [
  /* ── T1 FALSE — the bank rumor ─────────────────────────────── */
  {
    id: "bank-rumor",
    title: "The bank rumor",
    teaser: "Family group forward: \"All banks closing for 5 days — withdraw cash NOW.\"",
    tier: 1,
    verdict: "FALSE",
    sender: { name: "Uncle Tariq", relationship: "Family WhatsApp group", voice: "worried, well-meaning, uses caps and emojis" },
    senderMotive: "He genuinely wants to protect the family's savings. He is scared, not stupid.",
    opener: "Beta this is IMPORTANT!! 🚨 Read fast and go to ATM. Share with everyone in family.",
    forward: {
      meta: "Forwarded many times · via WhatsApp",
      headline: "BREAKING: All banks in Pakistan closing 5 days from Monday",
      imageEmoji: "📰",
      imageAlt: "Screenshot of a news-channel ticker",
      bodyLines: [
        "SBP has quietly ordered all commercial banks to shut for 5 working days.",
        "ATMs will be OFFLINE. Withdraw at least PKR 50,000 per family TODAY.",
        "Do not wait for official announcement — by then it will be too late.",
        "Forward to every group. Save your family.",
      ],
    },
    actions: [
      { id: "search-headline", label: "Search the headline", result: "No results on Dawn, Geo, ARY, or Tribune. Only WhatsApp mirrors and one Facebook page created 3 weeks ago.", decisive: true },
      { id: "check-channel", label: "Check the news channel's own site", result: "The channel's website has NO story matching this ticker. Real ticker font is thinner and yellow, not white bold.", decisive: true },
      { id: "check-sbp", label: "Check State Bank's official page", result: "State Bank of Pakistan has issued no such circular.", decisive: true },
      { id: "reverse-image", label: "Reverse-search the screenshot", result: "The ticker image appears in older 2022 posts with different text overlaid. Reused." },
      { id: "check-date", label: "Check the date on the forward", result: "No date visible. Generic — designed to feel current whenever forwarded." },
    ],
    truthNote: "There is no such SBP order. This is a recurring rumor that resurfaces every few months and triggers unnecessary ATM runs.",
    respectfulScript: "Chacha, I checked the news channel's website — they haven't run this story. And State Bank hasn't put out any circular. Looks like an old rumor doing the rounds again. I love that you're looking out for us though ❤️",
    inspiredBy: {
      patternName: "Fake Bank-Closure Panic Forward",
      country: "Pakistan / South Asia",
      year: "2019–ongoing",
      whatHappened: "Anonymous forwards periodically claim that a central bank has secretly ordered a multi-day banking freeze. The rumor peaks around currency shocks or elections. It has repeatedly triggered ATM queues and hoarding despite official denials.",
      prevention: [
        "Any 'quiet' order that only exists on WhatsApp is not an order.",
        "Central banks publish circulars on their own site — check there first.",
        "News-ticker screenshots are the most-doctored evidence there is.",
      ],
    },
  },

  /* ── T2 MISLEADING — the flood photo ───────────────────────── */
  {
    id: "flood-photo",
    title: "The flood photo",
    teaser: "\"Yesterday in Punjab — media is hiding it!\"",
    tier: 2,
    verdict: "MISLEADING",
    sender: { name: "Uncle Salman", relationship: "Direct message", voice: "angry, activist, distrusts mainstream media" },
    senderMotive: "He genuinely believes he is exposing a cover-up. Correcting him feels like siding with the enemy.",
    opener: "Look at this and tell me media isn't hiding things. This is Punjab YESTERDAY. Share everywhere.",
    forward: {
      meta: "Forwarded",
      imageEmoji: "🌊",
      imageAlt: "A striking photo of a flooded street with people wading through waist-deep water",
      bodyLines: [
        "Punjab under water. Not a single channel is showing this.",
        "Government too busy with politics. People dying and nobody cares.",
      ],
    },
    actions: [
      { id: "reverse-image", label: "Reverse-search the photo", result: "The exact same image appears in international news archives from 2020 — captioned as flooding in Jakarta, Indonesia.", decisive: true },
      { id: "check-signs", label: "Zoom into the signage in the image", result: "Shop signage in the background is in Bahasa Indonesia. Vehicles are right-hand-drive Toyotas with Indonesian plates.", decisive: true },
      { id: "check-flood-status", label: "Check if Punjab actually has flooding right now", result: "PDMA and multiple newsrooms ARE currently reporting localized flooding in southern Punjab — but with different, verified photos.", decisive: true },
      { id: "check-caption", label: "Search the exact caption", result: "The caption text appears on dozens of unrelated posts over the years, always with different photos. Boilerplate." },
    ],
    truthNote: "The flooding is real. THIS PHOTO is not. It's from Indonesia, 2020. TRUE core wrapped in a FALSE image. Verdict: MISLEADING, not simply fake.",
    respectfulScript: "Uncle the flooding is 100% real and being covered — but this specific photo is from Jakarta in 2020. Using a wrong photo actually gives the deniers ammo. Share the real PDMA photos instead — they're more powerful.",
    inspiredBy: {
      patternName: "Recycled Disaster Photo",
      country: "Global",
      year: "2015–ongoing",
      whatHappened: "During every major disaster, unrelated dramatic photos from earlier events in other countries are re-captioned as 'today, here'. The underlying disaster is real, so the false photo feels emotionally 'true' — and correcting it feels like denialism.",
      prevention: [
        "Reverse-image every dramatic viral photo before sharing.",
        "Zoom into signage, license plates, and weather details.",
        "A real disaster has real photos — insist on those.",
      ],
    },
  },

  /* ── T2 TRUE — the unbelievable story (paranoia trap) ──────── */
  {
    id: "unbelievable-true",
    title: "The unbelievable story",
    teaser: "A classmate sends a wild-sounding news item. Everything actually checks out.",
    tier: 2,
    verdict: "TRUE",
    sender: { name: "Maryam", relationship: "Classmate", voice: "excited, curious, sends receipts" },
    senderMotive: "She's genuinely surprised and wants to fact-check with you. Dismissing her rudely will make her stop bringing you anything.",
    opener: "Yaar you'll never believe this — apparently there's an official announcement about it. Real or fake??",
    forward: {
      meta: "Screenshot + link",
      headline: "Provincial ministry announces free public wi-fi for entire metro-bus network by next quarter",
      imageEmoji: "📶",
      imageAlt: "Screenshot of a news article headline with a ministry logo",
      bodyLines: [
        "Announcement covers all metro routes.",
        "Rollout begins in stages.",
        "Free tier capped at 500 MB per user per day.",
      ],
    },
    actions: [
      { id: "search-headline", label: "Search the headline", result: "Multiple established newsrooms carry the story with independent quotes from the transport minister.", decisive: true },
      { id: "check-ministry", label: "Check the ministry's own press page", result: "A formal press release dated last week, with attached tender documents. Matches the article.", decisive: true },
      { id: "check-date", label: "Check the date on the article", result: "Published 4 days ago. Recent, not resurfaced." },
      { id: "reverse-image", label: "Reverse-search the article screenshot", result: "Screenshot appears only on the original newsroom's page. Not a template, not doctored." },
      { id: "check-critical-coverage", label: "Look for critical / opposition takes", result: "Opposition figures are ARGUING about feasibility. Nobody disputes the announcement happened.", decisive: true },
    ],
    truthNote: "This one is genuinely TRUE. If earlier scenarios trained you to reflex-dismiss, that reflex just became the problem. Rejecting truth as fake is called a FALSE ALARM.",
    respectfulScript: "Actually checked it — multiple outlets and the ministry's own press page have it. Real. Nice catch bringing it to check first though 👏",
  },

  /* ── T3 FALSE — miracle cure (emotional) ───────────────────── */
  {
    id: "miracle-cure",
    title: "The miracle cure",
    teaser: "A worried aunt shares a health remedy \"doctors don't want you to know.\"",
    tier: 3,
    verdict: "FALSE",
    sender: { name: "Khala Nusrat", relationship: "Direct message", voice: "gentle, deeply worried, calls you 'beta'" },
    senderMotive: "Her sister-in-law is unwell. She's terrified and clinging to hope. Her dignity meter is fragile from the first message.",
    opener: "Beta please share this with your Ammi and forward to Naila also. Doctors won't tell you this — Allah has given us a cure in our own kitchen. Please beta, don't ignore.",
    forward: {
      meta: "Forwarded many times",
      headline: "The kitchen ingredient that CURES [serious illness] in 7 days — doctors hiding it",
      imageEmoji: "🌿",
      imageAlt: "A pastel infographic with a leaf motif and testimonial quotes",
      bodyLines: [
        "Take X boiled with Y every morning on empty stomach.",
        "Renowned foreign researcher confirmed the cure but was silenced.",
        "Hospitals lose money if this becomes known.",
        "SHARE to save one life.",
      ],
    },
    actions: [
      { id: "search-claim", label: "Search the exact medical claim", result: "AFP, Reuters Fact Check, Soch Fact Check have all debunked variants of this exact claim.", decisive: true },
      { id: "check-researcher", label: "Look up the \"renowned researcher\"", result: "Name either does not exist in any academic database, or is real but attached to a completely different field.", decisive: true },
      { id: "check-medical-body", label: "Check what a real medical body says", result: "WHO and the national health ministry explicitly warn against this remedy and note it can DELAY real treatment.", decisive: true },
      { id: "check-formatting", label: "Look at how the message is framed", result: "\"Doctors hiding it,\" \"share to save a life,\" round-number promises. Classic health-misinformation signatures." },
    ],
    truthNote: "This kind of forward can literally kill people by making them skip real treatment. The sender isn't malicious — she's scared for someone she loves.",
    respectfulScript: "Khala jaan I know how worried you are for Naila — I checked properly. WHO and Aga Khan both say this specific remedy doesn't work and can actually delay real treatment. Let's not share this one. But please tell me what the doctors have said — maybe we can help her another way ❤️",
  },

  /* ── T1 FALSE — free laptop scheme ─────────────────────────── */
  {
    id: "free-laptop",
    title: "The free-laptop scheme",
    teaser: "\"Government giving free laptops to all students — register in 24hrs via this link!\"",
    tier: 1,
    verdict: "FALSE",
    sender: { name: "Cousin Bilal", relationship: "Family group", voice: "helpful, wants to look useful, forwards fast" },
    senderMotive: "He genuinely thinks he's helping his younger cousins get a free laptop.",
    opener: "Bhai jaldi register karo — sirf 24 ghante hain! Free laptop for ALL students, official scheme!",
    forward: {
      meta: "Forwarded many times",
      headline: "GOVT FREE LAPTOP SCHEME 2026 — Register within 24 hours",
      imageEmoji: "💻",
      imageAlt: "A pixelated banner with an unofficial-looking logo",
      bodyLines: [
        "All students eligible. No merit required.",
        "Register at the link below before it closes.",
        "Only Rs 250 processing fee via easypaisa.",
        "Forward to every student you know.",
      ],
    },
    actions: [
      { id: "check-official", label: "Check the official HEC / education-ministry site", result: "No such scheme announced. Their laptop programs are always merit-based and never charge fees.", decisive: true },
      { id: "inspect-link", label: "Inspect the registration link (without clicking)", result: "Lookalike domain — hyphens and extra letters mimicking a real .gov.pk address. Real government domains end in .gov.pk exactly.", decisive: true },
      { id: "search-news", label: "Search for news coverage of the scheme", result: "Zero mainstream coverage. Only Facebook pages and WhatsApp forwards, all created in the last 30 days." },
      { id: "check-fee", label: "Check whether real govt schemes charge a fee", result: "Legitimate student schemes NEVER ask for personal wallet payments to register.", decisive: true },
    ],
    truthNote: "Classic phishing bait: fake urgency, small 'fee', lookalike domain. The 24-hour deadline is designed to bypass careful checking.",
    respectfulScript: "Bhai I checked HEC's actual site — no such scheme. That link is a lookalike domain and the 'Rs 250 fee' is the scam. Please don't forward this to the younger cousins, they'll get their easypaisa drained.",
    inspiredBy: {
      patternName: "Fake Government Scheme Phishing",
      country: "Pakistan / India",
      year: "2020–ongoing",
      whatHappened: "Fraud rings advertise 'free' government laptops, sewing machines, or scholarships requiring a small 'processing fee' to a personal wallet. The links resolve to lookalike domains that harvest CNIC data. FIA cybercrime routinely takes down waves of these.",
      prevention: [
        "Real government schemes never charge a fee to a personal wallet.",
        "Verify domains — real ones end in .gov.pk exactly, no hyphens.",
        "A '24-hour deadline' on a life-changing benefit is the trap.",
      ],
    },
  },

  /* ── T2 FALSE — kidnap-van rumor ───────────────────────────── */
  {
    id: "kidnap-van",
    title: "The kidnap-van rumor",
    teaser: "\"White van kidnapping children in your area — share to all parents NOW.\"",
    tier: 2,
    verdict: "FALSE",
    sender: { name: "Aunty Rubina", relationship: "Neighborhood WhatsApp group", voice: "panicked, motherly, everything is in caps" },
    senderMotive: "She has three young children. This is the deepest fear a parent has, and someone she trusts sent it to her.",
    opener: "PLEASE PLEASE forward to every parent!! White van seen in OUR area kidnapping bachay!! Don't let kids play outside!!",
    forward: {
      meta: "Voice note + text · Forwarded many times",
      headline: "URGENT — Child-kidnapper van in the area",
      imageEmoji: "🚐",
      imageAlt: "A blurry photo of a generic white van",
      bodyLines: [
        "White van, no plates, seen near schools.",
        "Men inside grabbing children in broad daylight.",
        "Police doing nothing.",
        "Forward to every parent NOW.",
      ],
    },
    actions: [
      { id: "check-police", label: "Check with the local police station / 15", result: "No FIRs registered. Police confirm the same voice note has been circulating for over a year, moving from city to city.", decisive: true },
      { id: "check-news", label: "Check news for kidnapping reports in the area", result: "Zero credible reports match this specific claim. Newsrooms have debunked the voice note multiple times.", decisive: true },
      { id: "reverse-image", label: "Reverse-search the van photo", result: "Stock photo from a used-car listing in another country. Zero connection to the area.", decisive: true },
      { id: "trace-audio", label: "Listen to the voice note carefully", result: "Same voice, same wording used in near-identical forwards from Karachi, Lahore, and rural Punjab over 18 months. Template panic." },
    ],
    truthNote: "These 'child-kidnapper' voice notes have circulated for years across South Asia and beyond. In several countries they've led to lynchings of innocent strangers based on nothing. Fear travels faster than truth — that's the whole design.",
    respectfulScript: "Aunty I called 15 to check — no reports. This same voice note has been going around for over a year in different cities. Sharing it makes real parents panic and has actually got innocent people beaten up elsewhere. Better to send them the real school pickup safety tips ❤️",
    inspiredBy: {
      patternName: "Child-Kidnapper Van Panic",
      country: "Pakistan / India / global",
      year: "2017–ongoing",
      whatHappened: "Anonymous voice notes claiming child kidnappers in unmarked vans cycle through WhatsApp groups. In multiple documented cases they have caused mob attacks on strangers, including delivery workers and mentally-ill wanderers, who had nothing to do with any crime.",
      prevention: [
        "Fear-forwards spread fastest — treat them with the most skepticism, not the least.",
        "Verify against a real police helpline (in Pakistan, 15) before forwarding.",
        "'Share to every parent' is the signature of a hoax, not a warning.",
      ],
    },
  },

  /* ── T2 MISLEADING — the miracle doctor clip ──────────────── */
  {
    id: "doctor-clip",
    title: "The miracle-doctor clip",
    teaser: "A real doctor's real interview, cut to make him \"endorse\" a home remedy for diabetes.",
    tier: 2,
    verdict: "MISLEADING",
    sender: { name: "Uncle Farooq", relationship: "Family group", voice: "trusting, respects credentials, 'a doctor said it so it must be true'" },
    senderMotive: "His wife is pre-diabetic. This clip sounds like a real doctor giving real hope.",
    opener: "Dekho — asli doctor keh raha hai, sugar 7 din mein theek. Ammi ke liye share kar diya group mein.",
    forward: {
      meta: "Video clip · 42 seconds",
      headline: "Renowned doctor: kitchen remedy CURES diabetes in a week",
      imageEmoji: "🩺",
      imageAlt: "A short vertical clip of a doctor speaking",
      bodyLines: [
        "Doctor is real, hospital is real.",
        "Clip clearly shows him saying the remedy works.",
        "Millions of views — must be true.",
      ],
    },
    actions: [
      { id: "find-full-interview", label: "Find the FULL interview this clip is from", result: "The full 22-minute interview is on the newsroom's YouTube. In it the doctor says the OPPOSITE — the remedy does not work and can be dangerous if used to replace medication.", decisive: true },
      { id: "check-edit-points", label: "Look for edit cuts in the clip", result: "Three hard cuts around the key sentence. Sentence stitched from three different parts of the interview.", decisive: true },
      { id: "search-doctor-position", label: "Check the doctor's own public statement", result: "The doctor has publicly denounced the clip on his own social channels and asked people to stop sharing it.", decisive: true },
      { id: "check-medical-body", label: "Check what medical bodies say about the remedy", result: "Diabetes association explicitly warns against skipping medication for this remedy." },
    ],
    truthNote: "The clip is REAL footage — the doctor really exists and was really interviewed. But the framing is false. Real person, real face, false claim. That's why MISLEADING exists as a separate verdict — it hits harder than a straight fake.",
    respectfulScript: "Uncle asli clip main woh doctor bilkul ULTA keh raha hai — humein iska full interview mila. Woh khud keh raha hai yeh remedy khatarnak hai. Iss clip ko doctor ne bhi mana kiya hai. Ammi ke liye asli doctor's advice best hai ❤️",
    inspiredBy: {
      patternName: "Deceptive Edit of Real Expert",
      country: "Global",
      year: "2018–ongoing",
      whatHappened: "Genuine interviews with doctors, scientists, or officials are edited down to a few seconds that reverse the speaker's actual point. The subject's real face and real voice make the falsehood feel credible, and denials rarely reach the same audience as the clip.",
      prevention: [
        "Always find the full interview before believing a 30-second clip.",
        "Real experts often publicly denounce clips misusing them — search their name.",
        "Real footage + false framing is the most-used misinformation form today.",
      ],
    },
  },

  /* ── T2 TRUE — recalled medicine (paranoia trap) ──────────── */
  {
    id: "recalled-medicine",
    title: "The recalled medicine",
    teaser: "Scary forward: a common medicine batch has been recalled. Feels like a hoax — but it's true.",
    tier: 2,
    verdict: "TRUE",
    sender: { name: "Apa Sana", relationship: "Sister-in-law, direct message", voice: "concerned, mother-mode, careful with facts" },
    senderMotive: "Her mother takes this exact medicine daily. She wants a second pair of eyes before she panics her mother-in-law.",
    opener: "Yeh forward aya hai — DRAP ne recall kiya hai. Sach hai ya rumor? Ammi yehi lete hain roz.",
    forward: {
      meta: "Forwarded · with regulator screenshot",
      headline: "DRAP RECALLS BATCH OF COMMON BLOOD-PRESSURE MEDICINE",
      imageEmoji: "💊",
      imageAlt: "A regulator-style notice with a batch number",
      bodyLines: [
        "Batch number listed on the notice.",
        "Impurity detected in the batch.",
        "Users advised to check batch and return to pharmacy.",
      ],
    },
    actions: [
      { id: "check-drap", label: "Check DRAP's own website", result: "The recall notice is real and dated. Batch numbers match. DRAP has issued similar impurity recalls for this drug class before.", decisive: true },
      { id: "check-news", label: "Check news coverage", result: "Multiple newsrooms have carried the story with quotes from DRAP officials.", decisive: true },
      { id: "check-batch", label: "Cross-check the batch number format", result: "Batch number follows the manufacturer's real format. Nothing suspicious in the notice itself.", decisive: true },
      { id: "check-manufacturer", label: "Check the manufacturer's site", result: "The manufacturer has issued its own statement confirming the recall and offering exchanges." },
    ],
    truthNote: "TRUE. Real forwards that sound scary do exist. If you're primed to reflex-debunk everything, you'll dismiss real safety alerts — and that gets people hurt. The right move here is verify-then-warn, not verify-then-dismiss.",
    respectfulScript: "Apa main ne check kiya — bilkul asli hai, DRAP ki site pe hai notice. Ammi ki dawai ka batch number check karein aur pharmacy se exchange karwa lein. Achha kiya jo pehle check ki, ab confidently forward kar sakti hain family ko.",
    inspiredBy: {
      patternName: "Real Medicine Recall — Real Regulator Notice",
      country: "Pakistan / global",
      year: "2015–ongoing",
      whatHappened: "Drug regulators periodically recall batches of common medicines after impurity or contamination findings. These notices are genuine and safety-critical, but because 'scary forwards about medicine' are usually hoaxes, real recalls often get dismissed as rumors — and patients keep taking the affected batch.",
      prevention: [
        "Verify on the regulator's own site — don't dismiss on reflex.",
        "'Sounds unbelievable' is not evidence something is false.",
        "For safety notices, the correct action is verify-THEN-warn, not verify-then-dismiss.",
      ],
    },
  },

  /* ── T3 MISLEADING — old protest photo ────────────────────── */
  {
    id: "old-protest",
    title: "The old protest photo",
    teaser: "A dramatic crowd photo, captioned as 'yesterday' — really from another country in 2019.",
    tier: 3,
    verdict: "MISLEADING",
    sender: { name: "Cousin Umair", relationship: "Direct message", voice: "proud, chest-out, 'I was basically there'" },
    senderMotive: "He genuinely believes he's amplifying his own community's cause. Calling him out feels like calling him a liar in public.",
    opener: "Yaar dekh yeh crowd — this was YESTERDAY. History bana rahi hai humari qaum. Sab share karo.",
    forward: {
      meta: "Forwarded via WhatsApp",
      imageEmoji: "🏙️",
      imageAlt: "A vast crowd photo taken from above",
      bodyLines: [
        "Yesterday's local demonstration.",
        "Millions turned out — biggest in history.",
        "Foreign media not showing it.",
      ],
    },
    actions: [
      { id: "reverse-image", label: "Reverse-search the image", result: "Same image appears in international coverage of a 2019 protest in a different country. Original photographer credited on wire services.", decisive: true },
      { id: "check-weather", label: "Check the weather / clothing in the image", result: "Crowd is in winter coats; local weather right now is 34°C. Nothing matches.", decisive: true },
      { id: "check-local-news", label: "Check local news for yesterday's demonstration", result: "Local newsrooms did cover it — actual crowd photos exist, and the crowd is real but noticeably smaller than the reused image.", decisive: true },
      { id: "check-caption-history", label: "Search the caption text", result: "Same caption has been used with the same photo across at least four different countries in the last three years." },
    ],
    truthNote: "The local event IS real. The photo is not. This pattern makes real causes look dishonest — the strongest ammunition for opponents is a supporter's exaggerated image.",
    respectfulScript: "Bhai the event is real — but this specific photo is from a 2019 protest in another country. Reverse-image confirms it. Using the real local photos is stronger, not weaker, because they can't be discredited. Let me send you the actual local coverage.",
    inspiredBy: {
      patternName: "Recycled Crowd Photo",
      country: "Global",
      year: "2011–ongoing",
      whatHappened: "Dramatic crowd photos from earlier protests, sports events, or religious gatherings get re-captioned as 'today, here' to inflate the apparent size of a current cause. Once debunked, they become the go-to counter-argument used to discredit the entire real movement.",
      prevention: [
        "Reverse-image before amplifying any 'biggest ever' crowd photo.",
        "Weather, clothing, and skyline are quick sanity checks.",
        "For your own cause, real photos are stronger — they can't be discredited.",
      ],
    },
  },

  /* ── T3 FALSE — job circular PDF ──────────────────────────── */
  {
    id: "job-circular",
    title: "The fake job circular",
    teaser: "Official-looking PDF: government job openings, small application fee via wallet.",
    tier: 3,
    verdict: "FALSE",
    sender: { name: "Uncle Kashif", relationship: "Extended family group", voice: "generous, wants to help unemployed nephews, forwards without opening PDFs" },
    senderMotive: "His nephew has been jobless for months. This looks like a lifeline.",
    opener: "Bhai jaan yeh dekho — government mein bharti khul gayi hai. Apne bhaanjay ko bhi bhej dena, Rs 500 fee hai bas.",
    forward: {
      meta: "PDF attached",
      headline: "GOVT RECRUITMENT 2026 — 5000 posts open, apply via wallet",
      imageEmoji: "📄",
      imageAlt: "A PDF with government-style header and stamps",
      bodyLines: [
        "5000 vacancies across grades 5-14.",
        "Rs 500 non-refundable application fee via personal wallet number listed on last page.",
        "Deadline in 3 days.",
        "Send CNIC copy and photo to the WhatsApp number on the form.",
      ],
    },
    actions: [
      { id: "check-official-site", label: "Check the actual department's site", result: "No such recruitment posted. Real recruitments go through FPSC / PPSC portals with fee via specific bank challans, never a personal wallet.", decisive: true },
      { id: "inspect-pdf-metadata", label: "Inspect the PDF metadata", result: "Created three days ago in a free PDF editor. Author field contains a random name. Real government PDFs are signed and stamped digitally.", decisive: true },
      { id: "check-fee-channel", label: "Check what fee channels real govt jobs use", result: "Real recruitments use pre-printed bank challans at specified branches — never a personal easypaisa/jazzcash number.", decisive: true },
      { id: "check-cnic-ask", label: "Note what they're asking to be sent", result: "CNIC + photo + wallet fee = complete kit for identity fraud. Real applications never take these over WhatsApp." },
    ],
    truthNote: "This is a compound scam: they get your fee, your CNIC copy, and your photo — enough to open fraudulent accounts in your name. Youth unemployment makes it devastating; the emotional pressure to 'help a jobless nephew' is the whole exploit.",
    respectfulScript: "Uncle main ne check kiya — asli site pe koi aisi bharti nahi hai. Personal wallet mein fee lene wali koi asli sarkari job nahi hoti — yeh scam hai. Aur CNIC copy WhatsApp par kabhi nahi bhejni. Bhaanjay ko FPSC/PPSC portal ka link bhejta hoon, woh asli hai.",
    inspiredBy: {
      patternName: "Fake Government Job / Recruitment PDF",
      country: "Pakistan / India",
      year: "2016–ongoing",
      whatHappened: "Fraudsters circulate professional-looking PDFs mimicking government recruitment notifications. Victims pay a small 'application fee' to a personal wallet and send their CNIC + photo, which are then used to open fraudulent SIM cards, wallets, and bank accounts.",
      prevention: [
        "Real government jobs use FPSC / PPSC portals and printed bank challans — never personal wallets.",
        "Never send CNIC copies over WhatsApp or Telegram.",
        "Verify recruitment on the actual department's site before paying anything.",
      ],
    },
  },

  /* ── T3 TRUE — weird-but-true rule ────────────────────────── */
  {
    id: "weird-but-true",
    title: "The weird-but-true rule",
    teaser: "A wild-sounding new regulation. Sounds fake. Turns out to be on the official gazette.",
    tier: 3,
    verdict: "TRUE",
    sender: { name: "Colleague Adnan", relationship: "Work Slack", voice: "dry, likes weird laws, sends the source" },
    senderMotive: "He's not panicking — he's genuinely curious and wants a sanity check.",
    opener: "This can't be real, right? But someone said it's actually gazetted. Have a look when free.",
    forward: {
      meta: "Article + linked gazette PDF",
      headline: "New rule requires unusual labeling on all X products",
      imageEmoji: "📜",
      imageAlt: "Screenshot of an official gazette notification",
      bodyLines: [
        "Rule sounds bizarre.",
        "Article claims it's official and enforced.",
        "Effective from next quarter.",
      ],
    },
    actions: [
      { id: "check-gazette", label: "Open the official gazette PDF", result: "The rule is genuinely gazetted, with signatures and date. It IS the law from next quarter.", decisive: true },
      { id: "check-news", label: "Cross-check with mainstream news", result: "Multiple newsrooms have covered it. Analysts arguing about enforcement, none disputing the notification exists.", decisive: true },
      { id: "check-ministry", label: "Check the ministry's own site", result: "Ministry page confirms and provides an FAQ for implementation.", decisive: true },
      { id: "sanity-check-domain", label: "Sanity-check the gazette PDF's source URL", result: "URL is on the official gazette domain, not a lookalike. PDF is digitally signed." },
    ],
    truthNote: "TRUE. \"Unbelievable\" is not evidence of \"false\". Real laws, real regulations, and real bureaucratic decisions can and do sound absurd. If your only test is 'does it sound plausible', you'll reject the truth constantly.",
    respectfulScript: "Weird but yeah — it's really gazetted, I checked the PDF directly. The ministry has an FAQ page too. So it's the law from next quarter. Good instinct to check first though — most of these turn out to be hoaxes.",
  },

  /* ── T3 UNVERIFIED — earthquake prediction ─────────────────── */
  {
    id: "earthquake-prediction",
    title: "The earthquake prediction",
    teaser: "\"Scientist predicts a big quake this week — share to save lives.\"",
    tier: 3,
    verdict: "UNVERIFIED",
    sender: { name: "Ammi's WhatsApp group", relationship: "Family broadcast", voice: "concerned mothers, deeply protective, 'better safe than sorry'" },
    senderMotive: "They love the family. The forward comes with a photo of a real seismologist and the phrase 'better safe than sorry'.",
    opener: "Beta please save this. Foreign scientist ne prediction diya hai — bara zalzala aane wala hai iss hafte. Share to all family for safety.",
    forward: {
      meta: "Forwarded · with scientist's photo",
      headline: "Renowned seismologist predicts major quake this week — take precautions",
      imageEmoji: "🌍",
      imageAlt: "A photo of a real scientist with an alarming caption",
      bodyLines: [
        "'Big quake incoming this week.'",
        "Named foreign scientist attached.",
        "Save your family — forward now.",
      ],
    },
    actions: [
      { id: "check-scientist", label: "Look up the named scientist's real work", result: "Scientist is real, but has never issued this prediction. Their institution has publicly denied the quote.", decisive: true },
      { id: "check-usgs", label: "Check USGS / national seismology body", result: "USGS and every serious seismology body state clearly: earthquakes CANNOT be predicted to a specific week. Anyone claiming otherwise is not doing science.", decisive: true },
      { id: "check-history", label: "Search past 'quake prediction' forwards", result: "Near-identical forwards have circulated for over a decade, always attached to a different real scientist. None have ever been accurate.", decisive: true },
      { id: "check-fault-activity", label: "Check current fault activity in the region", result: "The region IS seismically active. A quake COULD happen — this week, next week, or in ten years. Nothing here disproves 'a quake could happen', but nothing supports 'this specific week' either." },
    ],
    truthNote: "This one is the honest UNVERIFIED. The prediction is not verifiable because earthquakes cannot be predicted — but you also can't 'prove' a quake won't happen. The correct verdict is UNVERIFIED, and the correct action is: don't forward fear that cannot be checked. UNVERIFIED is not a cop-out — it's the honest 'we cannot know', and refusing to say it is how false certainty spreads in both directions.",
    respectfulScript: "Ammi jaan — main ne check kiya. Woh scientist asli hain lekin unhone yeh prediction kabhi nahi di, unke institute ne bhi mana kiya. USGS clearly kehta hai zalzale ki prediction possible hi nahi. Zalzala aa bhi sakta hai kabhi bhi — lekin iss specific hafte ki koi verified warning nahi hai. Fear forward nahi karna behtar hai. Asli disaster prep tips send karti hoon aap ke liye ❤️",
    inspiredBy: {
      patternName: "Fake Earthquake / Disaster Prediction",
      country: "Global",
      year: "2010–ongoing",
      whatHappened: "Forwards falsely attribute specific-week earthquake, tsunami, or eclipse-disaster predictions to real scientists (usually with their photo). The scientists have never made these claims — often their institutions issue public denials that get far less circulation than the original hoax.",
      prevention: [
        "Earthquakes cannot be predicted to a specific week — that's settled science.",
        "Real disaster prep advice comes from NDMA / PDMA / USGS, not forwards.",
        "UNVERIFIED is a legitimate verdict — don't forward fear you can't confirm.",
      ],
    },
  },
];

export function getFeedScenario(id: string): FeedScenario | undefined {
  return FEED_SCENARIOS.find((s) => s.id === id);
}
