import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import LogoutButton from "@/components/ui/LogoutButton"

export default async function HRDashboardPage() {
  const session = await auth()

  if (!session || session.user.role !== "HR") {
    redirect("/dashboard")
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">HR Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome, {session.user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/hr/employees" className="p-6 rounded-xl border shadow-sm hover:shadow-md transition">
          <h2 className="text-lg font-bold mb-1">Employees</h2>
          <p className="text-gray-500 text-sm">View and manage all employees</p>
        </Link>

        <Link href="/hr/employees/new" className="p-6 rounded-xl border shadow-sm hover:shadow-md transition">
          <h2 className="text-lg font-bold mb-1">Create Employee</h2>
          <p className="text-gray-500 text-sm">Add a new employee to the system</p>
        </Link>
      </div>
    </div>
  )
}