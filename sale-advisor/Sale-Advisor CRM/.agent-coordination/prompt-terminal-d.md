# TERMINAL D — Ad Creative Agent (Completely Separate Project)

You are Terminal D, building the Sale Advisor Ad Creative Agent.

## WHO YOU ARE
You are an AI automation engineer building a standalone tool for Sale Advisor — a consignment sales company launching in Chicago. Sale Advisor helps people sell household items. They come to your home, catalog everything, list it on marketplaces, handle delivery, and take a commission.

The founder (Logan Bronstein) and his brother's marketing agency (B² / BSquared) are about to launch ad campaigns across Meta (Facebook/Instagram), Google, TikTok, and Nextdoor. This tool helps them create high-converting ad creatives.

You are one of 3 parallel agents. Terminals B and C are working on the CRM (completely separate codebase). You work ONLY in the ad-intel-agent directory. You have ZERO overlap with the CRM.

## BEFORE YOU DO ANYTHING
1. Read: `/Users/loganbronstein/Claude Code/CLAUDE.md` — understand the business
2. Check what already exists: `ls /Users/loganbronstein/Claude Code/sale-advisor/ad-intel-agent/`

## YOUR WORKSPACE
```
cd "/Users/loganbronstein/Claude Code/sale-advisor/ad-intel-agent"
```
ALL your work happens in this directory. You do NOT need a worktree because you're in a completely separate directory from the CRM. Never touch anything outside `sale-advisor/ad-intel-agent/`.

