import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type {
  GenerateRequest,
  AdCreativeVariation,
  Audience,
  Platform,
  CampaignGoal,
  Tone,
} from "@/lib/types";

const client = new Anthropic();

const AUDIENCE_CONTEXT: Record<Audience, string> = {
  college:
    "College students (18-22) moving out of dorms, selling old furniture, textbooks, mini-fridges. They want quick cash and zero hassle. Speak their language — casual, meme-friendly, relatable.",
  young_professionals:
    "Young professionals (23-35) upgrading their space, decluttering after a move, or flipping furniture. They value convenience and efficiency. Modern, aspirational tone.",
  parents:
    "Parents and families (30-50) whose kids outgrew stuff, redecorating, or downsizing. They're busy and want someone to handle everything. Emphasize ease and trust.",
  seniors:
    "Seniors and retirees (55+) downsizing, estate cleanouts, or moving to a smaller place. They want respectful service and fair value for a lifetime of belongings. Warm, trustworthy tone.",
  everyone:
    "General audience — all demographics. Use universally appealing messaging about turning unused stuff into cash with zero effort.",
};

const PLATFORM_FORMAT: Record<Platform, string> = {
  meta: `FORMAT FOR META (Facebook/Instagram):
- Primary text: Max 125 characters above the fold (can be longer but gets truncated)
- Headline: Max 40 characters
- Description: Max 30 characters
- Link CTA button text suggestion
- Aspect ratio: 1:1 for feed, 9:16 for Stories/Reels
- Video duration: 15-60 seconds recommended`,

  google: `FORMAT FOR GOOGLE ADS:
- Headline 1: Max 30 characters
- Headline 2: Max 30 characters
- Headline 3: Max 30 characters
- Description 1: Max 90 characters
- Description 2: Max 90 characters
- Display URL path suggestions`,

  tiktok: `FORMAT FOR TIKTOK:
- Hook: First 3 seconds (what stops the scroll)
- Script: 15-60 second video script with scene directions
- Caption: Max 150 characters
- Hashtags: 3-5 relevant hashtags
- Sound/music suggestion
- Aspect ratio: 9:16 vertical only`,

  nextdoor: `FORMAT FOR NEXTDOOR:
- Headline: Neighborhood-focused, local trust angle
- Body: 2-3 paragraphs, conversational, community feel
- Use neighborhood names and Chicago references
- CTA: Direct and local ("your neighbors are already using us")
- Nextdoor ads feel like recommendations, not ads`,
};

const GOAL_CONTEXT: Record<CampaignGoal, string> = {
  awareness:
    "GOAL: Brand awareness. People should remember Sale Advisor exists. Focus on the brand story, what makes us different, and creating a memorable impression. CTA: Follow @advisorsale, visit saleadvisor.com, or just remember the name.",
  lead_gen:
    "GOAL: Lead generation. Get people to text us or submit an inquiry. CTA must drive direct action: 'Text us now at [number]', 'Get your free estimate', 'Click to schedule'. Every word should push toward conversion.",
  retargeting:
    "GOAL: Retargeting warm audiences. These people already know about Sale Advisor — they visited the site or engaged with a previous ad. Overcome objections, add urgency, and make it easy to take the final step. CTA: 'Still thinking about it?', 'Your free estimate is waiting', 'Schedule today'.",
};

const TONE_DIRECTION: Record<Tone, string> = {
  casual:
    "TONE: Casual and funny. Talk like a friend, not a brand. Humor that stops the scroll. Think: your funniest friend who also happens to run a business. Can be borderline unprofessional in a charming way.",
  professional:
    "TONE: Professional and trustworthy. Clean, polished, confident. This is for higher-end clients or B2B contexts. Think: premium service, white-glove treatment, reliable and established.",
  urgent:
    "TONE: Urgent / FOMO. Create a sense of scarcity and time pressure. 'Limited spots', 'Only X appointments left this month', 'Don't let your stuff sit there losing value'. Drive immediate action.",
  emotional:
    "TONE: Emotional / Storytelling. Tell a story — a family downsizing, a college grad moving on, someone who turned their cluttered garage into $3,000. Make people feel something before you sell them anything.",
};

function buildPrompt(req: GenerateRequest): string {
  return `You are an elite advertising copywriter and creative director for Sale Advisor, a consignment sales company launching in Chicago.

ABOUT SALE ADVISOR:
- We come to your home, catalog everything you want to sell, list it across every marketplace (Facebook Marketplace, eBay, Craigslist, OfferUp), handle delivery through our moving company (Lakeshore Hauling), sell it, and pay you.
- Zero upfront cost — we only take a commission when items sell.
- Free in-home estimate — text us and we come to you.
- Delivery handled by Lakeshore Hauling, Chicago's top-rated moving company (5-star reviews).
- Better than Everything But The House (EBTH) — we actually care about your stuff, better customer service, no expensive shipping fees.
- Chicago-first launch — use local pride, neighborhood names, community feel.
- Instagram: @advisorsale | Website: saleadvisor.com

CORE SELLING POINTS TO WEAVE IN:
1. Zero upfront cost — "We don't charge you anything until your stuff sells"
2. We do everything — "We come to you, catalog it, list it, deliver it, and pay you"
3. Local delivery — "Our moving company handles delivery — no shipping headaches"
4. 5-star service — "From Lakeshore Hauling, Chicago's top-rated moving company"
5. Better than EBTH — "Unlike those big auction sites, we actually care about your stuff"
6. Free in-home estimate — "Text us and we'll come to you — free"
7. Every marketplace — "We list on Facebook, eBay, Craigslist, OfferUp — everywhere buyers are"
8. Chicago-first — local pride, community feel

${AUDIENCE_CONTEXT[req.audience]}

${PLATFORM_FORMAT[req.platform]}

${GOAL_CONTEXT[req.goal]}

${TONE_DIRECTION[req.tone]}

${req.itemFocus ? `ITEM FOCUS: The ad should emphasize "${req.itemFocus}" specifically.` : "ITEM FOCUS: General household items — furniture, electronics, decor, collectibles, etc."}

Generate exactly ${req.variations} distinct ad creative variations. Each variation should take a DIFFERENT angle/approach — not just rewording the same idea.

For EACH variation, provide:
1. hook — The attention-grabbing first line or first 3 seconds (what stops the scroll)
2. bodyCopy — 2-4 sentences of ad copy, platform-appropriate length
3. cta — Clear call to action
4. visualDirection — What the video/image/visual should show (be specific and actionable for a film crew)
5. hashtags — Array of relevant hashtags (3-5)
6. platformSpecs — Platform-specific formatting reminder (character counts, aspect ratios, etc.)

Respond ONLY with valid JSON in this exact format:
{
  "variations": [
    {
      "variationNumber": 1,
      "hook": "...",
      "bodyCopy": "...",
      "cta": "...",
      "visualDirection": "...",
      "hashtags": ["...", "..."],
      "platformSpecs": "..."
    }
  ]
}

No markdown, no explanation, no wrapping — just the JSON object.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateRequest;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured. Add it to .env.local" },
        { status: 500 }
      );
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: buildPrompt(body),
        },
      ],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    let parsed: { variations: AdCreativeVariation[] };
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response", raw: text },
        { status: 500 }
      );
    }

    return NextResponse.json({
      variations: parsed.variations,
      platform: body.platform,
      audience: body.audience,
      goal: body.goal,
      tone: body.tone,
      itemFocus: body.itemFocus,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
