import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const twoFactorVerified = req.auth?.user?.twoFactorVerified;
  const twoFactorEnabled = req.auth?.user?.twoFactorEnabled;
  const firstLogin = req.auth?.user?.firstLogin;
  const role = req.auth?.user?.role;
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname.startsWith("/login");

  const isOnboardingPage =
    pathname.startsWith("/change-password") ||
    pathname.startsWith("/2fa-setup") ||
    pathname.startsWith("/verify-2fa");

  // Not logged in, redirect to login
  if (!isLoggedIn && !isAuthPage && !isOnboardingPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && !isAuthPage && !isOnboardingPage) {
    // First login - force password change FIRST
    if (firstLogin) {
      return NextResponse.redirect(
        new URL(
          `/change-password?email=${req.auth?.user?.email?.toLowerCase().trim()}`,
          req.nextUrl,
        ),
      );
    }
    // Only after password is changed, check 2FA
    if (!twoFactorEnabled) {
      return NextResponse.redirect(
        new URL(
          `/2fa-setup?email=${req.auth?.user?.email?.toLowerCase().trim()}`,
          req.nextUrl,
        ),
      );
    }
    if (twoFactorEnabled && !twoFactorVerified) {
      return NextResponse.redirect(
        new URL(
          `/verify-2fa?email=${req.auth?.user?.email?.toLowerCase().trim()}`,
          req.nextUrl,
        ),
      );
    }
    // Block non-HR users from HR pages, but allow managers to view employee profiles
    if (pathname.startsWith("/hr") && role !== "HR") {
      if (role === "MANAGER" && pathname.startsWith("/hr/employees/")) {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  // Block employees from manager leave page
  if (pathname.startsWith("/manager") && role === "EMPLOYEE") {
    return NextResponse.redirect(new URL("/leave", req.nextUrl));
  }

  // Logged in and fully verified, redirect away from login
  if (isLoggedIn && isAuthPage && twoFactorVerified) {
    if (role === "HR") {
      return NextResponse.redirect(new URL("/hr/dashboard", req.nextUrl));
    }
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.ico).*)",
  ],
};
