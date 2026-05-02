"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface LeaveBalance {
  annualBalance: number
  sickBalance: number
  lastAccrualDate: string
}

interface LeaveRequest {
  id: string
  leaveType: "ANNUAL" | "SICK" | "UNPAID"
  startDate: string
  endDate: string
  days: number
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
  reason: string | null
  createdAt: string
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

export default function LeavePage() {
  const { data: session } = useSession()
  const [balance, setBalance] = useState<LeaveBalance | null>(null)
  const [requests, setRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Form state
  const [leaveType, setLeaveType] = useState<"ANNUAL" | "SICK" | "UNPAID">("ANNUAL")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")
  const [estimatedDays, setEstimatedDays] = useState<number | null>(null)
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [balanceRes, requestsRes] = await Promise.all([
      fetch("/api/leave/balance"),
      fetch("/api/leave/request"),
    ])

    const balanceData = await balanceRes.json()
    const requestsData = await requestsRes.json()

    setBalance(balanceData)
    setRequests(requestsData.requests || [])
    setLoading(false)
  }

  const calculateDays = async () => {
    if (!startDate || !endDate) return
    setCalculating(true)

    const res = await fetch("/api/leave/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate }),
    })

    const data = await res.json()
    setEstimatedDays(data.days)
    setCalculating(false)
  }

  const handleSubmit = async () => {
    setError("")
    setSubmitting(true)

    const res = await fetch("/api/leave/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leaveType, startDate, endDate, reason }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || "Something went wrong")
      setSubmitting(false)
    } else {
      setSuccess("Leave request submitted successfully!")
      setShowForm(false)
      setLeaveType("ANNUAL")
      setStartDate("")
      setEndDate("")
      setReason("")
      setEstimatedDays(null)
      await fetchData()
      setSubmitting(false)
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this leave request?")) return

    const res = await fetch(`/api/leave/cancel/${id}`, { method: "PATCH" })

    if (res.ok) {
      setSuccess("Leave request cancelled!")
      await fetchData()
    }
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">Loading...</div>
  )

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Leave</h1>
        <button
          onClick={() => { setShowForm(!showForm); setError(""); setSuccess("") }}
          className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm"
        >
          {showForm ? "Cancel" : "+ Apply for Leave"}
        </button>
      </div>

      {/* Leave Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Annual Leave</p>
          <p className="text-3xl font-bold text-blue-600">
            {Number(balance?.annualBalance || 0).toFixed(1)}
          </p>
          <p className="text-xs text-gray-400 mt-1">days available</p>
        </div>
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Sick Leave</p>
          <p className="text-3xl font-bold text-yellow-600">
            {Number(balance?.sickBalance || 0).toFixed(1)}
          </p>
          <p className="text-xs text-gray-400 mt-1">days available</p>
        </div>
        <div className="bg-white rounded-xl border p-6 shadow-sm">
          <p className="text-xs text-gray-500 mb-1">Unpaid Leave</p>
          <p className="text-3xl font-bold text-gray-600">∞</p>
          <p className="text-xs text-gray-400 mt-1">subject to approval</p>
        </div>
      </div>

      {/* Apply for Leave Form */}
      {showForm && (
        <div className="bg-white rounded-xl border p-6 shadow-sm mb-8">
          <h2 className="text-lg font-bold mb-4">Apply for Leave</h2>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Leave Type</p>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as "ANNUAL" | "SICK" | "UNPAID")}
                className="border rounded-lg p-2 w-full text-sm"
              >
                <option value="ANNUAL">Annual Leave</option>
                <option value="SICK">Sick Leave</option>
                <option value="UNPAID">Unpaid Leave</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Start Date</p>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setEstimatedDays(null)
                  }}
                  className="border rounded-lg p-2 w-full text-sm"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">End Date</p>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setEstimatedDays(null)
                  }}
                  className="border rounded-lg p-2 w-full text-sm"
                />
              </div>
            </div>

            {startDate && endDate && (
              <div className="flex items-center gap-3">
                <button
                  onClick={calculateDays}
                  disabled={calculating}
                  className="bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1.5 text-sm"
                >
                  {calculating ? "Calculating..." : "Calculate Working Days"}
                </button>
                {estimatedDays !== null && (
                  <p className="text-sm text-gray-600">
                    <span className="font-bold">{estimatedDays}</span> working day(s)
                  </p>
                )}
              </div>
            )}

            <div>
              <p className="text-xs text-gray-500 mb-1">Reason (optional)</p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="border rounded-lg p-2 w-full text-sm"
                rows={3}
                placeholder="Add a reason for your leave request..."
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || !startDate || !endDate}
              className="bg-blue-600 text-white rounded-lg p-2 w-full disabled:opacity-50 text-sm"
            >
              {submitting ? "Submitting..." : "Submit Leave Request"}
            </button>
          </div>
        </div>
      )}

      {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

      {/* Leave Requests */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-bold">My Leave Requests</h2>
        </div>
        {requests.length === 0 ? (
          <p className="p-6 text-center text-gray-500 text-sm">
            No leave requests yet
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Start Date</th>
                <th className="text-left p-4">End Date</th>
                <th className="text-left p-4">Days</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-t">
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${leaveTypeColors[req.leaveType]}`}>
                      {req.leaveType}
                    </span>
                  </td>
                  <td className="p-4">{new Date(req.startDate).toLocaleDateString()}</td>
                  <td className="p-4">{new Date(req.endDate).toLocaleDateString()}</td>
                  <td className="p-4">{Number(req.days)}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[req.status]}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-4">
                    {req.status === "PENDING" && (
                      <button
                        onClick={() => handleCancel(req.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Cancel
                      </button>
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