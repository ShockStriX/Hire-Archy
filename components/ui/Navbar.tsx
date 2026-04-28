"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import LogoutButton from "@/components/ui/LogoutButton";
import Image from "next/image";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isHR = session?.user?.role === "HR";
  const isManager = session?.user?.role === "MANAGER";

  const hideNavbar =
    pathname.startsWith("/login") ||
    pathname.startsWith("/2fa-setup") ||
    pathname.startsWith("/verify-2fa") ||
    pathname.startsWith("/change-password");

  if (hideNavbar) return null;

  return (
    <nav className="w-full border-b px-8 py-4 flex items-center justify-between sticky top-0 bg-white z-40">
      <div className="flex items-center gap-6">
        <Link href={isHR ? "/hr/dashboard" : "/dashboard"}>
          <Image src="/logo.svg" alt="Hire-Archy" width={40} height={40} />
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
            <Link
              href="/organogram"
              className="text-sm text-gray-600 hover:text-black"
            >
              Organogram
            </Link>
          </>
        )}

        {isManager && (
          <>
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-black"
            >
              Dashboard
            </Link>
            <Link
              href="/organogram"
              className="text-sm text-gray-600 hover:text-black"
            >
              Organogram
            </Link>
          </>
        )}

        {!isHR && !isManager && (
          <>
            <Link
              href="/dashboard"
              className="text-sm text-gray-600 hover:text-black"
            >
              Dashboard
            </Link>
            <Link
              href="/organogram"
              className="text-sm text-gray-600 hover:text-black"
            >
              Organogram
            </Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{session?.user?.email}</span>
        <LogoutButton />
      </div>
    </nav>
  );
}
