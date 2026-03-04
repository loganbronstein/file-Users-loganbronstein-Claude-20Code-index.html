# TERMINAL B — ROUND 2: CRM Marketplace Workflow + Sold Flow

You are Terminal B in a multi-terminal parallel build of the Sale Advisor CRM.

## WHO YOU ARE
You are a full-stack engineer working on the Sale Advisor CRM. Sale Advisor is a consignment sales company launching in Chicago within one month. They come to people's homes, catalog items to sell, list them on marketplaces (Facebook Marketplace, eBay, Craigslist, OfferUp), deliver via their moving company (Lakeshore Hauling), and take a commission.

You are one of 3 parallel agents. Terminal A is the orchestrator on the main branch. Terminal C handles CRM polish. Terminal D builds the Ad Creative Agent (completely separate). You handle the REVENUE PATH — marketplace posting and the sold-to-payout flow.

## BEFORE YOU DO ANYTHING
1. Read the project instructions: `/Users/loganbronstein/Claude Code/CLAUDE.md`
2. Read coordination state: `/Users/loganbronstein/Claude Code/sale-advisor/Sale-Advisor CRM/.agent-coordination/shared-state.md`
3. Read shared learnings: `/Users/loganbronstein/Claude Code/sale-advisor/Sale-Advisor CRM/.agent-coordination/learnings.md`

## WORKTREE SETUP (MANDATORY — DO THIS FIRST)
```
cd "/Users/loganbronstein/Claude Code/sale-advisor/Sale-Advisor CRM"
git worktree add .claude/worktrees/terminal-b-r2 -b terminal-b-r2
cd .claude/worktrees/terminal-b-r2
```
ALL your work happens inside that worktree. Never cd back to the main directory.

## CONTEXT: What already exists
- Marketplace adapter framework at `src/services/marketplace/` — has index.ts, types.ts, and 4 adapter files (facebook, ebay, craigslist, offerup). ALL ADAPTERS ARE PLACEHOLDERS that log to console and return fake success.
- Listing approve route at `src/app/api/listings/[id]/approve/route.ts` — transitions DRAFT → APPROVED → POSTING → POSTED, calls adapters, stores results in ListingEvent metadata JSON.
- Listing detail page at `src/app/listings/[id]/ListingDetail.tsx` — has approve modal with marketplace checkboxes, photo gallery, edit mode, AI regen.
- Listings list at `src/app/listings/ListingsView.tsx` — tab filters by status.
- Deliveries, payouts, inventory pages all work.

## YOUR MISSION: Make the revenue path work end-to-end

### TASK 1: Manual Marketplace Posting Workflow (HIGHEST PRIORITY)

Real marketplace APIs mostly don't exist publicly (Facebook Marketplace has no API, Craigslist is manual, OfferUp is manual). Instead of fake adapters, build a "manual post assist" workflow:

**Replace each adapter** in `src/services/marketplace/` to return a result that tells the user "ready for manual posting" instead of faking success.

**Update the approve flow** so that when Logan approves a listing:
1. System generates marketplace-ready content for each selected marketplace (title, description, price, formatted for that platform)
2. Listing moves to POSTING status
3. Each marketplace gets a `MarketplacePost` record (see schema below) with status PENDING
4. Logan sees a checklist on the listing detail page: "Post to Facebook Marketplace ✓/pending", "Post to eBay ✓/pending", etc.
5. For each marketplace, there's a "Copy Listing" button that copies pre-formatted text to clipboard, and a "Mark as Posted" button where Logan pastes the URL after manually posting
6. Once all marketplaces are marked posted, listing auto-transitions to POSTED

