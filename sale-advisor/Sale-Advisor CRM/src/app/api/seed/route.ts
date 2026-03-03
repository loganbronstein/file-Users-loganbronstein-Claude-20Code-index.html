import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  // Upsert the two allowlisted admin users
  const users = [
    { email: "loganbronstein@saleadvisor.com", name: "Logan Bronstein" },
    { email: "kellerwestman@saleadvisor.com", name: "Keller Westman" },
  ];

  const created = [];
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: { email: u.email, name: u.name, role: "ADMIN" },
      update: { name: u.name, role: "ADMIN" },
    });
    created.push(user.email);
  }

  return NextResponse.json({ message: "Admin users ready", emails: created });
}
