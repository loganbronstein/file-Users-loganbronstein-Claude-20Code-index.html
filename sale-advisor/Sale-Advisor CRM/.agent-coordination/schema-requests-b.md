# Schema/Config Requests from Terminal B (Round 2)
# Terminal A will apply these from the main branch.

## Request 1: MarketplacePost model (NEW)

```prisma
model MarketplacePost {
  id          String    @id @default(cuid())
  listingId   String
  listing     Listing   @relation(fields: [listingId], references: [id], onDelete: Cascade)
  marketplace String    // "facebook", "ebay", "craigslist", "offerup"
  status      String    @default("PENDING") // PENDING, POSTED, FAILED, REMOVED
  externalUrl String?   // URL where the listing was posted
  externalId  String?   // marketplace's ID for the listing
  formattedTitle       String?  // marketplace-specific title
  formattedDescription String?  // marketplace-specific description
  postedAt    DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([listingId])
  @@index([marketplace])
  @@unique([listingId, marketplace])
}
```

## Request 2: Add relation to Listing model

```prisma
// Add to Listing model:
marketplacePosts MarketplacePost[]
```

## Request 3: Add soldPriceCents and soldMarketplace to Listing model

```prisma
// Add to Listing model:
soldPriceCents   Int?
soldMarketplace  String?  // which marketplace it sold on
```

## Status
- Written: 2026-03-04
- Applied by Terminal A: PENDING
