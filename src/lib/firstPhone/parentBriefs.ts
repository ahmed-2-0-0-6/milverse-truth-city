// MILVERSE — Parent-facing curriculum descriptions for /family.
// Plain professional register. Describes the LESSON, never the child.
// Static content — no child data, no metrics, no cloud.

export interface ParentBrief {
  n: number;
  practiced: string;
  why: string;
  dinnerQuestion: string;
}

export const PARENT_BRIEFS: ParentBrief[] = [
  {
    n: 1,
    practiced:
      "Deciding which messages deserve a reply at all — and screenshotting anything confusing to show an adult later.",
    why: "Most trouble starts with feeling obliged to answer. Knowing that silence is allowed is the foundation.",
    dinnerQuestion:
      "Ask them: 'What kinds of messages did you learn you don't have to answer?'",
  },
  {
    n: 2,
    practiced:
      "Spotting free-prize messages and understanding why 'you won' usually means 'we want something.'",
    why: "Prize bait is the most common first scam a child meets. It fails the moment they ask who's paying for the prize.",
    dinnerQuestion:
      "Ask them: 'If a message says you won something, what's the catch usually?'",
  },
  {
    n: 3,
    practiced:
      "Treating forwarded messages as claims, not facts — even from people we love.",
    why: "Forwards feel trustworthy because a familiar name sent them. The lesson separates the messenger from the message.",
    dinnerQuestion:
      "Ask them: 'If I forward you something, does that make it true?' — and let them tell you no.",
  },
  {
    n: 4,
    practiced:
      "Checking whether a photo actually shows what the caption says it shows.",
    why: "A real photo with the wrong story is the most common fake there is. No editing required.",
    dinnerQuestion: "Ask them: 'How can a real photo still lie?'",
  },
  {
    n: 5,
    practiced:
      "Handling messages from someone pretending to be a friend or family member.",
    why: "Impersonation works through borrowed trust. The counter is simple and they've practiced it: check on another channel — call the real person.",
    dinnerQuestion:
      "Agree on this together: 'If you ever get a weird message that sounds like me, what do you do?' The answer is: call me.",
  },
  {
    n: 6,
    practiced:
      "Noticing when a post is engineered to make people angry — and what anger does to sharing.",
    why: "Outrage spreads faster than accuracy. Feeling the pull and naming it is the skill.",
    dinnerQuestion: "Ask them: 'Why do angry posts get shared more?'",
  },
  {
    n: 7,
    practiced:
      "Telling human-made from engine-made media — and why 'looks real' stopped being a test.",
    why: "The honest answer is that looking closely no longer settles it. The lesson moves them from spotting to verifying: who posted it, where else it appears.",
    dinnerQuestion:
      "Ask them: 'If you can't tell by looking, what do you do instead?'",
  },
  {
    n: 8,
    practiced:
      "Sitting with 'we can't know yet' — claims that can't be checked either way.",
    why: "Children (and adults) rush to true or false. 'Unverified' is the hardest verdict and the most honest one.",
    dinnerQuestion:
      "Ask them: 'What do you do with a story nobody can prove yet?'",
  },
  {
    n: 9,
    practiced:
      "Protecting a group chat: what to do when something false is spreading among friends.",
    why: "Correcting friends without shaming them is a social skill, not just a fact-checking one. They practiced saying it kindly.",
    dinnerQuestion:
      "Ask them: 'How would you tell a friend their forward is fake — without making them feel dumb?'",
  },
  {
    n: 10,
    practiced: "The graduation case: everything above, unassisted.",
    why: "The license isn't for finishing lessons. It marks the moment checking became a habit rather than an instruction.",
    dinnerQuestion:
      "Ask them to teach YOU one thing from the program. Teaching it back is the strongest proof it stuck.",
  },
];

export const STANDING_RULE =
  "In every lesson, 'tell a trusted adult' is always available and always counts as a win. The program never punishes a child for coming to you.";
