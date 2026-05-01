import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: (credentials.email as string).toLowerCase().trim() },
          select: {
            id: true,
            email: true,
            password: true,
            twoFactorEnabled: true,
            role: true,
            firstLogin: true,
          },
        });

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          twoFactorEnabled: user.twoFactorEnabled,
          twoFactorVerified: false,
          role: user.role,
          firstLogin: user.firstLogin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.twoFactorEnabled = user.twoFactorEnabled;
        token.twoFactorVerified = false;
        token.role = user.role;
        token.firstLogin = user.firstLogin;
      }
      if (trigger === "update") {
        if (session?.twoFactorVerified) {
          token.twoFactorVerified = true;
        }
        if (session?.firstLogin === false) {
          token.firstLogin = false;
        }
        if (session?.twoFactorEnabled) {
          token.twoFactorEnabled = true;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.twoFactorEnabled = token.twoFactorEnabled as boolean;
      session.user.twoFactorVerified = token.twoFactorVerified as boolean;
      session.user.role = token.role as string;
      session.user.firstLogin = token.firstLogin as boolean;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
