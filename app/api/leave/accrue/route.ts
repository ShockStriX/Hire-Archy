import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    // Verify this is called from a trusted source
    const authHeader = req.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()

    // Get all active employees with leave balances
    const employees = await prisma.employee.findMany({
      where: { isActive: true },
      include: { leaveBalance: true }
    })

    let accrued = 0

    for (const employee of employees) {
      if (!employee.leaveBalance) continue

      const lastAccrual = employee.leaveBalance.lastAccrualDate || employee.createdAt

      // Only accrue if we haven't accrued this month
      const lastAccrualMonth = lastAccrual.getMonth()
      const lastAccrualYear = lastAccrual.getFullYear()
      const currentMonth = today.getMonth()
      const currentYear = today.getFullYear()

      if (lastAccrualMonth === currentMonth && lastAccrualYear === currentYear) {
        continue // Already accrued this month
      }

      // Check if it's a new leave cycle (1 March) - reset sick leave
      const isNewCycle =
        currentMonth === 2 && // March
        (lastAccrualMonth !== 2 || lastAccrualYear < currentYear)

      await prisma.leaveBalance.update({
        where: { employeeId: employee.id },
        data: {
          annualBalance: { increment: 2 }, // 2 days per month
          sickBalance: isNewCycle ? 15 : undefined, // Reset sick leave on 1 March
          lastAccrualDate: today,
        }
      })

      accrued++
    }

    return NextResponse.json({ success: true, accrued })
  } catch (error) {
    console.error("Accrual error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}