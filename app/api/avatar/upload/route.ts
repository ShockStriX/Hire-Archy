import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const email = formData.get("email") as string;

    if (!file || !email) {
      return NextResponse.json(
        { error: "Missing file or email" },
        { status: 400 },
      );
    }

    // Add timestamp to filename to create unique URL each time
    const timestamp = Date.now();
    const blob = await put(`avatars/${email}-${timestamp}`, file, {
      access: "public",
      allowOverwrite: true,
    });

    await prisma.user.update({
      where: { email },
      data: { avatarUrl: blob.url },
    });

    revalidatePath("/dashboard");

    return NextResponse.json({ avatarUrl: blob.url });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
