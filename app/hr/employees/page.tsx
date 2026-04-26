import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"

export default async function HREmployeesPage() {
  const session = await auth()

  if (!session || session.user.role !== "HR") {
    redirect("/dashboard")
  }

  const employees = await prisma.employee.findMany({
    include: {
      user: {
        select: {
          email: true,
          role: true,
        }
      },
      manager: {
        select: {
          name: true,
          surname: true,
          employeeNumber: true,
        }
      }
    },
    orderBy: { employeeNumber: "asc" }
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Link
          href="/hr/employees/new"
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm"
        >
          + New Employee
        </Link>
      </div>

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Employee #</th>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Position</th>
              <th className="text-left p-4">Email</th>
              <th className="text-left p-4">Manager</th>
              <th className="text-left p-4">Role</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="border-t hover:bg-gray-50">
                <td className="p-4">{emp.employeeNumber}</td>
                <td className="p-4">{emp.name} {emp.surname}</td>
                <td className="p-4">{emp.position}</td>
                <td className="p-4">{emp.user.email}</td>
                <td className="p-4">
                  {emp.manager
                    ? `${emp.manager.name} ${emp.manager.surname} (${emp.manager.employeeNumber})`
                    : "—"}
                </td>
                <td className="p-4">{emp.user.role}</td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No employees found. Create your first employee!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}