import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"
import { generateInitialPassword } from "@/lib/validation"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session || session.user.role !== "HR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: { user: true }
    })

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    const newPassword = generateInitialPassword()
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: employee.userId },
      data: {
        password: hashedPassword,
        firstLogin: true,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      }
    })

    return NextResponse.json({ success: true, newPassword })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}