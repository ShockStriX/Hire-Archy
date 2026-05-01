"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";

function VerifyTwoFactorContent() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const normalizedEmail = email?.toLowerCase().trim();
  const { update } = useSession();

  const handleVerify = async () => {
    setError("");
    setLoading(true);

    const res = await fetch("/api/2fa/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, token }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Invalid code");
      setLoading(false);
    } else {
      await update({ twoFactorVerified: true });
      // Redirect based on role
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();

      if (sessionData?.user?.role === "HR") {
        router.push("/hr/dashboard");
      } else {
        router.push("/dashboard");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-xl shadow-md text-center bg-white">
        <h1 className="text-2xl font-bold mb-2">Two-Factor Authentication</h1>
        <p className="text-gray-500 mb-6">
          Enter the 6-digit code from your authenticator app
        </p>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <input
          type="text"
          placeholder="Enter 6-digit code"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleVerify()}
          className="border rounded-lg p-2 w-full mb-4"
          maxLength={6}
        />

        <button
          type="button"
          onClick={handleVerify}
          disabled={loading}
          className="bg-blue-600 text-white rounded-lg p-2 w-full disabled:opacity-50"
        >
          {loading ? "Verifying..." : "Verify"}
        </button>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-gray-500 hover:underline mt-4"
        >
          Cancel
        </button>
      </div>
    </div>
  );
} // ← VerifyTwoFactorContent ends here

export default function VerifyTwoFactorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <VerifyTwoFactorContent />
    </Suspense>
  );
}
