"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import QRCode from "qrcode"

function TwoFactorSetupContent() {
  const [qrCode, setQrCode] = useState("")
  const [token, setToken] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")

  useEffect(() => {
    if (!email) return

    const setupTwoFactor = async () => {
      const res = await fetch("/api/2fa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()
      const qrDataUrl = await QRCode.toDataURL(data.otpAuthUrl)
      setQrCode(qrDataUrl)
    }

    setupTwoFactor()
  }, [email])

  const handleVerify = async () => {
    setError("")
    setLoading(true)

    const res = await fetch("/api/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || "Invalid code")
      setLoading(false)
    } else {
      router.push("/login")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-xl shadow-md text-center">
        <h1 className="text-2xl font-bold mb-2">Set Up Two-Factor Authentication</h1>
        <p className="text-gray-500 mb-6">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
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
      </div>
    </div>
  )
}

export default function TwoFactorSetupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <TwoFactorSetupContent />
    </Suspense>
  )
}

//why is this not working?