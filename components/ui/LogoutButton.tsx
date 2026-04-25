"use client"

import { signOut } from "next-auth/react"

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-red-700"
    >
      Sign Out
    </button>
  )
}