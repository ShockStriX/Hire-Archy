"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

function ChangePasswordContent() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const normalizedEmail = email?.toLowerCase().trim();
  const { update, data: sessionData } = useSession();

  const handleSubmit = async () => {
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setLoading(false);
      } else {
        await update({ firstLogin: false });
        await new Promise((resolve) => setTimeout(resolve, 500));

        const statusRes = await fetch("/api/2fa/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normalizedEmail }),
        });
        const statusData = await statusRes.json();

        if (statusData.twoFactorEnabled) {
          const role = sessionData?.user?.role;
          window.location.href = role === "HR" ? "/hr/dashboard" : "/dashboard";
        } else {
          window.location.href = `/2fa-setup?email=${encodeURIComponent(normalizedEmail!)}`;
        }
      }
    } catch (err) {
      console.error("Fetch failed with error:", err);
      setError("Network error - please try again");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-xl shadow-md bg-white">
        <h1 className="text-2xl font-bold mb-2">Change Password</h1>
        <p className="text-gray-500 mb-6">
          Please set a new password before continuing.
        </p>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border rounded-lg p-2 w-full"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="border rounded-lg p-2 w-full"
          />

          <ul className="text-xs text-gray-500 list-disc list-inside">
            <li>At least 8 characters</li>
            <li>At least one capital letter</li>
            <li>At least one lowercase letter</li>
            <li>At least one special character</li>
            <li>Cannot contain your email username</li>
          </ul>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white rounded-lg p-2 w-full disabled:opacity-50"
          >
            {loading ? "Updating..." : "Set New Password"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <ChangePasswordContent />
    </Suspense>
  );
}
