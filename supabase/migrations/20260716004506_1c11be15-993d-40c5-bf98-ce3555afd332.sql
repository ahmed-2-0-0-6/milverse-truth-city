-- THE DAILY MIRAGE — editions table + interaction aggregates.
CREATE TABLE public.editions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  edition_number INT NOT NULL UNIQUE,
  edition_date DATE NOT NULL,
  motto TEXT NOT NULL DEFAULT 'The city''s only honest newspaper. Every story in it is false.',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','locked')),
  content JSONB NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.editions TO anon;
GRANT SELECT ON public.editions TO authenticated;
GRANT ALL ON public.editions TO service_role;
ALTER TABLE public.editions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads published editions" ON public.editions
  FOR SELECT TO anon, authenticated USING (status IN ('published','locked'));

CREATE INDEX editions_pub_idx ON public.editions (status, edition_date DESC);

CREATE OR REPLACE FUNCTION public.editions_touch_updated() RETURNS TRIGGER
  LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER editions_updated BEFORE UPDATE ON public.editions
  FOR EACH ROW EXECUTE FUNCTION public.editions_touch_updated();

-- Anonymous interaction log for The Ledger + Handler profile signals.
CREATE TABLE public.paper_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  edition_number INT NOT NULL,
  section TEXT NOT NULL,       -- 'lead' | 'forgery' | 'social' | 'classified' | 'puzzle'
  correct BOOLEAN NOT NULL,
  device_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.paper_interactions TO anon;
GRANT INSERT ON public.paper_interactions TO authenticated;
GRANT ALL ON public.paper_interactions TO service_role;
ALTER TABLE public.paper_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon logs paper interactions" ON public.paper_interactions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX paper_int_edition_section_idx ON public.paper_interactions (edition_number, section);

CREATE OR REPLACE FUNCTION public.get_paper_split(_edition_number INT, _section TEXT)
RETURNS TABLE(total INT, correct_count INT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*)::INT, count(*) FILTER (WHERE correct)::INT
  FROM public.paper_interactions
  WHERE edition_number = _edition_number AND section = _section;
$$;

-- ─────────── SEED EDITION #1 (published) + 2 drafts ───────────
INSERT INTO public.editions (edition_number, edition_date, status, content, published_at) VALUES
(1, CURRENT_DATE, 'published', $json${
  "lead": {
    "kicker": "SPECIAL DISPATCH · THE MONEY LINE",
    "headline": "State Bank Orders Five-Day Shutdown, Says Viral Screenshot",
    "subhead": "Message urging citizens to withdraw savings before midnight sweeps family groups from Karachi to Kohat.",
    "byline": "By NOOR AHSAN · City Desk",
    "dropCap": true,
    "columns": [
      "A screenshot bearing the yellow ticker of a national channel began circulating on WhatsApp before dawn, claiming the State Bank of Pakistan had \"quietly ordered\" all commercial banks to close for five working days beginning Monday. By breakfast it had reached the aunties of three provinces. By lunch, three ATMs in Saddar had queues.",
      "The screenshot's ticker font is thin where the channel's is thick. The Facebook page it links to was registered three weeks ago. The State Bank has issued no such circular. And yet the forward has been sent, opened, and re-sent tens of thousands of times.",
      "The people forwarding it are not fools. They are your uncles. They are trying to save you. That is precisely what makes the forgery work — it borrows the face of somebody who loves you."
    ],
    "caseId": "bank-rumor",
    "yourCallTitle": "YOUR CALL, CITIZEN"
  },
  "forgery": {
    "kind": "ai_or_real",
    "prompt": "Below: one photograph the city desk received overnight. One question — real camera, or engine-made?",
    "imageAlt": "A rain-drenched intersection at night, headlights streaking, a solitary rickshaw crossing",
    "imageEmoji": "🏙️",
    "truth": "AI",
    "provenance": "Generated with an image engine on 2025-11-04. Fingerprints: neon reflections don't match wet-road physics; the rickshaw's rear plate is a smear of digits without letters.",
    "thesis": "This is why we don't trust our eyes. We trust sources.",
    "tacticId": "ai-generated"
  },
  "social": {
    "handle": "@karachi.stories",
    "caption": "THIS PULLED 47,000 LIKES YESTERDAY. Foreign tourist tips rickshaw driver Rs. 50,000 — his reaction will melt you 💛",
    "likes": 47210,
    "views": 812000,
    "imageEmoji": "🥺",
    "imageAlt": "Grainy phone-camera still of a driver holding cash, an out-of-focus figure in the background",
    "truth": "MISLEADING",
    "reveal": "The clip is real. The framing isn't. It's a scripted skit re-uploaded without the original creator's ‘performance’ label, farmed for outrage-adjacent warmth. The account has re-used the same driver's face on three different ‘tourists.’",
    "tacticId": "engagement-bait"
  },
  "classifieds": [
    {
      "title": "URGENT: Warehouse jobs — Dubai. Salary AED 4500. No experience.",
      "body": "Serious candidates only. Visa + ticket arranged after INTERVIEW FEE of Rs. 15,000 (refundable). WhatsApp only. Limited seats. Family men preferred. Contact Br. Kashif.",
      "flags": ["INTERVIEW FEE", "WhatsApp only", "Limited seats"],
      "tacticId": "phishing"
    },
    {
      "title": "MIRACLE: Sugar-control herbal drops — Hakeem-tested, no side effects.",
      "body": "Diabetes gone in 21 days GUARANTEED. Doctors don't want you to know. First 100 callers get 50% off. Cash on delivery — no questions asked.",
      "flags": ["GUARANTEED", "Doctors don't want you to know", "no questions asked"],
      "tacticId": "urgency-fear"
    },
    {
      "title": "You have WON! Prize claim — final notice.",
      "body": "Congratulations. Your number was selected in our monthly draw for a Suzuki Alto. To claim, deposit Rs. 8,500 processing fee into the account below within 24 hours. Ref: PAK-WINNER-9812.",
      "flags": ["processing fee", "within 24 hours", "Ref: PAK-WINNER"],
      "tacticId": "phishing"
    }
  ],
  "puzzle": {
    "kind": "headline_autopsy",
    "clickbait": "You WON'T BELIEVE what this doctor did — bank REFUSED to help",
    "honest": "A doctor filed a formal complaint after her bank declined a service request",
    "words": ["doctor","filed","a","formal","complaint","after","her","bank","declined","a","service","request"],
    "reveal": "Clickbait steals emotion first. The honest version tells you the shape of what happened and lets you decide if you care."
  },
  "ledger": {
    "note": "Live from the presses. Updated as the city plays."
  },
  "editorial": {
    "fallback": "Kids, we ran forty thousand plays through this desk last week. The pattern doesn't change. Someone you love forwards you fear, and the fear is louder than the source. Slow down. Ask where. Ask who. Then decide. That is the whole job.",
    "signoff": "— The Handler"
  },
  "realWorld": {
    "lede": "This week: circulating claims about ATM shutdowns have been debunked by two independent Pakistani fact-checkers. When a message tells you to move fast, move slow.",
    "linkLabel": "Soch Fact Check — how to verify a bank rumor",
    "linkHref": "https://sochfactcheck.com/"
  }
}$json$::jsonb, now()),

