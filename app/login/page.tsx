"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { validateEmail } from "@/lib/validation";
const [loading, setLoading] = useState(false);
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }
    const normalizedEmail = email.toLowerCase().trim()


    const res = await fetch("/api/2fa/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail }),
    });

    const data = await res.json();


    if (!data.twoFactorEnabled) {
      router.push(`/2fa-setup?email=${encodeURIComponent(normalizedEmail)}`);
    } else {
      router.push(`/verify-2fa?email=${encodeURIComponent(normalizedEmail)}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center w-full max-w-md">
        {/* Logo above the card */}
        <div className="mb-6">
          <img src="/logo2.svg" alt="Hire-Archy" width={240} height={240} />
        </div>

        {/* Login card */}
        <div className="w-full p-8 rounded-xl shadow-md bg-white">
          <h1 className="text-2xl font-bold mb-6">Login</h1>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="border rounded-lg p-2 w-full"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="border rounded-lg p-2 w-full"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 text-white rounded-lg p-2 w-full disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm">
            Forgot your password or lost 2FA access? <br />
            Please contact your HR representative
          </p>
        </div>
      </div>
    </div>
  );
}
