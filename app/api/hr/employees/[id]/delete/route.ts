import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function DELETE(
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
      include: {
        subordinates: true,
      }
    })

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }


    // Delete employee first, then user (cascade will handle it)
    await prisma.$transaction(async (tx) => {
      await tx.employee.delete({ where: { id } })
      await tx.user.delete({ where: { id: employee.userId } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete employee error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}