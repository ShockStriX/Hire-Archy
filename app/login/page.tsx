"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

const handleSubmit = async (e?: React.FormEvent) => {
  e?.preventDefault()
  setError("")

  const result = await signIn("credentials", {
    email,
    password,
    redirect: false,
  })

  if (result?.error) {
    setError("Invalid email or password")
  } else {
    // Redirect to 2FA verification instead of dashboard
    router.push(`/verify-2fa?email=${encodeURIComponent(email)}`)
  }
}

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6">Login</h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-lg p-2 w-full"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border rounded-lg p-2 w-full"
          />
          <button type="submit" className="bg-blue-600 text-white rounded-lg p-2 w-full">
            Sign In
          </button>
        </form>

        {/* ADD THIS BELOW THE FORM */}
        <p className="mt-4 text-center text-sm">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-600 hover:underline">
            Register
          </a>
        </p>

      </div>
    </div>
  )
}