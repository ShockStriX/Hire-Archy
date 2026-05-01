import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { validatePassword } from "@/lib/validation"

export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json()
    const normalizedEmail = email.toLowerCase().trim()


    if (!email || !newPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const passwordError = validatePassword(newPassword, email)
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { 
        password: hashedPassword,
        firstLogin: false,
        // Don't reset 2FA here anymore
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}