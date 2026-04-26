import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const twoFactorVerified = req.auth?.user?.twoFactorVerified
  const twoFactorEnabled = req.auth?.user?.twoFactorEnabled
  const { pathname } = req.nextUrl

  const isAuthPage = pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/2fa-setup") ||
    pathname.startsWith("/verify-2fa")

  // Not logged in, redirect to login
  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  if (isLoggedIn && !isAuthPage) {
    // 2FA not set up at all, redirect to setup
    if (!twoFactorEnabled) {
      return NextResponse.redirect(
        new URL(`/2fa-setup?email=${req.auth?.user?.email}`, req.nextUrl)
      )
    }
    // 2FA set up but not verified, redirect to verify
    if (twoFactorEnabled && !twoFactorVerified) {
      return NextResponse.redirect(
        new URL(`/verify-2fa?email=${req.auth?.user?.email}`, req.nextUrl)
      )
    }
  }

  // Logged in and 2FA verified, redirect away from auth pages
  if (isLoggedIn && isAuthPage && twoFactorVerified) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}