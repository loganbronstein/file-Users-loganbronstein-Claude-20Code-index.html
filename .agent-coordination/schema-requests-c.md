# Terminal C — Requests for Terminal A

## MIDDLEWARE REQUEST
Add these to PUBLIC_PATHS in `src/middleware.ts`:
- `"/intake"` — public lead intake page (client-facing)
- `"/api/intake"` — public lead intake API endpoint

## SIDEBAR REQUEST
Add this entry to the **Operations** section in `src/components/Sidebar.tsx`:
```
{ icon: "💲", label: "Pricing Tool", href: "/pricing" }
```