**Add to schema** — write this to `.agent-coordination/schema-requests-b.md` for Terminal A to apply:
```
NEW MODEL: MarketplacePost
- id          String   @id @default(cuid())
- listingId   String
- listing     Listing  @relation(fields: [listingId], references: [id], onDelete: Cascade)
- marketplace String   // "facebook", "ebay", "craigslist", "offerup"
- status      String   @default("PENDING")  // PENDING, POSTED, FAILED, REMOVED
- externalUrl String?  // URL where the listing was posted
- externalId  String?  // marketplace's ID for the listing
- postedAt    DateTime?
- createdAt   DateTime @default(now())
- updatedAt   DateTime @updatedAt
- @@index([listingId])
- @@index([marketplace])
- @@unique([listingId, marketplace])

ADD TO Listing MODEL:
- marketplacePosts MarketplacePost[]
```

**NOTE:** Since you can't modify the schema directly, build your code assuming MarketplacePost exists. Use Prisma calls to it. When Terminal A applies the schema, your code will work. In the meantime, if you need to test, create a temporary type/interface that matches.

**New API routes to create:**
- `POST /api/listings/[id]/marketplace-posts` — create MarketplacePost records when approving
- `PATCH /api/listings/[id]/marketplace-posts/[postId]` — mark individual marketplace post as posted (with URL)

### TASK 2: Sold Flow — Connect the Pieces

When an item sells on a marketplace, Logan needs one smooth flow:

**New: `src/components/listings/MarkSoldModal.tsx`**
- Modal triggered from listing detail page
- Fields: buyer name, buyer contact (phone/email), sale price, which marketplace it sold on
- On submit: transitions listing to SOLD, updates soldAt, records buyer info
- Auto-suggests: "Schedule delivery?" and "Create payout?" with pre-filled data

**Update listing detail page** to show:
- After POSTED: "Mark as Sold" button
- After SOLD: buyer info, delivery status, payout status
- Link to schedule delivery (pre-fills from/to address)
- Link to create payout (pre-fills gross sale from sale price)

**New API: `POST /api/listings/[id]/sold`**
- Accepts: buyerName, buyerContact, soldPriceCents, marketplace
- Transitions listing POSTED → SOLD
- Updates inventory item status to SOLD + soldPriceCents
- Creates ActivityLog entry

### TASK 3: Listing Detail Page — Marketplace Status Section

Add a new section to `src/app/listings/[id]/ListingDetail.tsx` showing:
- Per-marketplace post status (PENDING / POSTED / FAILED)
- Posted URL (clickable link)
- "Copy Listing Text" button per marketplace
- "Mark as Posted" button with URL input
- Post date

---

## FILE BOUNDARIES

### Files you CAN create/modify:
- `src/services/marketplace/*.ts` (all adapter files)
- `src/app/listings/[id]/ListingDetail.tsx` (update with marketplace status + sold flow)
- `src/app/listings/ListingsView.tsx` (if needed)
- `src/app/api/listings/[id]/approve/route.ts` (update approve flow)
- `src/app/api/listings/[id]/sold/route.ts` (new)
- `src/app/api/listings/[id]/marketplace-posts/route.ts` (new)
- `src/components/listings/*.tsx` (new components)

### Files you MUST NOT touch:
- `prisma/schema.prisma` — write requests to `.agent-coordination/schema-requests-b.md`
- `src/lib/queries.ts`
- `src/lib/validation.ts`
- `src/lib/prisma.ts` (import from it, don't modify)
- `src/components/Sidebar.tsx`
- `src/app/page.tsx` (dashboard)
- `src/middleware.ts`
- Anything under `src/app/walkthroughs/`, `src/app/inventory/`, `src/app/leads/`, `src/app/clients/`
- Anything under `src/app/messages/`, `src/app/deliveries/`, `src/app/payouts/`
- Anything under `src/app/pricing/`, `src/app/intake/`
- Anything under `src/app/analytics/`, `src/app/campaigns/`, `src/app/sources/`

### If you need a schema change:
Write it to `.agent-coordination/schema-requests-b.md` and tell the user "Terminal A needs to apply my schema request."

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

## WHEN DONE
1. Run `npx next build` in your worktree — zero errors required
2. Commit: `git add -A && git commit -m "Terminal B R2: Marketplace posting workflow + sold flow"`
3. Update `.agent-coordination/shared-state.md` with what you built
4. Tell the user: "Terminal B is done. Tell Terminal A to merge."
