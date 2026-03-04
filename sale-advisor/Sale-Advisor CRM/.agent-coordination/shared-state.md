# Agent Coordination — Sale Advisor CRM

## Last Updated: 2026-03-04

## Terminal A — ORCHESTRATOR (Walkthroughs + Inventory + Dashboard)
**Status:** COMPLETE
**Branch:** main
**What was built:**
- Walkthrough scheduling API (`POST /api/walkthroughs/schedule`)
- Walkthrough completion API with item cataloging (`POST /api/walkthroughs/complete`)
- ScheduleWalkthroughModal component (reusable modal)
- CompleteWalkthroughForm component (dynamic item entry)
- Full walkthroughs page rewrite (Today/Overdue/Upcoming/Completed sections)
- Inventory management page with tab filters + table + actions
- Create-listing-from-inventory API (`POST /api/inventory/[id]/create-listing`)
- Inventory PATCH route (already existed, left alone)
- Dashboard: TodayWalkthroughs widget + upcomingWalkthroughs count in DashboardSummary
- Lead detail: Schedule Walkthrough button + modal
- Client detail: Create Listing / View Listing links on inventory items
- Sidebar: Added Inventory link
- Schema: Added walkthroughDate, walkthroughAddress, walkthroughNotes to Client model

**Files Terminal A OWNS (do NOT modify):**
- prisma/schema.prisma
- src/lib/queries.ts
- src/lib/validation.ts
- src/components/Sidebar.tsx
- src/components/DashboardSummary.tsx
- src/app/page.tsx (dashboard)
- src/middleware.ts
- src/lib/prisma.ts
- src/app/walkthroughs/* (all files)
- src/app/inventory/* (all files)
- src/components/ScheduleWalkthroughModal.tsx
- src/components/CompleteWalkthroughForm.tsx
- src/components/TodayWalkthroughs.tsx

## Terminal B — MESSAGES + DELIVERIES + PAYOUTS + MARKETPLACE + SOLD FLOW
**Status:** COMPLETE (R1 + R2)
**Branch R1:** terminal-b (worktree at .claude/worktrees/terminal-b)
**Branch R2:** terminal-b-r2 (worktree at .claude/worktrees/terminal-b-r2)

**R1 — What was built:**
- Messages page overhaul: search bar, quick reply templates (5 presets), mark-as-read API, linked conversation headers with lead/client badges, date separators, auto-resize textarea, character counter, enhanced status indicators
- New API: `PATCH /api/conversations/[id]/read` — marks inbound messages as read
- New component: `src/components/messages/QuickReplyDropdown.tsx`
- Deliveries page: new DeliveriesView with stats row (scheduled/transit/completed + revenue/cost/profit), tab filters with counts, Next Step action buttons (Start Pickup → In Transit → Delivered), date grouping (Today/Tomorrow/This Week/Later/Past), linked client names, progress bars
- New component: `src/app/deliveries/DeliveriesView.tsx`
- Payouts page: 4-card summary (Total Paid/Pending/Commission/Avg Commission %), tab filters with counts including FAILED, inline confirm/cancel on Mark Paid, status badges with distinct colors per state

**R2 — What was built:**
- Manual marketplace posting workflow (replaces fake adapters)
  - Each marketplace adapter (FB, eBay, CL, OfferUp) generates platform-specific content
  - Approve flow creates MarketplacePost records with formatted title/description
  - Listing stays in POSTING until all posts manually confirmed
  - Auto-transitions to POSTED when all marketplace posts are marked done
- MarketplacePostSection component on listing detail page
  - Per-marketplace status (PENDING/POSTED/FAILED), progress bar
  - "Copy Listing" copies platform-formatted text to clipboard
  - "Mark as Posted" with URL input, auto-confirms when all done
- Mark as Sold flow
  - MarkSoldModal: buyer name, contact, sale price, marketplace
  - POST /api/listings/[id]/sold: POSTED → SOLD, updates inventory item
  - Sale info section with buyer details + delivery/payout quick links
- New API routes: GET/PATCH marketplace-posts, POST sold
- MarketplacePost DB helper (src/services/marketplace/db.ts) — dynamic Prisma access pending schema
- **Schema request:** MarketplacePost model + soldPriceCents/soldMarketplace on Listing (see schema-requests-b.md)
**No Terminal A files modified. TypeScript clean.**

## Terminal C — PRICING TOOL + LEAD INTAKE + CRM POLISH
**Status:** COMPLETE (R1 + R2)
**Branch R1:** terminal-c (worktree at .claude/worktrees/terminal-c)
**Branch R2:** terminal-c-r2 (worktree at .claude/worktrees/terminal-c-r2)

**R1 — What was built:**
- Pricing Research Tool (`/pricing`) — search form, pricing algorithm, marketplace recs, clipboard copy, recent searches
- Public Lead Intake Page (`/intake`) — client-facing form, mobile-first, lead creation, admin notification
- API: `POST /api/pricing/research`, `POST /api/intake`

**R2 — What was built:**
- Campaigns page overhaul — manual campaign tracker with create form, status management (Draft/Active/Paused/Completed), budget tracking, UTM campaign attribution linking to Lead model, lead count + CPL calculations, summary cards
- Analytics page overhaul — revenue breakdown cards (gross sales, commission, payouts, delivery profit), conversion funnel (leads→clients→listed→sold with percentages), inventory pipeline bars, lead source performance table (conversion rate, avg items/client), time filters (7d/30d/all)
- Global Search — modal with Cmd+K shortcut, debounced search across leads/clients/listings, grouped results, click-to-navigate
- WalkthroughInfo component — shows walkthrough date/address/notes on client detail, status badge (Scheduled/Overdue/Completed)
- New files: analytics-queries.ts, AnalyticsView.tsx, CampaignsView.tsx, GlobalSearch.tsx, SearchTrigger.tsx, WalkthroughInfo.tsx, 4 API routes
- Schema request: Campaign model needed (in-memory fallback works now)
- Integration requests: SearchTrigger in sidebar, WalkthroughInfo in client detail page
**No Terminal A files modified.**

## Schema Change Protocol
1. Agent writes needed schema change to their schema-requests file
2. Terminal A reviews and applies from main branch
3. Terminal A runs `prisma db push` and `prisma generate`
4. Agent pulls updated schema into their worktree

## Merge Order
1. Terminal B merges first (touches CRM operational pages)
2. Terminal C merges second (mostly separate directory)
3. Terminal A resolves any conflicts
