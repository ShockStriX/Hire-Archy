"use client";

import { useState } from "react";
import Image from "next/image";
import crypto from "crypto";
import { getGradientFromEmail } from "@/lib/gradient";

function getGravatarUrl(email: string, size: number = 200) {
  const hash = crypto
    .createHash("md5")
    .update(email.trim().toLowerCase())
    .digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

interface UserCardProps {
  email: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  role?: string | null;
  position?: string | null;
  name?: string | null;
  surname?: string | null;
}

export default function UserCard({
  email,
  avatarUrl,
  bannerUrl,
  role,
  position,
  name,
  surname,
}: UserCardProps) {
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(
    avatarUrl || getGravatarUrl(email),
  );
  const [currentBannerUrl, setCurrentBannerUrl] = useState(bannerUrl || "");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarLoading(true);
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
      setError(data.error || "Avatar upload failed");
    } else {
      setCurrentAvatarUrl(`${data.avatarUrl}?t=${Date.now()}`);
    }
    setAvatarLoading(false);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBannerLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("email", email);

    const res = await fetch("/api/banner/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Banner upload failed");
    } else {
      setCurrentBannerUrl(`${data.bannerUrl}?t=${Date.now()}`);
    }
    setBannerLoading(false);
  };

  return (
    <div className="w-full max-w-md rounded-xl overflow-hidden shadow-lg border bg-white">
      {/* Banner */}
      <div
        className="relative w-full h-32"
        style={{
          background: currentBannerUrl
            ? undefined
            : getGradientFromEmail(email),
        }}
      >
        {currentBannerUrl && (
          <Image
            src={currentBannerUrl}
            alt="Banner"
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        )}

        {/* Banner upload button */}
        <label className="absolute top-2 right-2 cursor-pointer bg-black/40 hover:bg-black/60 text-white text-xs rounded-lg px-2 py-1">
          {bannerLoading ? "Uploading..." : "Change Banner"}
          <input
            type="file"
            accept="image/*"
            onChange={handleBannerUpload}
            className="hidden"
            disabled={bannerLoading}
          />
        </label>
      </div>

      {/* Avatar overlapping banner */}
      <div className="px-6 pb-6">
        <div className="relative -mt-12 mb-4">
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow">
            <Image
              src={currentAvatarUrl}
              alt="Avatar"
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>

          {/* Avatar upload button */}
          <label className="absolute bottom-0 left-16 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-full w-7 h-7 flex items-center justify-center shadow">
            {avatarLoading ? "..." : "✏️"}
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              disabled={avatarLoading}
            />
          </label>
        </div>
        {name && surname && (
          <h2 className="text-lg font-bold">
            {name} {surname}
          </h2>
        )}
        <h2 className="text-lg font-bold">{email}</h2>
        {position && <p className="text-sm text-gray-600">{position}</p>}
        <p className="text-sm text-gray-500">
          {role === "HR"
            ? "HR Representative"
            : role === "MANAGER"
              ? "Manager"
              : "Employee"}
        </p>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
}
