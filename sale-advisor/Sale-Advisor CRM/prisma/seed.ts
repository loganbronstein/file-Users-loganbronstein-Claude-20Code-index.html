import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── Helpers ─────────────────────────────────────────────

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));
  return d;
}

function futureDate(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(Math.floor(Math.random() * 4) + 9, 0);
  return d;
}

function phoneNum(i: number): string {
  return `+1312555${String(1000 + i).slice(-4)}`;
}

const SOURCES = ["FACEBOOK", "INSTAGRAM", "GOOGLE", "NEXTDOOR", "REFERRAL", "WEBSITE", "OTHER"];
const LEAD_STAGES = ["NEW_LEAD", "CONTACTED", "WALKTHROUGH_BOOKED", "LOST"];
const NEIGHBORHOODS = ["Lincoln Park", "Wicker Park", "Logan Square", "Bucktown", "Lakeview", "Gold Coast", "Old Town", "River North", "West Loop", "Hyde Park"];
const ITEMS = [
  "Leather sectional couch, coffee table, two end tables",
  "Vintage dining set — table + 6 chairs, mid-century modern",
  "King bedroom set, dresser, two nightstands",
  "Peloton bike, barely used, plus weights and yoga mat",
  "Louis Vuitton handbag collection — 4 bags total",
  "Antique writing desk, solid oak, excellent condition",
  "Full patio set — table, 6 chairs, umbrella, fire pit",
  "Moving out — everything must go. Furniture, electronics, clothes",
  "Designer clothing lot — Gucci, Prada, Balenciaga",
  "Two mountain bikes + gear — barely ridden",
  "Baby grand piano — Yamaha, 2018",
  "Washer/dryer combo, Samsung, 2 years old",
  "Art collection — 8 framed pieces, some original",
  "Home gym equipment — squat rack, bench, dumbbells",
  "Restaurant equipment — commercial oven, mixer, prep tables",
  "Comic book collection — 500+ issues, some rare",
  "Record collection — 200+ vinyl, many first pressings",
  "Power tools lot — DeWalt, Milwaukee, great condition",
  "Vintage sneaker collection — 15 pairs, all DS or near DS",
  "Rolex Submariner + Tag Heuer — authenticated",
];
const NAMES = [
  "Sarah Mitchell", "James Rodriguez", "Maria Santos", "David Kim",
  "Emily Chen", "Marcus Johnson", "Lisa Park", "Robert Williams",
  "Jennifer Lopez", "Michael Brown", "Amanda Taylor", "Kevin O'Brien",
  "Rachel Green", "Chris Martinez", "Nicole Foster", "Andrew Chang",
  "Sophia Russo", "Tyler Brooks", "Hannah Goldstein", "Brian Patel",
];

