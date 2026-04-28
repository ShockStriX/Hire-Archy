import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

interface EmployeeNode {
  id: string;
  employeeNumber: string;
  name: string;
  surname: string;
  position: string;
  gross_salary?: number | { toNumber: () => number }; // Handle Prisma Decimal
  isActive: boolean;
  managerId: string | null;
  user: {
    email: string;
    role: string;
    avatarUrl: string | null;
  };
  subordinates?: EmployeeNode[];
}

// Recursively build tree from flat list
function buildTree(
  employees: EmployeeNode[],
  managerId: string | null,
): EmployeeNode[] {
  return employees
    .filter((e) => e.managerId === managerId && e.isActive)
    .map((e) => ({
      ...e,
      gross_salary: e.gross_salary
        ? typeof e.gross_salary === "object"
          ? (e.gross_salary as { toNumber: () => number }).toNumber()
          : e.gross_salary
        : undefined,
      subordinates: buildTree(employees, e.id),
    }));
}

// Get all subordinate IDs recursively
function getAllSubordinateIds(
  employees: EmployeeNode[],
  managerId: string,
): string[] {
  const direct = employees
    .filter((e) => e.managerId === managerId)
    .map((e) => e.id);
  const indirect = direct.flatMap((id) => getAllSubordinateIds(employees, id));
  return [...direct, ...indirect];
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;

    // Fetch all active employees
    const allEmployees = await prisma.employee.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });

    // HR sees everything
    if (role === "HR") {
      const tree = buildTree(allEmployees as unknown as EmployeeNode[], null);
      return NextResponse.json({ tree, role });
    }

    // Find current user's employee record
    const currentEmployee = await prisma.employee.findFirst({
      where: { user: { email: session.user.email } },
      include: {
        user: { select: { email: true, role: true, avatarUrl: true } },
        manager: {
          include: {
            user: { select: { email: true, role: true, avatarUrl: true } },
            manager: {
              include: {
                user: { select: { email: true, role: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    });

    if (!currentEmployee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 },
      );
    }

    // MANAGER sees their subtree + who they report to
    if (role === "MANAGER") {
      // In getAllSubordinateIds calls
      const subordinateIds = getAllSubordinateIds(
        allEmployees as unknown as EmployeeNode[],
        currentEmployee.id,
      );
      // In MANAGER section
      const relevantEmployees = allEmployees.filter(
        (e) => e.id === currentEmployee.id || subordinateIds.includes(e.id),
      );
      const tree = buildTree(
        relevantEmployees as unknown as EmployeeNode[],
        currentEmployee.managerId,
      );

      return NextResponse.json({
        tree,
        role,
        currentEmployeeId: currentEmployee.id,
        manager: currentEmployee.manager,
      });
    }

    // EMPLOYEE sees their node + manager above + colleagues at same level
    if (role === "EMPLOYEE") {
      const colleagues = currentEmployee.managerId
        ? allEmployees.filter(
            (e) =>
              e.managerId === currentEmployee.managerId &&
              e.id !== currentEmployee.id,
          )
        : [];

      return NextResponse.json({
        tree: null,
        role,
        currentEmployee,
        manager: currentEmployee.manager,
        colleagues,
      });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (error) {
    console.error("Organogram error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
