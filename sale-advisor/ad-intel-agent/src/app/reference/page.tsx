const PATTERNS = [
  {
    category: "Moving Companies",
    examples: [
      {
        pattern: "Problem → Solution",
        example:
          '"Tired of paying movers AND selling fees? We do both — for free until it sells."',
        whyItWorks:
          "Identifies two pain points at once and positions Sale Advisor as the bundled solution. The word 'free' stops the scroll.",
        saleAdvisorAdapt:
          "Lead with the double value prop: moving + selling in one service. Emphasize Lakeshore Hauling's 5-star reputation as proof of delivery quality.",
      },
      {
        pattern: "Social Proof / Authority",
        example:
          '"Chicago\'s #1 rated moving company now helps you sell your stuff too."',
        whyItWorks:
          "Borrows credibility from an established brand (Lakeshore Hauling) to launch a new service. People trust what others already trust.",
        saleAdvisorAdapt:
          "Always mention Lakeshore Hauling's 5-star reviews and years in business. Use real numbers: '4 years, 5 stars, 1,000+ moves.'",
      },
    ],
  },
  {
    category: "Estate Sale Companies",
    examples: [
      {
        pattern: "Emotional / Storytelling",
        example:
          '"She thought her late mother\'s furniture was worthless. We sold it for $4,200."',
        whyItWorks:
          "Emotion + surprise number = viral potential. People relate to the situation and are shocked by the outcome.",
        saleAdvisorAdapt:
          "Collect real client stories ASAP. Even before launch, create hypothetical scenarios that feel real. The dollar amount is the hook — always include a specific number.",
      },
      {
        pattern: "Before / After",
        example:
          '"Before: a house full of stuff she couldn\'t deal with. After: $6,000 in her pocket and a clean home."',
        whyItWorks:
          "Visual contrast creates emotional impact. The transformation is tangible — cluttered house to cash + clean space.",
        saleAdvisorAdapt:
          "Have Brody film before/after walkthroughs. Split-screen or transition videos work best on TikTok/Reels. Always end on the payout moment.",
      },
    ],
  },
  {
    category: "Consignment Shops",
    examples: [
      {
        pattern: "Question Hook",
        example:
          '"What if someone came to your house, sold all your stuff, and just handed you a check?"',
        whyItWorks:
          "Opens a curiosity loop. The proposition sounds too good to be true — which makes people read the answer.",
        saleAdvisorAdapt:
          "This IS the Sale Advisor pitch. Use this exact framing in ads. Follow up with 'That's literally what we do.' Keep it simple and direct.",
      },
      {
        pattern: "Comparison / Us vs Them",
        example:
          '"Other consignment shops make you drop off, wait weeks, and take 50%. We come to you and handle everything."',
        whyItWorks:
          "Highlights competitor friction to make your service look effortless by contrast. Specific pain points (drop off, wait, high commission) feel real.",
        saleAdvisorAdapt:
          "Never name EBTH directly in ads (legal risk). Instead, say 'those big auction sites' or 'other services.' Focus on: they make you ship, we deliver. They have bad reviews, we have 5 stars.",
      },
    ],
  },
  {
    category: "Decluttering Services",
    examples: [
      {
        pattern: "FOMO / Urgency",
        example:
          '"Every day you wait, your stuff loses value. We have 3 estimate spots left this week."',
        whyItWorks:
          "Creates time pressure with a real consequence (depreciation) and scarcity (limited spots). Drives immediate action.",
        saleAdvisorAdapt:
          "Use scarcity honestly — if you're launching in Chicago with limited capacity, that IS real scarcity. 'We're only taking 10 clients this month' during launch is genuine urgency.",
      },
      {
        pattern: "Relatable Moment",
        example:
          '"POV: You open the garage and realize you haven\'t used any of this in 3 years."',
        whyItWorks:
          "Everyone has that moment. The POV format works on TikTok/Reels because it puts the viewer in the scene. Low production, high relatability.",
        saleAdvisorAdapt:
          "Film Brody opening a cluttered garage, basement, or spare room. Cut to: Sale Advisor team cataloging everything. Cut to: cash in hand. 15-second TikTok format.",
      },
    ],
  },
  {
    category: "Local Service Businesses",
    examples: [
      {
        pattern: "Neighborhood Pride",
        example:
          '"Lincoln Park, we\'re coming to you. Free in-home estimates all month."',
        whyItWorks:
          "Hyper-local targeting makes the ad feel personal. People engage more when their neighborhood is called out by name.",
        saleAdvisorAdapt:
          "Create neighborhood-specific versions: Lincoln Park, Lakeview, Wicker Park, Gold Coast, Evanston. Each Nextdoor ad should name the specific neighborhood. Chicago pride is real — use it.",
      },
      {
        pattern: "Testimonial / Review",
        example:
          '"I thought it was a scam. Then they sold my old dining set for $1,800 and delivered it the same week." — Real Chicago customer',
        whyItWorks:
          "Addresses skepticism head-on. The 'I thought it was a scam' hook is honest and disarming. Specific dollar amounts and timelines build credibility.",
        saleAdvisorAdapt:
          "Collect video testimonials from Day 1. Even friends-and-family beta clients count. Text reviews work too — screenshot a real text conversation (with permission) showing the payout notification.",
      },
    ],
  },
];

