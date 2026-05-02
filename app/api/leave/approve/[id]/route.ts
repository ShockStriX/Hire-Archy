import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (
      !session ||
      (session.user.role !== "MANAGER" && session.user.role !== "HR")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await req.json();

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: {
          include: { leaveBalance: true },
        },
      },
    });

    if (!leaveRequest) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 },
      );
    }

    if (status === "APPROVED") {
      // Check for overlapping approved requests
      const overlapping = await prisma.leaveRequest.findFirst({
        where: {
          employeeId: leaveRequest.employeeId,
          id: { not: id }, // Exclude current request
          status: "APPROVED",
          OR: [
            {
              startDate: { lte: leaveRequest.endDate },
              endDate: { gte: leaveRequest.startDate },
            },
          ],
        },
      });

      if (overlapping) {
        return NextResponse.json(
          {
            error: "Employee already has approved leave for this period",
          },
          { status: 400 },
        );
      }

      if (leaveRequest.leaveType === "ANNUAL") {
        await prisma.leaveBalance.update({
          where: { employeeId: leaveRequest.employeeId },
          data: { annualBalance: { decrement: leaveRequest.days } },
        });
      }
      if (leaveRequest.leaveType === "SICK") {
        await prisma.leaveBalance.update({
          where: { employeeId: leaveRequest.employeeId },
          data: { sickBalance: { decrement: leaveRequest.days } },
        });
      }
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, leaveRequest: updated });
  } catch (error) {
    console.error("Approve leave error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
