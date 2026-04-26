import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET() {
  try {
    const session = await auth()

    if (!session || session.user.role !== "HR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: {
            email: true,
            role: true,
            avatarUrl: true,
          }
        },
        manager: {
          select: {
            name: true,
            surname: true,
            position: true,
            employeeNumber: true,
          }
        }
      },
      orderBy: {
        employeeNumber: "asc"
      }
    })

    return NextResponse.json({ employees })
  } catch (error) {
    console.error("Fetch employees error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}