import "next-auth"

declare module "next-auth" {
  interface User {
    twoFactorEnabled?: boolean
    twoFactorVerified?: boolean
    role?: string
    firstLogin?: boolean
  }

  interface Session {
    user: {
      email: string
      twoFactorEnabled?: boolean
      twoFactorVerified?: boolean
      role?: string
      firstLogin?: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    twoFactorEnabled?: boolean
    twoFactorVerified?: boolean
    role?: string
    firstLogin?: boolean
  }
}