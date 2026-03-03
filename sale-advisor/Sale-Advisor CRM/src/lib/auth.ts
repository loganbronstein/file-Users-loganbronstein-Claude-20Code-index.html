import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import { prisma } from "./prisma";

// ── Email allowlist ─────────────────────────────────────────
const ALLOWED_EMAILS = [
  "loganbronstein@saleadvisor.com",
  "kellerwestman@saleadvisor.com",
];

// ── Auth config ─────────────────────────────────────────────
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || "noreply@saleadvisor.com",
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
  },
  callbacks: {
    async signIn({ user }) {
      // ── Allowlist enforcement ─────────────────────────────
      if (!user.email || !ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
        return false; // blocks sign-in
      }
      return true;
    },
    async jwt({ token, user }) {
      // On first sign-in, pull role from DB
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { role: true },
        });
        token.role = dbUser?.role || "VIEWER";
      }
      return token;
    },
    async session({ session, token }) {
      // Expose role on session object
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Auto-assign ADMIN role to allowlisted users
      if (user.email && ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
      }
    },
  },
};
