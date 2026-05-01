import { NextResponse } from "next/server";
import speakeasy from "speakeasy";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, token } = await req.json();
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.twoFactorSecret) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const verified = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: "base32",
    token,
    window: 1,
  });

  if (!verified) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { twoFactorEnabled: true },
  });

  return NextResponse.json({ success: true });
}
