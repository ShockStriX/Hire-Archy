import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: { include: { user: true } } },
    });

    if (!leaveRequest) {
      return NextResponse.json(
        { error: "Leave request not found" },
        { status: 404 },
      );
    }

    // Only the employee who made the request can cancel it
    const normalizedEmail = session.user.email.toLowerCase().trim();
    if (leaveRequest.employee.user.email !== normalizedEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (leaveRequest.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending requests can be cancelled" },
        { status: 400 },
      );
    }

    await prisma.leaveRequest.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel leave error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
