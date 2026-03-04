# Shared Learnings — All Agents Write Here

## Patterns Discovered
- Money is ALWAYS stored as cents (Int). Display with `(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })`
- Dates must be serialized with `JSON.parse(JSON.stringify())` when passing from server to client components
- All data-fetching pages use `export const dynamic = "force-dynamic"`
- Toast notifications use `useToast()` from `@/components/Toast` — `toast("message")` for success, `toast("message", "error")` for error
- API routes return `{ ok: false, errors: [...] }` on failure
- Status transitions are forward-only — always check validation.ts transition maps
- The `message-item` CSS class gives you the standard list row layout used across the CRM
- The `ad-status` CSS class gives you pill/badge styling for status indicators
- `btn btn-primary` and `btn btn-secondary` are the standard button classes
- `form-input` is the standard input/select/textarea class
- `card`, `card-header`, `card-title` are the standard card classes
- Page structure: `<div className="header">` for page header, then cards below
- Navigation sections in Sidebar: Main, Marketing, Operations, System

## Architecture Notes
- Prisma 7 with `@prisma/adapter-pg` — uses Pool adapter, NOT url in schema
- Prisma client singleton at `src/lib/prisma.ts`
- Queries centralized in `src/lib/queries.ts` — but Terminal B/C should NOT modify this file
- Phone normalization: `src/lib/phone.ts` — `toE164()` and `formatPhone()`
- Notifications: `src/lib/notify.ts` — sends SMS to admin only
- Twilio integration: `src/lib/twilio.ts` — REST API via fetch, no SDK

## Gotchas
- Next.js 16 App Router — `params` is a Promise, must `await params` in route handlers
- Prisma orderBy with nulls: use `{ sort: "asc", nulls: "last" }`
- The middleware blocks all non-public routes. If you add a new public route, it needs to be added to PUBLIC_PATHS in middleware.ts — write this to your schema-requests file and Terminal A will add it
