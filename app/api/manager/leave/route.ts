import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session || (session.user.role !== "MANAGER" && session.user.role !== "HR")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const normalizedEmail = session.user.email.toLowerCase().trim()

    // Find the manager's employee record
    const manager = await prisma.employee.findFirst({
      where: { user: { email: normalizedEmail } }
    })

    if (!manager) {
      return NextResponse.json({ error: "Manager not found" }, { status: 404 })
    }

    // Get all subordinate IDs recursively
    const getSubordinateIds = async (managerId: string): Promise<string[]> => {
      const direct = await prisma.employee.findMany({
        where: { managerId },
        select: { id: true }
      })
      const directIds = direct.map((e) => e.id)
      const indirectIds = await Promise.all(
        directIds.map((id) => getSubordinateIds(id))
      )
      return [...directIds, ...indirectIds.flat()]
    }

    const subordinateIds = session.user.role === "HR"
      ? (await prisma.employee.findMany({ select: { id: true } })).map((e) => e.id)
      : await getSubordinateIds(manager.id)

    const requests = await prisma.leaveRequest.findMany({
      where: { employeeId: { in: subordinateIds } },
      include: {
        employee: {
          select: {
            name: true,
            surname: true,
            position: true,
            employeeNumber: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Fetch team leave error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}