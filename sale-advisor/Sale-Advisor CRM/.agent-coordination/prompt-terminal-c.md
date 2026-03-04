# TERMINAL C — Copy-paste this entire block into Terminal C

You are Terminal C in a 3-terminal parallel build of the Sale Advisor CRM. Sale Advisor is a consignment sales company launching in Chicago within one month. They come to your house, catalog what you want to sell, list it on every marketplace, deliver via their moving company (Lakeshore Hauling), sell it, and pay you. They take a commission percentage.

## STEP 1 — READ THESE FILES BEFORE DOING ANYTHING
Read these coordination files to understand the full system:
- `/Users/loganbronstein/Claude Code/sale-advisor/Sale-Advisor CRM/.agent-coordination/shared-state.md`
- `/Users/loganbronstein/Claude Code/sale-advisor/Sale-Advisor CRM/.agent-coordination/learnings.md`
- `/Users/loganbronstein/Claude Code/sale-advisor/Sale-Advisor CRM/CLAUDE.md`

## STEP 2 — CREATE YOUR WORKTREE (MANDATORY)
You MUST work in an isolated git worktree. Run this immediately:
```
cd "/Users/loganbronstein/Claude Code/sale-advisor/Sale-Advisor CRM"
git worktree add .claude/worktrees/terminal-c -b terminal-c
cd .claude/worktrees/terminal-c
```
ALL of your work happens inside `.claude/worktrees/terminal-c/`. Never cd back to the main directory.

## STEP 3 — YOUR MISSION
Build two things that are critical for launch:
1. **Pricing Research Tool** — built into the CRM so Logan can research competitive prices when listing items
2. **Public Lead Intake Page** — a standalone page potential clients can reach from ads/website to submit their info

---

## TASK 1: Pricing Research Tool (HIGHEST PRIORITY)

When Logan catalogs an item during a walkthrough (e.g., "mid-century modern dresser, good condition"), he needs to quickly research what similar items sell for on Facebook Marketplace, eBay, Craigslist, etc. This determines the listing price.

**Create:** `src/app/pricing/page.tsx`
**Create:** `src/app/pricing/PricingView.tsx`
**Create:** `src/app/api/pricing/research/route.ts`

### What to build:

**The UI (`PricingView.tsx`):**
1. **Search form** — item title, category dropdown, condition dropdown, optional location (default: Chicago)
2. **Results area** — shows pricing recommendations:
   - Suggested price range (low / mid / high)
   - Average selling price
   - Price by marketplace (FB Marketplace tends lower, eBay tends higher for collectibles, etc.)
   - Quick tips for this category (e.g., "Furniture sells best with delivery included in price")
3. **"Use This Price" button** — copies the suggested price to clipboard for quick use when creating listings
4. **Recent searches** — save last 10 searches to localStorage so Logan can reference them during walkthroughs
5. **Category-specific pricing guides** — built-in reference data:
   - Furniture: size matters, brand matters, condition is king
   - Electronics: depreciates fast, check model year
   - Art: highly variable, research the artist
   - Antiques: age + condition + provenance
   - Appliances: brand and age are primary factors

**The API (`/api/pricing/research/route.ts`):**
1. Takes `{ title, category, condition, location? }`
2. Uses a pricing algorithm based on:
   - Category base price ranges (built-in data table)
   - Condition multiplier (Like New: 0.85x retail, Good: 0.65x, Fair: 0.45x, Worn: 0.25x)
   - Category-specific adjustments
3. Returns `{ suggestedLow, suggestedMid, suggestedHigh, marketplace recommendations, tips }`
4. NOTE: For v1, this uses built-in reference data. We'll add real marketplace API scraping later. For now, the algorithm should be smart enough to give reasonable ballpark prices based on category + condition.

**Built-in pricing reference data to include:**
```
Furniture:
  - Sofa/Couch: $150-800 (Like New), heavily dependent on brand
  - Dining Table: $100-600
  - Dresser: $75-400
  - Bed Frame: $100-500
  - Desk: $50-350
  - Bookshelf: $30-200
  - Coffee Table: $40-250
  - Nightstand: $25-150
  - TV Stand: $30-200
  - Accent Chair: $50-300

Electronics:
  - TV (55"+): $150-500 (depends on age, brand, resolution)
  - TV (under 55"): $50-250
  - Gaming Console: $100-400
  - Laptop: $100-600
  - Desktop Computer: $75-400
  - Speakers/Sound System: $30-300
  - Smart Home Devices: $15-100

Appliances:
  - Washer: $150-400
  - Dryer: $150-400
  - Refrigerator: $200-600
  - Dishwasher: $100-300
  - Microwave: $20-80

Art/Antiques:
  - Prints/Posters: $10-100
  - Original Paintings: $50-2000+
  - Sculptures: $30-500
  - Vintage Furniture: multiply standard furniture by 1.5-3x
  - Collectibles: highly variable, start at 40% of retail

Sporting Goods:
  - Exercise Equipment: $50-500
  - Bikes: $50-400
  - Golf Clubs: $50-300
```

### Add to Sidebar
This is the ONE exception where you touch the Sidebar. Add this entry under the "Operations" section:
```
{ icon: "💲", label: "Pricing Tool", href: "/pricing" }
```
Wait — actually, do NOT modify the Sidebar. Instead, write this request to `.agent-coordination/schema-requests-c.md` and Terminal A will add it.

---

## TASK 2: Public Lead Intake Page

This is a standalone page that potential clients reach from ads or saleadvisor.com. It collects their info and creates a lead in the CRM.