(2, CURRENT_DATE + INTERVAL '1 day', 'draft', $json${
  "lead": {
    "kicker": "SPECIAL DISPATCH · THE HEALTH DESK",
    "headline": "Miracle Drops Claim to Reverse Diabetes in Twenty-One Days",
    "subhead": "A hakeem-labeled bottle, a WhatsApp broadcast, and a promise older than pharmacology.",
    "byline": "By ZARA ILYAS · Health Desk",
    "columns": ["Draft column 1 — replace in Pressroom.", "Draft column 2 — replace in Pressroom.", "Draft column 3 — replace in Pressroom."],
    "caseId": "miracle-cure",
    "yourCallTitle": "YOUR CALL, CITIZEN"
  },
  "forgery": { "kind": "ai_or_real", "prompt": "Real or engine-made?", "imageAlt": "TBD", "imageEmoji": "🖼️", "truth": "REAL", "provenance": "TBD", "thesis": "TBD", "tacticId": "ai-generated" },
  "social": { "handle": "@tbd", "caption": "TBD", "likes": 0, "views": 0, "imageEmoji": "📱", "imageAlt": "TBD", "truth": "TRUE", "reveal": "TBD", "tacticId": "engagement-bait" },
  "classifieds": [],
  "puzzle": { "kind": "headline_autopsy", "clickbait": "TBD", "honest": "TBD", "words": [], "reveal": "TBD" },
  "ledger": { "note": "" },
  "editorial": { "fallback": "TBD", "signoff": "— The Handler" },
  "realWorld": { "lede": "TBD", "linkLabel": "TBD", "linkHref": "https://sochfactcheck.com/" }
}$json$::jsonb, NULL),

(3, CURRENT_DATE + INTERVAL '2 days', 'draft', $json${
  "lead": {
    "kicker": "SPECIAL DISPATCH · THE POLITICAL DESK",
    "headline": "Deepfaked Address Circulates Hours Before By-Election",
    "subhead": "A 22-second clip of a national leader, an accent that isn't quite theirs, and a message about voting machines.",
    "byline": "By ASAD REHMAN · Political Desk",
    "columns": ["Draft column 1.", "Draft column 2.", "Draft column 3."],
    "caseId": "ai-deepfake-pm",
    "yourCallTitle": "YOUR CALL, CITIZEN"
  },
  "forgery": { "kind": "ai_or_real", "prompt": "Real or engine-made?", "imageAlt": "TBD", "imageEmoji": "🖼️", "truth": "AI", "provenance": "TBD", "thesis": "TBD", "tacticId": "ai-generated" },
  "social": { "handle": "@tbd", "caption": "TBD", "likes": 0, "views": 0, "imageEmoji": "📱", "imageAlt": "TBD", "truth": "FALSE", "reveal": "TBD", "tacticId": "out-of-context" },
  "classifieds": [],
  "puzzle": { "kind": "spot_the_tell", "clickbait": "TBD", "honest": "TBD", "words": [], "reveal": "TBD" },
  "ledger": { "note": "" },
  "editorial": { "fallback": "TBD", "signoff": "— The Handler" },
  "realWorld": { "lede": "TBD", "linkLabel": "TBD", "linkHref": "https://sochfactcheck.com/" }
}$json$::jsonb, NULL);
