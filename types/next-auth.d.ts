import "next-auth"

declare module "next-auth" {
  interface User {
    twoFactorEnabled?: boolean
    twoFactorVerified?: boolean
  }

  interface Session {
    user: {
      email: string
      twoFactorEnabled?: boolean
      twoFactorVerified?: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    twoFactorEnabled?: boolean
    twoFactorVerified?: boolean
  }
}