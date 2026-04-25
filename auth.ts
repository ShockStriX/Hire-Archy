import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: { id: true, email: true, password: true, twoFactorEnabled: true }
        })

        if (!user) return null

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!passwordMatch) return null

        return { 
          id: user.id, 
          email: user.email,
          twoFactorEnabled: user.twoFactorEnabled,
          twoFactorVerified: false // Always false on initial login
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.twoFactorEnabled = user.twoFactorEnabled
        token.twoFactorVerified = false
      }
      // Allow updating twoFactorVerified via useSession update
      if (trigger === "update" && session?.twoFactorVerified) {
        token.twoFactorVerified = true
      }
      return token
    },
    async session({ session, token }) {
      session.user.twoFactorEnabled = token.twoFactorEnabled as boolean
      session.user.twoFactorVerified = token.twoFactorVerified as boolean
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
})