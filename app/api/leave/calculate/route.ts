import { NextResponse } from "next/server"
import { calculateWorkingDays } from "@/lib/leave"

export async function POST(req: Request) {
  try {
    const { startDate, endDate } = await req.json()

    if (!startDate || !endDate) {
      return NextResponse.json({ error: "Missing dates" }, { status: 400 })
    }

    const days = await calculateWorkingDays(new Date(startDate), new Date(endDate))

    return NextResponse.json({ days })
  } catch (error) {
    console.error("Calculate days error:", error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}