export default function ReferencePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Ad Reference Library</h1>
      <p className="text-[var(--text-secondary)] mb-8">
        Proven ad patterns adapted for Sale Advisor — use these as inspiration
        when generating creatives
      </p>

      <div className="space-y-8">
        {PATTERNS.map((category) => (
          <section key={category.category}>
            <h2 className="text-lg font-semibold text-[var(--gold)] mb-4">
              {category.category}
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {category.examples.map((ex) => (
                <div
                  key={ex.pattern}
                  className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium bg-[var(--navy)] text-[var(--gold)] px-2 py-0.5 rounded">
                      {ex.pattern}
                    </span>
                  </div>

                  <blockquote className="text-sm italic text-white/90 border-l-2 border-[var(--gold)] pl-3 mb-4">
                    {ex.example}
                  </blockquote>

                  <div className="mb-3">
                    <h4 className="text-xs uppercase tracking-wider text-[var(--text-secondary)] font-medium mb-1">
                      Why It Works
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {ex.whyItWorks}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs uppercase tracking-wider text-[var(--green)] font-medium mb-1">
                      Sale Advisor Adaptation
                    </h4>
                    <p className="text-sm leading-relaxed">
                      {ex.saleAdvisorAdapt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          Hook Formulas Cheat Sheet
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              formula: "Problem → Solution",
              template: '"Tired of [pain]? We [solution]."',
            },
            {
              formula: "Social Proof",
              template: '"[X] people in [neighborhood] already use us."',
            },
            {
              formula: "Question Hook",
              template: '"What if [too-good-to-be-true proposition]?"',
            },
            {
              formula: "Before / After",
              template: '"Before: [messy]. After: [clean + cash]."',
            },
            {
              formula: "FOMO / Urgency",
              template: '"Only [X] spots left this [timeframe]."',
            },
            {
              formula: "Relatable POV",
              template: '"POV: you [common situation everyone has]"',
            },
            {
              formula: "Shock Number",
              template: '"We sold her [item] for $[surprising amount]."',
            },
            {
              formula: "Us vs Them",
              template: '"Other services [pain]. We [better way]."',
            },
            {
              formula: "Testimonial",
              template:
                '"I thought [skepticism]. Then [positive surprise]." — Real customer',
            },
          ].map((h) => (
            <div
              key={h.formula}
              className="bg-[var(--dark-bg)] rounded-lg p-3"
            >
              <p className="text-[var(--gold)] text-sm font-medium mb-1">
                {h.formula}
              </p>
              <p className="text-xs text-[var(--text-secondary)] italic">
                {h.template}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
