import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const email = formData.get("email") as string;
    const normalizedEmail = email.toLowerCase().trim()


    if (!file || !email) {
      return NextResponse.json(
        { error: "Missing file or email" },
        { status: 400 },
      );
    }

    const timestamp = Date.now();
    const blob = await put(`banners/${email}-${timestamp}`, file, {
      access: "public",
      allowOverwrite: true,
    });

    await prisma.user.update({
      where: { email: normalizedEmail },
      data: { bannerUrl: blob.url },
    });

    revalidatePath("user-data");

    return NextResponse.json({ bannerUrl: blob.url });
  } catch (error) {
    console.error("Banner upload error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
