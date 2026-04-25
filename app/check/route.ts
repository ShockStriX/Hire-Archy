import { NextResponse } from "next/server";
import { verify } from "otplib";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, token } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.twoFactorSecret) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const result = await verify({ secret: user.twoFactorSecret, token });

  if (!result.valid) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
