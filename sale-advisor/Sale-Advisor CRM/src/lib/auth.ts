import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { Adapter } from "next-auth/adapters";
import { Resend } from "resend";
import { prisma } from "./prisma";

// ── Email allowlist (from env, fail closed) ─────────────────
function getAllowedEmails(): string[] {
  const raw = process.env.ALLOWED_EMAILS;
  if (!raw || raw.trim() === "") {
    console.error("[auth] ALLOWED_EMAILS env var is missing or empty — all sign-ins will be blocked");
    return [];
  }
  return raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

// ── Resend client (lazy init to avoid build-time crash) ─────
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error("[auth] RESEND_API_KEY env var is not set — cannot send magic link emails");
  }
  return new Resend(key);
}

function getEmailFrom(): string {
  return process.env.EMAIL_FROM || "Sale Advisor <noreply@saleadvisor.com>";
}

// ── Auth config ─────────────────────────────────────────────
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      // Dummy server string to prevent nodemailer from trying localhost:587.
      // Our custom sendVerificationRequest bypasses nodemailer entirely.
      server: "smtp://ignored:ignored@localhost:0",
      from: getEmailFrom(),
      sendVerificationRequest: async ({ identifier: email, url }) => {
        const from = getEmailFrom();
        console.log(`[auth] Sending magic link to ${email} via Resend`);

        const { data, error } = await getResend().emails.send({
          from,
          to: email,
          subject: "Sign in to Sale Advisor",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 0;">
              <h2 style="color: #1a1a2e; margin-bottom: 16px;">Sale Advisor</h2>
              <p style="color: #333; font-size: 15px; line-height: 1.5;">Click the button below to sign in to your dashboard:</p>
              <a href="${url}" style="display: inline-block; padding: 14px 28px; background: #6c63ff; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 20px 0;">Sign In to Sale Advisor</a>
              <p style="color: #999; font-size: 13px; margin-top: 24px;">This link expires in 24 hours. If you didn&rsquo;t request this, you can safely ignore this email.</p>
            </div>
          `,
        });

        if (error) {
          console.error("[auth] Resend API error:", JSON.stringify(error));
          throw new Error(`Failed to send magic link via Resend: ${error.message}`);
        }

        console.log(`[auth] Magic link email sent successfully (id: ${data?.id})`);
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login?verify=1",
  },
  callbacks: {
    async signIn({ user, profile }) {
      // Single allowlist for ALL providers (Google + Email magic link)
      const email = (user.email || profile?.email || "").toLowerCase().trim();
      if (!email) {
        console.warn("[auth] Blocked sign-in: no email provided");
        return false;
      }

      const allowed = getAllowedEmails();
      if (allowed.length === 0) {
        console.error("[auth] Allowlist is empty — blocking all sign-ins");
        return false;
      }
      if (!allowed.includes(email)) {
        console.warn(`[auth] Blocked sign-in attempt from: ${email}`);
        return false;
      }
      return true;
    },
    async jwt({ token, user }) {
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
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Auto-assign ADMIN to allowlisted users
      const allowed = getAllowedEmails();
      if (user.email && allowed.includes(user.email.toLowerCase())) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
        console.log(`[auth] Auto-assigned ADMIN role to ${user.email}`);
      }
    },
  },
};
