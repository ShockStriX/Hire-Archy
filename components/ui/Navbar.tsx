"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/ui/LogoutButton";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isHR = session?.user?.role === "HR";

  const hideNavbar =
    pathname.startsWith("/login") ||
    pathname.startsWith("/2fa-setup") ||
    pathname.startsWith("/verify-2fa") ||
    pathname.startsWith("/change-password");

  if (hideNavbar) return null;

  return (
    <nav className="w-full border-b px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link
          href={isHR ? "/hr/dashboard" : "/dashboard"}
          className="font-bold text-lg"
        >
          Hire-Archy
        </Link>

        {isHR && (
          <>
            <Link
              href="/hr/dashboard"
              className="text-sm text-gray-600 hover:text-black"
            >
              Dashboard
            </Link>
            <Link
              href="/hr/employees"
              className="text-sm text-gray-600 hover:text-black"
            >
              Employees
            </Link>
          </>
        )}

        {!isHR && (
          <Link
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-black"
          >
            Dashboard
          </Link>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{session?.user?.email}</span>
        <LogoutButton />
      </div>
    </nav>
  );
}
