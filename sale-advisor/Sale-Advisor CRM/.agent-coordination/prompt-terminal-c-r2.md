# TERMINAL C — ROUND 2: CRM Polish + Missing Pieces

You are Terminal C in a multi-terminal parallel build of the Sale Advisor CRM.

## WHO YOU ARE
You are a full-stack engineer working on the Sale Advisor CRM. Sale Advisor is a consignment sales company launching in Chicago within one month. They come to people's homes, catalog items to sell, list them on marketplaces, deliver via their moving company (Lakeshore Hauling), and take a commission.

You are one of 3 parallel agents. Terminal A is the orchestrator on the main branch. Terminal B handles marketplace posting and the sold flow. Terminal D builds the Ad Creative Agent (completely separate). You handle CRM POLISH — making every page feel complete and professional.

## BEFORE YOU DO ANYTHING
1. Read the project instructions: `/Users/loganbronstein/Claude Code/CLAUDE.md`
2. Read coordination state: `/Users/loganbronstein/Claude Code/sale-advisor/Sale-Advisor CRM/.agent-coordination/shared-state.md`
3. Read shared learnings: `/Users/loganbronstein/Claude Code/sale-advisor/Sale-Advisor CRM/.agent-coordination/learnings.md`

## WORKTREE SETUP (MANDATORY — DO THIS FIRST)
```
cd "/Users/loganbronstein/Claude Code/sale-advisor/Sale-Advisor CRM"
git worktree add .claude/worktrees/terminal-c-r2 -b terminal-c-r2
cd .claude/worktrees/terminal-c-r2
```
ALL your work happens inside that worktree. Never cd back to the main directory.

## YOUR MISSION: Make every CRM page launch-ready

### TASK 1: Fix Campaigns Page (currently an empty skeleton)

The campaigns page at `src/app/campaigns/page.tsx` is just a title and a placeholder component. Two options — pick the better one:

**Option A (Recommended):** Build a simple, useful campaigns page that doesn't need external API integration yet:
- Manual campaign tracker — Logan enters: campaign name, platform (Meta/Google/TikTok), start date, budget, target audience, status (active/paused/completed)
- Simple table showing all campaigns with totals
- Links campaigns to lead source tracking (UTM fields already exist on Lead model: utmSource, utmMedium, utmCampaign, utmContent, utmTerm, adPlatform, campaignId, adId)
- Show: leads generated per campaign (count leads where campaignId matches)
- Show: cost per lead (budget / lead count)

**New model needed** — write to `.agent-coordination/schema-requests-c.md`:
```
NEW MODEL: Campaign
- id          String   @id @default(cuid())
- name        String
- platform    String   // "meta", "google", "tiktok", "nextdoor"
- status      String   @default("DRAFT")  // DRAFT, ACTIVE, PAUSED, COMPLETED
- budgetCents Int?
- startDate   DateTime?
- endDate     DateTime?
- targetAudience String?
- notes       String?
- utmCampaign String?  // links to Lead.utmCampaign for attribution
- createdAt   DateTime @default(now())
- updatedAt   DateTime @updatedAt
- @@index([status])
- @@index([platform])
```

**Create:**
- `src/app/campaigns/CampaignsView.tsx` — client component with campaign list + create form
- `src/app/api/campaigns/route.ts` — GET (list) + POST (create)
- `src/app/api/campaigns/[id]/route.ts` — PATCH (update status/budget)

### TASK 2: Enhance Analytics Page

Current analytics at `src/app/analytics/page.tsx` shows basic stats. Make it actually useful:

**Modify:** `src/app/analytics/page.tsx` and create `src/app/analytics/AnalyticsView.tsx`

Add these sections:
1. **Conversion funnel** — Leads → Clients → Items Listed → Items Sold → Paid Out (show counts and conversion rates between each step)
2. **Revenue breakdown** — Total gross sales, total commission earned, total payouts, total delivery revenue. Show as cards.
3. **Lead source performance** — Table: source, lead count, conversion rate to client, avg items per client. Which source brings the best leads?
4. **Inventory pipeline** — Bar chart or card grid showing: items pending pickup, in possession, listed, sold, delivered. Visual pipeline.
5. **Time filters** — Dropdown: Last 7 days, Last 30 days, All time. Filter all stats by date range.

You'll need to create new query functions. Since you can't modify `src/lib/queries.ts`, create your own query file:
**Create:** `src/lib/analytics-queries.ts` — import prisma from `@/lib/prisma` and write your analytics queries here.

### TASK 3: Global Search

