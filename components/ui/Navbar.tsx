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
    <nav className="w-full border-b px-8 py-4 flex items-center justify-between sticky top-0 bg-[#0F2A44] z-40">
      <div className="flex items-center gap-6">
        <Link href={isHR ? "/hr/dashboard" : "/dashboard"}>
          <Image src="/logo.svg" alt="Hire-Archy" width={60} height={60} />
        </Link>

        {isHR && (
          <>
            <Link
              href="/hr/dashboard"
              className="text-base text-[#E6EDF3] hover:text-[#3B82F6]"
            >
              Dashboard
            </Link>
            <Link
              href="/hr/employees"
              className="text-base text-[#E6EDF3] hover:text-[#3B82F6]"
            >
              Employees
            </Link>
            <Link
              href="/organogram"
              className="text-base text-[#E6EDF3] hover:text-[#3B82F6]"
            >
              Organogram
            </Link>
            <Link
              href="/leave"
              className="text-base text-[#E6EDF3] hover:text-[#3B82F6]"
            >
              Leave
            </Link>
            <Link
              href="/manager/leave"
              className="text-base text-[#E6EDF3] hover:text-[#3B82F6]"
            >
              Team Leave
            </Link>
          </>
        )}

        {isManager && (
          <>
            <Link
              href="/dashboard"
              className="text-base text-[#E6EDF3] hover:text-[#3B82F6]"
            >
              Dashboard
            </Link>
            <Link
              href="/organogram"
              className="text-base text-[#E6EDF3] hover:text-[#3B82F6]"
            >
              Organogram
            </Link>
            <Link
              href="/leave"
              className="text-base text-[#E6EDF3] hover:text-[#3B82F6]"
            >
              Leave
            </Link>
            <Link
              href="/manager/leave"
              className="text-base text-[#E6EDF3] hover:text-[#3B82F6]"
            >
              Team Leave
            </Link>
          </>
        )}

        {!isHR && !isManager && (
          <>
            <Link
              href="/dashboard"
              className="text-base text-[#E6EDF3] hover:text-[#3B82F6]"
            >
              Dashboard
            </Link>
            <Link
              href="/organogram"
              className="text-base text-[#E6EDF3] hover:text-[#3B82F6]"
            >
              Organogram
            </Link>
            <Link
              href="/leave"
              className="text-base text-[#E6EDF3] hover:text-[#3B82F6]"
            >
              Leave
            </Link>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-[#E6EDF3]">{session?.user?.email}</span>
        <LogoutButton />
      </div>
    </nav>
  );
}
