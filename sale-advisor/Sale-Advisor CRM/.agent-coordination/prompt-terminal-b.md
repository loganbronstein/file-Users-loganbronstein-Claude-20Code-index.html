# TERMINAL B — Copy-paste this entire block into Terminal B

You are Terminal B in a 3-terminal parallel build of the Sale Advisor CRM. Sale Advisor is a consignment sales company launching in Chicago within one month. The CRM manages leads, clients, walkthroughs, inventory, listings, messages, deliveries, and payouts.

## STEP 1 — READ THESE FILES BEFORE DOING ANYTHING
Read these coordination files to understand the full system:
- `/Users/loganbronstein/Claude Code/sale-advisor/Sale-Advisor CRM/.agent-coordination/shared-state.md`
- `/Users/loganbronstein/Claude Code/sale-advisor/Sale-Advisor CRM/.agent-coordination/learnings.md`
- `/Users/loganbronstein/Claude Code/sale-advisor/Sale-Advisor CRM/CLAUDE.md`

## STEP 2 — CREATE YOUR WORKTREE (MANDATORY)
You MUST work in an isolated git worktree. Run this immediately:
```
cd "/Users/loganbronstein/Claude Code/sale-advisor/Sale-Advisor CRM"
git add -A && git stash
git worktree add .claude/worktrees/terminal-b -b terminal-b
cd .claude/worktrees/terminal-b
```
ALL of your work happens inside `.claude/worktrees/terminal-b/`. Never cd back to the main directory.

## STEP 3 — YOUR MISSION
Make the **Messages, Deliveries, and Payouts** pages production-ready for real client usage. These pages exist but are basic. They need to handle real SMS conversations, real delivery scheduling, and real payout tracking for a business launching in one month.

---

## TASK 1: Messages Page Overhaul (HIGHEST PRIORITY)

The messages page currently shows a conversation list. It needs to become a real messaging interface.

**Modify:** `src/app/messages/MessagesView.tsx`
**Modify:** `src/app/messages/page.tsx`
**Create new components as needed in:** `src/components/messages/`

### What to build:
1. **Two-panel layout** — conversation list on the left, active conversation on the right
2. **Message composer** — text input at bottom of conversation panel, sends via `POST /api/messages/send` with `{ conversationId, content }` — the API already exists and works with Twilio
3. **Message status indicators** — show sent/delivered/failed based on `message.status` field
4. **Quick reply templates** — dropdown with common responses:
   - "Hi! Thanks for reaching out to Sale Advisor. When would be a good time to schedule an in-home estimate?"
   - "Great, we'll have someone out to take a look. What's the best address?"
   - "Your items have been picked up and we're working on getting them listed!"
   - "Good news — your item sold! We'll be scheduling delivery and your payout soon."
   - "Your payout has been sent. Thanks for choosing Sale Advisor!"
