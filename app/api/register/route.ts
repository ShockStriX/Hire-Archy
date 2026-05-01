import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { 
      email: normalizedEmail, 
      password: hashedPassword,
      role: "EMPLOYEE",
      firstLogin: true,
    },
  })

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    redirectTo: `/2fa-setup?email=${encodeURIComponent(user.email)}`,
  })
}