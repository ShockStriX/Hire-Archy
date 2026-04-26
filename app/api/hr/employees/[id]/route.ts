import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET single employee
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "HR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            avatarUrl: true,
            bannerUrl: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            surname: true,
            position: true,
            employeeNumber: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            name: true,
            surname: true,
            position: true,
            employeeNumber: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ employee });
  } catch (error) {
    console.error("Fetch employee error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH update employee
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "HR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const {
      name,
      surname,
      birthDate,
      gross_salary,
      position,
      managerId,
      role,
    } = await req.json();

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        name,
        surname,
        birthDate: new Date(birthDate),
        gross_salary: parseFloat(gross_salary),
        position,
        managerId: managerId || null,
      },
    });

    if (role) {
      await prisma.user.update({
        where: { id: employee.userId },
        data: { role },
      });
    }

    return NextResponse.json({ success: true, employee });
  } catch (error) {
    console.error("Update employee error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE soft delete employee
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "HR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete employee error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
