"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import QRCode from "qrcode";
import { useSession, signOut } from "next-auth/react";

function TwoFactorSetupContent() {
  const [qrCode, setQrCode] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const normalizedEmail = email?.toLowerCase().trim();
  const { update } = useSession();

  useEffect(() => {
    if (!normalizedEmail) return;

    const setupTwoFactor = async () => {
      const res = await fetch("/api/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const data = await res.json();
      const qrDataUrl = await QRCode.toDataURL(data.otpAuthUrl);
      setQrCode(qrDataUrl);
    };

    setupTwoFactor();
  }, [normalizedEmail]);

  const handleVerify = async () => {
    setError("");
    setLoading(true);

    const res = await fetch("/api/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, token }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Invalid code");
      setLoading(false);
    } else {
      await update({ twoFactorVerified: true, twoFactorEnabled: true });

      //Additional delay for the variables to update
      await new Promise((resolve) => setTimeout(resolve, 1000));

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
        <h1 className="text-2xl font-bold mb-2">
          Set Up Two-Factor Authentication
        </h1>
        <p className="text-gray-500 mb-6">
          Scan this QR code with your authenticator app (Google Authenticator,
          Authy, etc.)
        </p>

        {qrCode && (
          <div className="flex justify-center mb-6">
            <Image src={qrCode} alt="QR Code" width={200} height={200} />
          </div>
        )}

        <p className="text-sm text-gray-500 mb-4">
          Then enter the 6-digit code from your app to confirm setup
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
          {loading ? "Verifying..." : "Confirm & Enable 2FA"}
        </button>

        {/* Sign out escape button */}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-gray-500 hover:underline mt-4 block mx-auto"
        >
          Cancel and go back to login
        </button>
      </div>
    </div>
  );
}

export default function TwoFactorSetupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <TwoFactorSetupContent />
    </Suspense>
  );
}
