import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { calculateWorkingDays, calculateProjectedBalance } from "@/lib/leave"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { leaveType, startDate, endDate, reason } = await req.json()

    if (!leaveType || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (start > end) {
      return NextResponse.json({ error: "Start date must be before end date" }, { status: 400 })
    }

    const normalizedEmail = session.user.email.toLowerCase().trim()

    const employee = await prisma.employee.findFirst({
      where: { user: { email: normalizedEmail } },
      include: { leaveBalance: true }
    })

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    const days = await calculateWorkingDays(start, end)

    if (days === 0) {
      return NextResponse.json({ error: "No working days in selected period" }, { status: 400 })
    }

    if (leaveType === "ANNUAL") {
      const projectedBalance = calculateProjectedBalance(
        Number(employee.leaveBalance?.annualBalance || 0),
        employee.leaveBalance?.lastAccrualDate || new Date(),
        start
      )
      if (projectedBalance < days) {
        return NextResponse.json({
          error: `Insufficient annual leave. You will have ${projectedBalance.toFixed(1)} days available on ${start.toLocaleDateString()}`
        }, { status: 400 })
      }
    }

    if (leaveType === "SICK") {
      const sickBalance = Number(employee.leaveBalance?.sickBalance || 0)
      if (sickBalance < days) {
        return NextResponse.json({
          error: `Insufficient sick leave. You have ${sickBalance} days remaining`
        }, { status: 400 })
      }
    }

    const overlapping = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: employee.id,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [{ startDate: { lte: end }, endDate: { gte: start } }]
      }
    })

    if (overlapping) {
      return NextResponse.json({
        error: "You already have a leave request for this period"
      }, { status: 400 })
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        employeeId: employee.id,
        leaveType,
        startDate: start,
        endDate: end,
        days,
        reason: reason || null,
        status: "PENDING",
      }
    })

    return NextResponse.json({ success: true, leaveRequest })
  } catch (error) {
    console.error("Create leave request error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const normalizedEmail = session.user.email.toLowerCase().trim()

    const employee = await prisma.employee.findFirst({
      where: { user: { email: normalizedEmail } }
    })

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    const requests = await prisma.leaveRequest.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Fetch leave requests error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}