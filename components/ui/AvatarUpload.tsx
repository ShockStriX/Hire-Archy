"use client";

import { useState } from "react";
import Image from "next/image";
import crypto from "crypto";

function getGravatarUrl(email: string, size: number = 200) {
  const hash = crypto
    .createHash("md5")
    .update(email.trim().toLowerCase())
    .digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

interface AvatarUploadProps {
  email: string;
  currentAvatarUrl?: string | null;
}

export default function AvatarUpload({
  email,
  currentAvatarUrl,
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState(
    currentAvatarUrl || getGravatarUrl(email),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("email", email);

    const res = await fetch("/api/avatar/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Upload failed");
      setLoading(false);
    } else {
      setAvatarUrl(data.avatarUrl);
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-24 h-24 rounded-full overflow-hidden border">
        <Image src={avatarUrl} alt="Avatar" fill className="object-cover" />
      </div>

      <label className="cursor-pointer bg-blue-600 text-white rounded-lg px-4 py-2 text-sm">
        {loading ? "Uploading..." : "Upload Avatar"}
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          disabled={loading}
        />
      </label>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}
