import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { calculateProjectedBalance } from "@/lib/leave"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const employee = await prisma.employee.findFirst({
      where: { user: { email: session.user.email } },
      include: { leaveBalance: true }
    })

    if (!employee || !employee.leaveBalance) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    return NextResponse.json({
      annualBalance: Number(employee.leaveBalance.annualBalance),
      sickBalance: Number(employee.leaveBalance.sickBalance),
      lastAccrualDate: employee.leaveBalance.lastAccrualDate,
    })
  } catch (error) {
    console.error("Fetch leave balance error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}