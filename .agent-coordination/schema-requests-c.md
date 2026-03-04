# Terminal C — Requests for Terminal A

## MIDDLEWARE REQUEST (from R1)
Add these to PUBLIC_PATHS in `src/middleware.ts`:
- `"/intake"` — public lead intake page (client-facing)
- `"/api/intake"` — public lead intake API endpoint

## SIDEBAR REQUEST (from R1)
Add this entry to the **Operations** section in `src/components/Sidebar.tsx`:
```
{ icon: "💲", label: "Pricing Tool", href: "/pricing" }
```

---

## R2 REQUESTS

## SCHEMA REQUEST: Campaign Model
Add this model to `prisma/schema.prisma`:
```prisma
model Campaign {
  id              String    @id @default(cuid())
  name            String
  platform        String    // "meta", "google", "tiktok", "nextdoor", "other"
  status          String    @default("DRAFT") // DRAFT, ACTIVE, PAUSED, COMPLETED
  budgetCents     Int?
  startDate       DateTime?
  endDate         DateTime?
  targetAudience  String?
  notes           String?
  utmCampaign     String?   // links to Lead.utmCampaign for attribution
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([status])
  @@index([platform])
}
```
Until this model is created, the campaigns feature uses an in-memory store that works but doesn't persist across server restarts.

## SIDEBAR REQUEST: Search Trigger
Add `<SearchTrigger />` component (from `src/components/SearchTrigger.tsx`) to the sidebar layout, above the nav sections. It renders a search bar button with Cmd+K shortcut.

## CLIENT DETAIL REQUEST: WalkthroughInfo Component
Add `<WalkthroughInfo />` component (from `src/components/clients/WalkthroughInfo.tsx`) to the client detail page (`src/app/clients/[id]/page.tsx`). Pass these props from the client record:
```tsx
<WalkthroughInfo
  stage={client.stage}
  walkthroughDate={client.walkthroughDate?.toISOString() || null}
  walkthroughAddress={client.walkthroughAddress || null}
  walkthroughNotes={client.walkthroughNotes || null}
/>
```
