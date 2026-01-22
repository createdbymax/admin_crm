import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { prisma } from "@/lib/prisma";

const allowedDomain = "losthills.io";
const adminEmails = new Set(
  `${process.env.ADMIN_EMAILS ?? ""},${process.env.ADMIN_EMAIL ?? ""}`
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          hd: allowedDomain,
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ profile, user }) {
      const email = profile?.email ?? user?.email;
      if (!email) {
        return false;
      }
      const normalized = email.toLowerCase();
      if (!normalized.endsWith(`@${allowedDomain}`)) {
        return false;
      }
      if (adminEmails.has(normalized) && user?.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "ADMIN" },
        });
      }
      return true;
    },
    async jwt({ token, user }) {
      const userRole = (user as { role?: string | null } | undefined)?.role;
      if (user?.id) {
        token.id = user.id;
      }
      if (userRole) {
        token.role = userRole;
      } else if (!token.role && typeof token.email === "string") {
        const record = await prisma.user.findUnique({
          where: { email: token.email },
          select: { role: true },
        });
        token.role = record?.role ?? "MEMBER";
      }
      return token;
    },
    async session({ session, token, user }) {
      const userRole = (user as { role?: string | null } | undefined)?.role;
      if (session.user) {
        const tokenId =
          typeof token?.sub === "string"
            ? token.sub
            : typeof (token as { id?: unknown }).id === "string"
              ? (token as { id?: string }).id
              : undefined;
        session.user.id =
          tokenId ?? user?.id ?? session.user.id;
        session.user.role =
          typeof token?.role === "string"
            ? token.role
            : userRole ?? "MEMBER";
        session.user.isAdmin = session.user.role === "ADMIN";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
