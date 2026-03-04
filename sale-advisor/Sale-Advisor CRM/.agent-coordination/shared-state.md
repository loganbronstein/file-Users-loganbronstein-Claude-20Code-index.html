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

## Terminal B — MESSAGES + DELIVERIES + PAYOUTS
**Status:** ASSIGNED
**Branch:** worktree (isolated copy)
**Boundaries:**
- ONLY create/modify files within your assigned domains (see prompt)
- Do NOT touch any file listed under Terminal A's owned files
- If you need a schema change, write it to .agent-coordination/schema-requests-b.md
- If you need a new query, write it to .agent-coordination/query-requests-b.md
- Terminal A will apply schema/query changes from main

## Terminal C — PRICING TOOL + LEAD INTAKE
**Status:** COMPLETE
**Branch:** terminal-c (worktree at .claude/worktrees/terminal-c)
**What was built:**
- Pricing Research Tool (`/pricing`) — search form, pricing algorithm with built-in reference data, condition multipliers, marketplace-specific recommendations, category tips, clipboard copy, recent searches in localStorage
- Public Lead Intake Page (`/intake`) — client-facing form with Sale Advisor branding, mobile-first, creates leads, upserts conversations, notifies admin, handles duplicate phones
- API: `POST /api/pricing/research` (auth-protected)
- API: `POST /api/intake` (needs to be public — see schema-requests-c.md)
- Schema-requests written for: middleware public paths (/intake, /api/intake) + sidebar entry (Pricing Tool)
**No schema changes needed. No existing files modified.**

## Schema Change Protocol
1. Agent writes needed schema change to their schema-requests file
2. Terminal A reviews and applies from main branch
3. Terminal A runs `prisma db push` and `prisma generate`
4. Agent pulls updated schema into their worktree

## Merge Order
1. Terminal B merges first (touches CRM operational pages)
2. Terminal C merges second (mostly separate directory)
3. Terminal A resolves any conflicts
