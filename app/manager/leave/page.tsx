"use client"

import { useState, useEffect } from "react"

interface LeaveRequest {
  id: string
  leaveType: "ANNUAL" | "SICK" | "UNPAID"
  startDate: string
  endDate: string
  days: number
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
  reason: string | null
  employee: {
    name: string
    surname: string
    position: string
    employeeNumber: string
  }
}

const leaveTypeColors = {
  ANNUAL: "bg-blue-100 text-blue-700",
  SICK: "bg-yellow-100 text-yellow-700",
  UNPAID: "bg-gray-100 text-gray-700",
}

const statusColors = {
  PENDING: "bg-orange-100 text-orange-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-700",
}

export default function ManagerLeavePage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    const res = await fetch("/api/manager/leave")
    const data = await res.json()
    setRequests(data.requests || [])
    setLoading(false)
  }

  const handleAction = async (id: string, status: "APPROVED" | "REJECTED") => {
    setError("")
    setSuccess("")

    const res = await fetch(`/api/leave/approve/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || "Something went wrong")
    } else {
      setSuccess(`Leave request ${status.toLowerCase()}!`)
      await fetchRequests()
    }
  }

  const filtered = requests.filter((r) =>
    filter === "ALL" ? true : r.status === filter
  )

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">Loading...</div>
  )

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">Team Leave Requests</h1>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {["PENDING", "APPROVED", "REJECTED", "ALL"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as typeof filter)}
            className={`px-4 py-1.5 rounded-lg text-sm ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-6 text-center text-gray-500 text-sm">
            No {filter.toLowerCase()} leave requests
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">Employee</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Start</th>
                <th className="text-left p-4">End</th>
                <th className="text-left p-4">Days</th>
                <th className="text-left p-4">Reason</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((req) => (
                <tr key={req.id} className="border-t">
                  <td className="p-4">
                    <p className="font-medium">{req.employee.name} {req.employee.surname}</p>
                    <p className="text-xs text-gray-500">{req.employee.position}</p>
                  </td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${leaveTypeColors[req.leaveType]}`}>
                      {req.leaveType}
                    </span>
                  </td>
                  <td className="p-4">{new Date(req.startDate).toLocaleDateString()}</td>
                  <td className="p-4">{new Date(req.endDate).toLocaleDateString()}</td>
                  <td className="p-4">{Number(req.days)}</td>
                  <td className="p-4 max-w-32 truncate">{req.reason || "—"}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[req.status]}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {req.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(req.id, "APPROVED")}
                          className="text-xs bg-green-600 text-white rounded px-2 py-1 hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(req.id, "REJECTED")}
                          className="text-xs bg-red-600 text-white rounded px-2 py-1 hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}