Build a search bar that searches across leads, clients, and listings from one input.

**Create:** `src/components/GlobalSearch.tsx`
- Search input in a modal (triggered by a search icon in the sidebar or header)
- As you type, shows results grouped: Leads, Clients, Listings
- Searches by name, phone, email, title
- Click a result → navigate to that lead/client/listing detail page
- Debounced (300ms) to avoid hammering the API

**Create:** `src/app/api/search/route.ts`
- GET `?q=john` — searches Lead (name, phone, email), Client (name, phone, email), Listing (title, description)
- Returns `{ leads: [...], clients: [...], listings: [...] }` with id, name/title, and type
- Limit 5 results per category
- Case-insensitive search using Prisma `contains` with `mode: "insensitive"`

**Add search trigger** — You CAN modify the layout to add a search icon. Create a wrapper component:
**Create:** `src/components/SearchTrigger.tsx` — small search icon button that opens GlobalSearch modal. This will be added to the sidebar by Terminal A.

### TASK 4: Client Detail — Show Walkthrough Info

The client detail page at `src/app/clients/[id]/page.tsx` doesn't show the walkthrough fields that were added to the Client model (walkthroughDate, walkthroughAddress, walkthroughNotes).

**Create:** `src/components/clients/WalkthroughInfo.tsx`
- A card component showing walkthrough date, address, and notes
- Shows "Scheduled for [date] at [address]" or "Completed" based on client stage
- Include walkthrough notes if present

Write to `.agent-coordination/schema-requests-c.md` that Terminal A should add this component to the client detail page, since you cannot modify `src/app/clients/[id]/page.tsx`.

---

## FILE BOUNDARIES

### Files you CAN create/modify:
- `src/app/campaigns/page.tsx`
- `src/app/campaigns/CampaignsView.tsx` (new)
- `src/app/api/campaigns/route.ts` (new)
- `src/app/api/campaigns/[id]/route.ts` (new)
- `src/app/analytics/page.tsx`
- `src/app/analytics/AnalyticsView.tsx` (new)
- `src/app/api/search/route.ts` (new)
- `src/lib/analytics-queries.ts` (new — your own query file)
- `src/components/GlobalSearch.tsx` (new)
- `src/components/SearchTrigger.tsx` (new)
- `src/components/clients/WalkthroughInfo.tsx` (new)
- `src/components/analytics/*.tsx` (new)
- `src/components/campaigns/*.tsx` (new)

### Files you MUST NOT touch:
- `prisma/schema.prisma` — write requests to `.agent-coordination/schema-requests-c.md`
- `src/lib/queries.ts`
- `src/lib/validation.ts`
- `src/lib/prisma.ts` (import from it, don't modify)
- `src/components/Sidebar.tsx`
- `src/components/DashboardSummary.tsx`
- `src/app/page.tsx` (dashboard)
- `src/middleware.ts`
- Anything under `src/app/walkthroughs/`, `src/app/inventory/`
- Anything under `src/app/leads/`, `src/app/clients/` (except new components in src/components/clients/)
- Anything under `src/app/messages/`, `src/app/deliveries/`, `src/app/payouts/`
- Anything under `src/app/listings/` (Terminal B owns this)
- Anything under `src/app/pricing/`, `src/app/intake/`
- `src/services/marketplace/` (Terminal B owns this)

### If you need a schema change:
Write it to `.agent-coordination/schema-requests-c.md` and tell the user "Terminal A needs to apply my schema request."

---

## CODING PATTERNS (follow these exactly)
- Money stored as cents (Int). Display: `"$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })`
- Dates: serialize with `JSON.parse(JSON.stringify())` when passing server → client components
- Data pages: `export const dynamic = "force-dynamic"`
- Toast: `useToast()` from `@/components/Toast` — `toast("msg")` success, `toast("msg", "error")` error
- API errors: `{ ok: false, errors: [...] }`
- Buttons: `btn btn-primary`, `btn btn-secondary`
- Inputs: `form-input` class
- Cards: `card`, `card-header`, `card-title`
- Status badges: `ad-status` class
- Next.js 16: `params` is a Promise — must `await params`
- Dark theme: all CRM pages use the existing dark theme. Do NOT use light/white backgrounds.

## WHEN DONE
1. Run `npx next build` in your worktree — zero errors required
2. Commit: `git add -A && git commit -m "Terminal C R2: Analytics, campaigns, global search, client walkthrough info"`
3. Update `.agent-coordination/shared-state.md` with what you built
4. Tell the user: "Terminal C is done. Tell Terminal A to merge."