5. **Conversation header** — show contact name, phone, whether they're a lead or client, link to their lead/client page
6. **Mark as read** — when opening a conversation, mark unread messages as read via `PATCH /api/messages` (you'll create this endpoint)
7. **Empty states** — "Select a conversation" when none selected, "No messages yet" when conversation is empty
8. **Auto-scroll** — conversation should scroll to bottom when opened

### New API route to create:
**`src/app/api/conversations/[id]/read/route.ts`** — PATCH marks all unread inbound messages in conversation as read

### Existing APIs you'll use (DO NOT modify these):
- `GET /api/conversations` — returns all conversations with latest message
- `GET /api/conversations/[id]/messages` — returns messages for a conversation
- `POST /api/messages/send` — sends SMS via Twilio

---

## TASK 2: Deliveries Page Enhancement

**Modify:** `src/app/deliveries/DeliveriesView.tsx`
**Modify:** `src/app/deliveries/page.tsx`

### What to build:
1. **Tab filters** — All, Scheduled, In Transit, Delivered, Cancelled (like the inventory page pattern)
2. **Inline status updates** — each delivery row gets a "Next Step" button:
   - SCHEDULED → "Start Pickup" (transitions to PICKUP)
   - PICKUP → "Mark In Transit" (transitions to IN_TRANSIT)
   - IN_TRANSIT → "Mark Delivered" (transitions to DELIVERED)
   - Uses existing `PATCH /api/deliveries/[id]` which already validates transitions
3. **Better delivery cards** — show:
   - Client name (linked to client page)
   - From/to addresses
   - Scheduled date/time
   - Crew size
   - Cost and revenue (if set)
   - Status badge
4. **Date grouping** — group deliveries by date (Today, Tomorrow, This Week, Later, Past)
5. **Revenue summary** at the top — total revenue, total cost, profit across all visible deliveries

---

## TASK 3: Payouts Page Enhancement

**Modify:** `src/app/payouts/PayoutsView.tsx`
**Modify:** `src/app/payouts/page.tsx`

### What to build:
1. **Tab filters** — All, Pending, Processing, Paid, Failed
2. **Inline "Mark as Paid" button** — on PENDING/PROCESSING payouts, one click to transition to PAID via existing `PATCH /api/payouts/[id]`
3. **Payout breakdown** — each row shows:
   - Client name (linked)
   - Gross sale amount
   - Commission % and amount
   - Delivery fee
   - Net payout to client
   - Status badge
   - Date paid (if paid)
4. **Summary cards at top** — Total paid out, Total pending, Total commission earned, Average commission %

---

## BOUNDARIES — CRITICAL

### Files you CAN modify:
- `src/app/messages/MessagesView.tsx`
- `src/app/messages/page.tsx`
- `src/app/deliveries/DeliveriesView.tsx`
- `src/app/deliveries/page.tsx`
- `src/app/payouts/PayoutsView.tsx`
- `src/app/payouts/page.tsx`
- Any file under `src/app/api/conversations/` (for new read endpoint)
- Any file under `src/app/api/messages/` (only for new endpoints)

### Files you CAN create:
- `src/components/messages/*.tsx` (new message components)
- `src/components/deliveries/*.tsx` (new delivery components)
- `src/components/payouts/*.tsx` (new payout components)
- New API routes within your domain

### Files you MUST NOT touch (Terminal A owns these):
- `prisma/schema.prisma`
- `src/lib/queries.ts`
- `src/lib/validation.ts`
- `src/lib/prisma.ts`
- `src/components/Sidebar.tsx`
- `src/components/DashboardSummary.tsx`
- `src/app/page.tsx`
- `src/middleware.ts`
- Anything under `src/app/walkthroughs/`
- Anything under `src/app/inventory/`
- Anything under `src/app/leads/`
- Anything under `src/app/clients/`

### If you need something from an owned file:
- Need a new query? Create a local helper function in your own component or API route. Call `prisma` directly from your API routes (import from `@/lib/prisma`).
- Need a schema change? Write it to `.agent-coordination/schema-requests-b.md` and tell the user "Terminal A needs to apply my schema request."
- Need a new public path in middleware? Write it to `.agent-coordination/schema-requests-b.md`.

---

## COORDINATION PROTOCOL

1. After each major task completion, update `.agent-coordination/shared-state.md` — change your status and list what you built
2. If you discover a useful pattern, add it to `.agent-coordination/learnings.md`
3. When ALL tasks are done:
   - Commit your changes in the worktree: `git add -A && git commit -m "Terminal B: Production-ready messages, deliveries, payouts"`
   - Update shared-state.md status to COMPLETE
   - Tell the user: "Terminal B is done. Tell Terminal A to merge."

## QUALITY STANDARDS
- Every page must build with zero TypeScript errors
- Test with `npx next build` in your worktree before declaring done
- Follow existing CRM styling patterns (dark theme, card-based layout, consistent spacing)
- All money displayed as dollars with 2 decimal places
- All status transitions must go through existing API validation
- No auto-texting customers — all messages are manually sent by Logan/Keller from the CRM