// ── Main ────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding Sale Advisor database...\n");

  // Clear existing data (order matters for FK constraints)
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.client.deleteMany();
  await prisma.lead.deleteMany();
  console.log("  Cleared existing data");

  // ── Create 20 leads ────────────────────────────────────
  const leads = [];
  for (let i = 0; i < 20; i++) {
    const stage = i < 6 ? "NEW_LEAD" : i < 10 ? "CONTACTED" : i < 14 ? "WALKTHROUGH_BOOKED" : rand(LEAD_STAGES);
    const lead = await prisma.lead.create({
      data: {
        name: NAMES[i],
        phone: phoneNum(i),
        phoneE164: phoneNum(i),
        email: `${NAMES[i].toLowerCase().replace(" ", ".")}@gmail.com`,
        source: rand(SOURCES),
        stage,
        neighborhood: rand(NEIGHBORHOODS),
        itemsDescription: ITEMS[i],
        estimatedValue: Math.floor(Math.random() * 8000) + 500,
        createdAt: daysAgo(Math.floor(Math.random() * 30)),
      },
    });
    leads.push(lead);
  }
  console.log(`  Created ${leads.length} leads`);

  // ── Convert 5 leads to clients ─────────────────────────
  const clientLeads = leads.filter((l) => l.stage === "WALKTHROUGH_BOOKED").slice(0, 5);
  const CLIENT_STAGES = ["WALKTHROUGH_SCHEDULED", "WALKTHROUGH_COMPLETED", "LISTING_ACTIVE", "PARTIALLY_SOLD", "SOLD_PAID"];
  const clients = [];
  for (let i = 0; i < clientLeads.length; i++) {
    const cl = clientLeads[i];
    const client = await prisma.client.create({
      data: {
        leadId: cl.id,
        name: cl.name,
        email: cl.email,
        phone: cl.phone,
        neighborhood: cl.neighborhood,
        stage: CLIENT_STAGES[i % CLIENT_STAGES.length],
        notes: i === 0 ? "Very motivated seller — wants everything gone before move" : null,
        createdAt: daysAgo(Math.floor(Math.random() * 14)),
      },
    });
    clients.push(client);

    // Mark lead as converted
    await prisma.lead.update({
      where: { id: cl.id },
      data: { convertedAt: client.createdAt, stage: "WALKTHROUGH_BOOKED" },
    });
  }
  console.log(`  Created ${clients.length} clients`);

  // ── Create inventory items for clients ─────────────────
  const inventoryStatuses = ["PENDING_PICKUP", "IN_POSSESSION", "LISTED", "SOLD", "DELIVERED_TO_BUYER"];
  const itemTitles = [
    "Leather Sectional", "Coffee Table", "Dining Table Set", "King Bed Frame",
    "Peloton Bike", "LV Neverfull MM", "Antique Desk", "Patio Furniture Set",
    "Gucci Belt", "Mountain Bike", "Samsung Washer", "Framed Oil Painting",
    "Squat Rack", "DeWalt Drill Set", "Air Jordan 1 Retro", "Rolex Submariner",
  ];
  for (const client of clients) {
    const numItems = Math.floor(Math.random() * 3) + 2;
    for (let j = 0; j < numItems; j++) {
      const status = rand(inventoryStatuses);
      const est = Math.floor(Math.random() * 200000) + 5000;
      await prisma.inventoryItem.create({
        data: {
          clientId: client.id,
          title: rand(itemTitles),
          category: rand(["Furniture", "Electronics", "Fashion", "Sports", "Art", "Jewelry"]),
          condition: rand(["Excellent", "Good", "Fair"]),
          estValueCents: est,
          listPriceCents: status !== "PENDING_PICKUP" ? Math.round(est * 1.1) : null,
          soldPriceCents: status === "SOLD" || status === "DELIVERED_TO_BUYER" ? Math.round(est * 0.95) : null,
          marketplace: status !== "PENDING_PICKUP" ? rand(["Facebook Marketplace", "eBay", "Craigslist"]) : null,
          status,
          listedAt: status !== "PENDING_PICKUP" ? daysAgo(Math.floor(Math.random() * 10)) : null,
          soldAt: status === "SOLD" || status === "DELIVERED_TO_BUYER" ? daysAgo(Math.floor(Math.random() * 5)) : null,
        },
      });
    }
  }
  console.log("  Created inventory items");

  // ── Create conversations + messages (50 total) ─────────
  const msgTemplatesInbound = [
    "Hey, I saw your ad on Facebook. I have a bunch of stuff I want to sell.",
    "Hi! Is this Sale Advisor? I've got furniture I need gone before my move.",
    "What's your commission rate?",
    "Can you come this Saturday to check everything out?",
    "I've got about 15 items total — furniture, clothes, and some electronics.",
    "Sounds great, Saturday at 10am works for me.",
    "Do you sell cars too? I've got a 2019 BMW I want to list.",
    "My neighbor used your service and loved it. Wanted to reach out.",
    "What's the process for high-value items like watches?",
    "Perfect, see you then! The address is 1234 N Damen Ave.",
  ];
  const msgTemplatesOutbound = [
    "Hey! Thanks for reaching out to Sale Advisor. We'd love to help you sell your stuff. What kind of items are you looking to sell?",
    "Great question — we take 20-30% depending on the item value. No upfront cost to you.",
    "Absolutely! We can come by this Saturday. What time works?",
    "Sounds good — we'll come catalog everything and get it listed across all marketplaces.",
    "Yes we handle everything from furniture to luxury goods to vehicles. We'll get you the best price.",
    "Perfect, we'll see you Saturday at 10am. Looking forward to it!",
    "Just confirming — walkthrough is set for Saturday at 10am at your place.",
    "We've listed your items! I'll keep you updated as offers come in.",
    "Great news — your couch sold for $850! Buyer pickup is scheduled for Thursday.",
    "Your payout of $680 has been processed. Thanks for working with Sale Advisor!",
  ];

  let msgCount = 0;
  // Create conversations for 10 leads
  const conversationLeads = leads.slice(0, 10);
  for (let i = 0; i < conversationLeads.length; i++) {
    const lead = conversationLeads[i];
    const matchingClient = clients.find((c) => c.leadId === lead.id);

    const conv = await prisma.conversation.create({
      data: {
        phoneE164: lead.phoneE164!,
        leadId: lead.id,
        clientId: matchingClient?.id || null,
        lastMessageAt: daysAgo(i),
      },
    });

    // 3-7 messages per conversation
    const numMsgs = Math.floor(Math.random() * 5) + 3;
    for (let j = 0; j < numMsgs; j++) {
      const isInbound = j % 2 === 0;
      const createdAt = daysAgo(Math.max(0, 20 - i * 2 - j));
      await prisma.message.create({
        data: {
          content: isInbound ? rand(msgTemplatesInbound) : rand(msgTemplatesOutbound),
          direction: isInbound ? "INBOUND" : "OUTBOUND",
          read: j < numMsgs - 1 || !isInbound, // last inbound might be unread
          conversationId: conv.id,
          leadId: lead.id,
          clientId: matchingClient?.id || null,
          status: isInbound ? "received" : "delivered",
          createdAt,
        },
      });
      msgCount++;
    }

    // Update conversation lastMessageAt
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { lastMessageAt: daysAgo(i) },
    });
  }
  console.log(`  Created ${msgCount} messages across 10 conversations`);

  // ── Create 10 deliveries ───────────────────────────────
  const deliveryDescs = [
    "Sectional couch to buyer in Bucktown",
    "Dining set delivery to Gold Coast",
    "Pickup from client in Wicker Park",
    "Peloton delivery to Lakeview buyer",
    "Furniture lot to storage unit",
    "Watch + jewelry delivery (insured)",
    "Full apartment cleanout — Lincoln Park",
    "Patio set to River North buyer",
    "Art collection delivery",
    "Electronics lot to reseller",
  ];
  const addresses = [
    "1234 N Damen Ave, Chicago IL 60622",
    "456 W Armitage Ave, Chicago IL 60614",
    "789 N Milwaukee Ave, Chicago IL 60642",
    "321 W Division St, Chicago IL 60610",
    "555 N State St, Chicago IL 60654",
  ];
  const deliveryStatuses = ["SCHEDULED", "SCHEDULED", "PICKUP", "IN_TRANSIT", "DELIVERED", "DELIVERED"];

  for (let i = 0; i < 10; i++) {
    const client = clients[i % clients.length];
    const status = deliveryStatuses[i % deliveryStatuses.length];
    await prisma.delivery.create({
      data: {
        clientId: client.id,
        description: deliveryDescs[i],
        fromAddress: rand(addresses),
        toAddress: rand(addresses),
        status,
        crewSize: Math.floor(Math.random() * 2) + 1,
        scheduledAt: status === "DELIVERED" ? daysAgo(Math.floor(Math.random() * 7)) : futureDate(Math.floor(Math.random() * 7) + 1),
        completedAt: status === "DELIVERED" ? daysAgo(Math.floor(Math.random() * 3)) : null,
        cost: Math.floor(Math.random() * 200) + 50,
        revenue: Math.floor(Math.random() * 300) + 100,
      },
    });
  }
  console.log("  Created 10 deliveries");

  // ── Create 10 payouts ──────────────────────────────────
  const payoutStatuses = ["PENDING", "PENDING", "PROCESSING", "PAID", "PAID"];
  for (let i = 0; i < 10; i++) {
    const client = clients[i % clients.length];
    const gross = Math.floor(Math.random() * 300000) + 10000; // $100-$3000
    const commPct = rand([20, 25, 30]);
    const commCents = Math.round(gross * (commPct / 100));
    const delivFee = rand([0, 5000, 7500, 10000]);
    const status = payoutStatuses[i % payoutStatuses.length];

    await prisma.payout.create({
      data: {
        clientId: client.id,
        grossSaleCents: gross,
        deliveryFeeCents: delivFee,
        commissionPercent: commPct,
        commissionCents: commCents,
        payoutCents: gross - commCents - delivFee,
        status,
        paidAt: status === "PAID" ? daysAgo(Math.floor(Math.random() * 5)) : null,
      },
    });
  }
  console.log("  Created 10 payouts");

  console.log("\n✅ Seed complete!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
