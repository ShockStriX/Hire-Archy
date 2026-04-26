"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Employee {
  id: string
  name: string
  surname: string
  position: string
  employeeNumber: string
}

interface CreatedEmployee {
  employeeNumber: string
  initialPassword: string
  email: string
}

export default function NewEmployeePage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [surname, setSurname] = useState("")
  const [birthDate, setBirthDate] = useState("")
  const [grossSalary, setGrossSalary] = useState("")
  const [position, setPosition] = useState("")
  const [managerId, setManagerId] = useState("")
  const [managers, setManagers] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [created, setCreated] = useState<CreatedEmployee | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Fetch existing employees for manager dropdown
    const fetchEmployees = async () => {
      const res = await fetch("/api/hr/employees")
      const data = await res.json()
      setManagers(data.employees || [])
    }
    fetchEmployees()
  }, [])

  const handleSubmit = async () => {
    setError("")
    setLoading(true)

    const res = await fetch("/api/hr/employees/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
        surname,
        birthDate,
        gross_salary: grossSalary,
        position,
        managerId: managerId || null,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || "Something went wrong")
      setLoading(false)
    } else {
      setCreated(data)
      setLoading(false)
    }
  }

  if (created) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md p-8 rounded-xl shadow-md">
          <h1 className="text-2xl font-bold mb-2 text-green-600">Employee Created!</h1>
          <p className="text-gray-500 mb-6">
            Please share the following credentials with the employee securely.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 flex flex-col gap-2">
            <div>
              <p className="text-xs text-gray-500">Employee Number</p>
              <p className="font-bold">{created.employeeNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-bold">{created.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Temporary Password</p>
              <p className="font-bold font-mono">{created.initialPassword}</p>
            </div>
          </div>

          <p className="text-xs text-red-500 mb-6">
            ⚠️ Make sure to copy this password now. It will not be shown again.
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => navigator.clipboard.writeText(
                `Employee Number: ${created.employeeNumber}\nEmail: ${created.email}\nTemporary Password: ${created.initialPassword}`
              )}
              className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2 text-sm w-full"
            >
              Copy Credentials
            </button>
            <button
              onClick={() => router.push("/hr/employees")}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm w-full"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold mb-6">Create New Employee</h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border rounded-lg p-2 w-full"
          />
          <input
            type="text"
            placeholder="First Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded-lg p-2 w-full"
          />
          <input
            type="text"
            placeholder="Last Name"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            className="border rounded-lg p-2 w-full"
          />
          <input
            type="date"
            placeholder="Birth Date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="border rounded-lg p-2 w-full"
          />
          <input
            type="number"
            placeholder="Gross Salary"
            value={grossSalary}
            onChange={(e) => setGrossSalary(e.target.value)}
            className="border rounded-lg p-2 w-full"
          />
          <input
            type="text"
            placeholder="Position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="border rounded-lg p-2 w-full"
          />
          <select
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            className="border rounded-lg p-2 w-full"
          >
            <option value="">No Manager (e.g. CEO)</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name} {manager.surname} - {manager.position} ({manager.employeeNumber})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white rounded-lg p-2 w-full disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Employee"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/hr/employees")}
            className="bg-gray-200 text-gray-800 rounded-lg p-2 w-full"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}