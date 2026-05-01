import { NextResponse } from "next/server";
import speakeasy from "speakeasy";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email } = await req.json();
  const normalizedEmail = email.toLowerCase().trim();

  const secret = speakeasy.generateSecret({
    name: `Hire-Archy (${normalizedEmail})`,
  });

  await prisma.user.update({
    where: { email: normalizedEmail },
    data: { twoFactorSecret: secret.base32 },
  });

  return NextResponse.json({
    secret: secret.base32,
    otpAuthUrl: secret.otpauth_url,
  });
}