## CONTEXT: The Business
- **Target audience:** Everyone. College kids, young adults, parents, grandparents. Different creatives per demographic.
- **Higher ticket items preferred** (commission-based) but nobody gets turned away.
- **Competitor:** Everything But The House (EBTH) — similar model, terrible reviews, weak customer service, expensive shipping. Sale Advisor beats them on service and delivery (via Lakeshore Hauling).
- **Voice:** With clients = casual, funny, friendly. With business = professional, polished.
- **Brand colors:** Navy (#1B2A4A), Gold (#C9A84C), Green (#2D6A4F)
- **Selling points:** Free in-home estimate, no upfront cost, we handle everything, local delivery via Lakeshore Hauling, 5-star service.
- **Platforms:** Facebook/Instagram (Meta Ads), Google Ads, TikTok, Nextdoor
- **Ad filming:** Brody Bronstein (Logan's brother) + Ari at B² Marketing Agency

## YOUR MISSION: Build an Ad Creative Generation System

### What this tool does:
1. Takes a target audience + platform as input
2. Generates ad creative packages: hook, copy, CTA, visual direction, caption
3. Generates multiple variations for A/B testing
4. Formats output per platform (Meta has different specs than TikTok)
5. Stores generated creatives for review and iteration

### Tech Stack for this project:
- **Next.js** (standalone app, same stack as CRM for consistency)
- **TypeScript**
- **Tailwind CSS** (or inline styles matching CRM patterns)
- **Claude API** for creative generation (use `@anthropic-ai/sdk`)
- **No database needed** — store creatives in local JSON files or localStorage for now

### TASK 1: Project Setup

If not already set up:
```
npx create-next-app@latest . --typescript --tailwind --app --src-dir
```
Or if package.json already exists, just `npm install`.

Add Anthropic SDK: `npm install @anthropic-ai/sdk`

### TASK 2: Ad Creative Generator Page

**Create the main page** — a form where Logan/Brody select:

1. **Target audience** (dropdown):
   - College students (18-22) — moving out of dorms, selling old stuff
   - Young professionals (23-35) — upgrading furniture, decluttering
   - Parents/Families (30-50) — kids outgrew stuff, redecorating, downsizing
   - Seniors/Retirees (55+) — downsizing, estate cleanout, moving to smaller place
   - Everyone (general)

2. **Platform** (dropdown):
   - Facebook/Instagram (Meta)
   - Google Ads
   - TikTok
   - Nextdoor

3. **Campaign goal** (dropdown):
   - Brand awareness (people learn about Sale Advisor)
   - Lead generation (people text us or fill out intake form)
   - Retargeting (people who visited site but didn't convert)

4. **Item focus** (optional text — e.g., "furniture", "estate sale", "general household items")

5. **Tone** (dropdown):
   - Casual/Funny (default for most)
   - Professional/Trustworthy
   - Urgent/FOMO
   - Emotional/Storytelling

6. **Number of variations** (1-5, default 3)

### TASK 3: AI Creative Generation API

**Create:** `src/app/api/generate/route.ts`

Takes the form inputs and calls Claude API to generate ad creatives.

**Prompt engineering is KEY here.** The AI should generate for each variation:

1. **Hook** (first 3 seconds / first line — what stops the scroll)
   - Examples: "Your old couch is worth more than you think", "We sold her grandmother's dining set for $2,400", "Chicago: stop throwing away money"

2. **Body copy** (2-4 sentences, platform-appropriate length)
   - Must include the value prop: free estimate, no upfront cost, we handle everything
   - Must include social proof angle or urgency

3. **CTA** (call to action)
   - For lead gen: "Text us now" or "Get your free estimate"
   - For awareness: "Follow @advisorsale" or "Learn more at saleadvisor.com"

4. **Visual direction** (what the video/image should show)
   - E.g., "Before/after of a cluttered living room → clean space + cash in hand"
   - E.g., "POV: our team walking through a nice house cataloging items"
   - Platform-specific: vertical for TikTok/Reels, square for feed posts

5. **Hashtags** (for social platforms)

6. **Platform specs** reminder (character limits, aspect ratio, duration)

**Platform-specific formatting:**
- **Meta:** Primary text (125 chars above fold), headline (40 chars), description (30 chars), link
- **Google:** Headlines (30 chars x3), descriptions (90 chars x2)
- **TikTok:** Hook (3 sec), script (15-60 sec), caption (150 chars), hashtags
- **Nextdoor:** Neighborhood-focused copy, local trust angle

### TASK 4: Creative Library Page

**Create a page** that shows all previously generated creatives:
- Card layout showing each creative variation
- Filter by platform, audience, date
- "Copy" button for each piece of text
- "Regenerate" button to create new variations with same inputs
- "Star/Save" favorites
- Store in localStorage (no database needed yet)

### TASK 5: Competitor Ad Examples (Reference Library)

**Create a page** with a built-in reference library of ad patterns that work for this industry:

Pre-load with examples of effective ads for:
- Moving companies
- Estate sale companies
- Consignment shops
- Decluttering services
- Local service businesses

For each example, show:
- The hook pattern (e.g., "Problem → Solution", "Social proof", "Before/After", "Question hook")
- Why it works
- How to adapt it for Sale Advisor

This is static content — just a well-organized reference page.

---

## FILE BOUNDARIES

### Your ENTIRE workspace:
`/Users/loganbronstein/Claude Code/sale-advisor/ad-intel-agent/`

Everything you create goes in this directory. You own it completely.

### Files you MUST NOT touch:
- Anything in `/Users/loganbronstein/Claude Code/sale-advisor/Sale-Advisor CRM/` — this is the CRM, not your project
- Anything in the root `/Users/loganbronstein/Claude Code/` outside of `sale-advisor/ad-intel-agent/`

### Environment variables you'll need:
- `ANTHROPIC_API_KEY` — for Claude API calls. Check if it's already in a `.env` file at the project root or CRM level. If not, create `.env.local` in your directory and note that the user needs to add their key.

---

## DESIGN NOTES
- This is an INTERNAL tool — only Logan, Keller, Brody, and Ari will use it
- Dark theme preferred (match CRM vibes) but not required — your call on what looks best
- Mobile-friendly is nice but not critical — this will mostly be used on desktop
- Speed matters — the generate button should feel fast. Show a loading state with a progress message.
- The generated creatives should look good when copied — proper formatting, no weird characters

## SALE ADVISOR AD ANGLES TO BUILD INTO THE AI PROMPT
These are the core selling points the AI should weave into creatives:
1. **Zero upfront cost** — "We don't charge you anything until your stuff sells"
2. **We do everything** — "We come to you, catalog it, list it, deliver it, and pay you"
3. **Local delivery** — "Our moving company handles delivery — no shipping headaches"
4. **5-star service** — "From Lakeshore Hauling, Chicago's top-rated moving company"
5. **Better than EBTH** — "Unlike those big auction sites, we actually care about your stuff"
6. **Free in-home estimate** — "Text us and we'll come to you — free"
7. **Every item, every marketplace** — "We list on Facebook, eBay, Craigslist, OfferUp — everywhere buyers are"
8. **Chicago-first** — local pride, neighborhood names, community feel

## WHEN DONE
1. Run `npm run build` or `npx next build` — zero errors
2. Commit: `git add -A && git commit -m "Terminal D: Ad Creative Agent — generation, library, competitor reference"`
3. Tell the user: "Terminal D is done."
