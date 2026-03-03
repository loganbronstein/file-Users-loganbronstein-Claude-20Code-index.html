import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed in production" }, { status: 403 });
  }

  const existing = await prisma.user.findUnique({
    where: { email: "logan@saleadvisor.com" },
  });

  if (existing) {
    return NextResponse.json({ message: "Admin user already exists" });
  }

  const hashedPassword = await bcrypt.hash("saleadvisor2026", 10);

  const user = await prisma.user.create({
    data: {
      email: "logan@saleadvisor.com",
      password: hashedPassword,
      name: "Logan Bronstein",
      role: "admin",
    },
  });

  return NextResponse.json({
    message: "Admin user created",
    email: user.email,
  });
}