**Create:** `src/app/intake/page.tsx`
**Create:** `src/app/intake/IntakeForm.tsx`
**Create:** `src/app/api/intake/route.ts`

### What to build:

**The form (`IntakeForm.tsx`):**
1. **Clean, welcoming design** — this is client-facing. Professional but approachable. Use Sale Advisor branding (navy, gold, green).
2. **Fields:**
   - Name (required)
   - Phone number (required)
   - Email (optional)
   - Neighborhood/Area (optional dropdown: Lincoln Park, Lakeview, Wicker Park, Logan Square, Bucktown, Roscoe Village, West Loop, South Loop, Gold Coast, River North, Evanston, Oak Park, Other)
   - "What are you looking to sell?" (textarea, required)
   - Estimated number of items (dropdown: 1-5, 6-15, 16-30, 30+)
   - How did you hear about us? (dropdown matching LeadSource enum: Facebook, Instagram, Google, Nextdoor, TikTok, Referral, Lakeshore Hauling, Website, Other)
   - SMS consent checkbox: "I agree to receive text messages from Sale Advisor about my consignment inquiry. Message & data rates may apply." (required)
3. **Submit button** — "Get My Free Estimate"
4. **Success state** — "Thanks [name]! We'll text you within 24 hours to schedule your free in-home estimate. Keep an eye on your phone!"
5. **Error handling** — inline validation, friendly error messages
6. **Mobile-first** — this page will be accessed from phone ads. Must look great on mobile.

**The API (`/api/intake/route.ts`):**
1. Takes form data
2. Normalizes phone with `toE164()` from `@/lib/phone`
3. Creates lead via Prisma (import prisma from `@/lib/prisma`) with:
   - All form fields
   - `smsConsent: true`
   - `consentedAt: new Date()`
   - `consentText: "I agree to receive text messages..."`
   - source from the "how did you hear" dropdown
4. Upserts a Conversation record for the phone number
5. Sends admin notification via `notifyAdmin()` from `@/lib/notify` — "New lead: [name] from [source] — [items description]"
6. Handles duplicate phone (phoneE164 is unique) — if duplicate, update existing lead's itemsDescription and return success (don't show an error to the client)
7. Returns `{ ok: true, name }`

**CRITICAL:** This route must be added to the public paths in middleware so it works without auth. Write this to `.agent-coordination/schema-requests-c.md`:
```
MIDDLEWARE REQUEST: Add "/api/intake" to PUBLIC_PATHS in src/middleware.ts
SIDEBAR REQUEST: Add { icon: "💲", label: "Pricing Tool", href: "/pricing" } to Operations section in Sidebar
```
The intake PAGE (`/intake`) also needs to be public — add that too.

---

## BOUNDARIES — CRITICAL

### Files you CAN create:
- `src/app/pricing/page.tsx`
- `src/app/pricing/PricingView.tsx`
- `src/app/api/pricing/research/route.ts`
- `src/app/intake/page.tsx`
- `src/app/intake/IntakeForm.tsx`
- `src/app/api/intake/route.ts`
- `src/components/pricing/*.tsx` (if needed)
- Any supporting utility files within your directories

### Files you MUST NOT touch:
- `prisma/schema.prisma`
- `src/lib/queries.ts`
- `src/lib/validation.ts`
- `src/lib/prisma.ts` (import from it, don't modify)
- `src/lib/phone.ts` (import from it, don't modify)
- `src/lib/notify.ts` (import from it, don't modify)
- `src/components/Sidebar.tsx`
- `src/components/DashboardSummary.tsx`
- `src/app/page.tsx`
- `src/middleware.ts`
- Anything under `src/app/walkthroughs/`
- Anything under `src/app/inventory/`
- Anything under `src/app/leads/`
- Anything under `src/app/clients/`
- Anything under `src/app/messages/`
- Anything under `src/app/deliveries/`
- Anything under `src/app/payouts/`

### If you need something from an owned file:
- Need a schema change? Write it to `.agent-coordination/schema-requests-c.md`
- Need a middleware change? Write it to `.agent-coordination/schema-requests-c.md`
- Need a sidebar change? Write it to `.agent-coordination/schema-requests-c.md`
- Terminal A will apply all of these from the main branch.

---

## COORDINATION PROTOCOL

1. After each major task completion, update `.agent-coordination/shared-state.md` — change your status and list what you built
2. If you discover a useful pattern, add it to `.agent-coordination/learnings.md`
3. When ALL tasks are done:
   - Commit your changes in the worktree: `git add -A && git commit -m "Terminal C: Pricing research tool + public lead intake page"`
   - Update shared-state.md status to COMPLETE
   - Tell the user: "Terminal C is done. Tell Terminal A to merge."

## QUALITY STANDARDS
- Every page must build with zero TypeScript errors
- Test with `npx next build` in your worktree before declaring done
- The intake page is CLIENT-FACING — it must look polished, professional, and work perfectly on mobile
- The pricing tool is INTERNAL — match existing CRM dark theme styling
- No secrets in client-facing code
- Phone numbers must be normalized with toE164() before storing
- Follow Next.js 16 App Router patterns (async params, server/client component split)

## STYLING NOTES FOR INTAKE PAGE
The intake page should NOT use the CRM dark theme. It's a standalone public page. Use:
- White/light background
- Sale Advisor brand colors: navy (#1B2A4A), gold (#C9A84C), green (#2D6A4F)
- Clean, modern font stack (system fonts are fine)
- Max-width container (600px) centered on page
- Generous padding, clear labels, large touch targets for mobile
- No sidebar, no CRM navigation — this is a standalone landing page
