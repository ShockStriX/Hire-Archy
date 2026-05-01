import { prisma } from "@/lib/prisma"

export async function generateEmployeeNumber(): Promise<string> {
  // Get or create the sequence record
  let sequence = await prisma.employeeNumberSequence.findFirst()

  if (!sequence) {
    sequence = await prisma.employeeNumberSequence.create({
      data: { lastNumber: 0 }
    })
  }

  // Increment the sequence
  const updated = await prisma.employeeNumberSequence.update({
    where: { id: sequence.id },
    data: { lastNumber: sequence.lastNumber + 1 }
  })

  // Format as EMP001, EMP002 etc.
  return `EMP${String(updated.lastNumber).padStart(3, "0")}`
}