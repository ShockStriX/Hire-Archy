import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateEmployeeNumber } from "@/lib/employeeNumber";
import { generateInitialPassword, validateEmail } from "@/lib/validation";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || session.user.role !== "HR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      email,
      name,
      surname,
      birthDate,
      gross_salary,
      position,
      managerId,
      role,
    } = await req.json();

    if (
      !email ||
      !name ||
      !surname ||
      !birthDate ||
      !gross_salary ||
      !position
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailError = validateEmail(normalizedEmail);
    if (emailError) {
      return NextResponse.json({ error: emailError }, { status: 400 });
    }

    const assignedRole =
      role === "HR" ? "HR" : role === "MANAGER" ? "MANAGER" : "EMPLOYEE";

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 },
      );
    }

    const employeeNumber = await generateEmployeeNumber();
    const initialPassword = generateInitialPassword();
    const hashedPassword = await bcrypt.hash(initialPassword, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          role: assignedRole,
          firstLogin: true,
        },
      });

      const employee = await tx.employee.create({
        data: {
          employeeNumber,
          name,
          surname,
          birthDate: new Date(birthDate),
          gross_salary: parseFloat(gross_salary),
          position,
          managerId: managerId || null,
          userId: user.id,
        },
      });

      return { user, employee };
    });

    return NextResponse.json({
      success: true,
      employeeNumber: result.employee.employeeNumber,
      initialPassword,
      email: normalizedEmail,
      role: assignedRole,
    });
  } catch (error) {
    console.error("Create employee error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
