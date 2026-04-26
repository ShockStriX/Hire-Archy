"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import crypto from "crypto";
import { getGradientFromEmail } from "@/lib/gradient";

function getGravatarUrl(email: string, size: number = 200) {
  const hash = crypto
    .createHash("md5")
    .update(email.trim().toLowerCase())
    .digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=identicon`;
}

interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  surname: string;
  birthDate: string;
  gross_salary: number;
  position: string;
  isActive: boolean;
  managerId: string | null;
  manager: {
    id: string;
    name: string;
    surname: string;
    position: string;
    employeeNumber: string;
  } | null;
  subordinates: {
    id: string;
    name: string;
    surname: string;
    position: string;
    employeeNumber: string;
  }[];
  user: {
    email: string;
    role: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
  };
}

export default function EmployeeProfilePage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [managers, setManagers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetPassword, setResetPassword] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  // Edit form state
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [grossSalary, setGrossSalary] = useState("");
  const [position, setPosition] = useState("");
  const [managerId, setManagerId] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const fetchEmployee = async () => {
      const res = await fetch(`/api/hr/employees/${id}`);
      const data = await res.json();
      if (res.ok) {
        setEmployee(data.employee);
        setName(data.employee.name);
        setSurname(data.employee.surname);
        setBirthDate(
          new Date(data.employee.birthDate).toISOString().split("T")[0],
        );
        setGrossSalary(data.employee.gross_salary.toString());
        setPosition(data.employee.position);
        setManagerId(data.employee.managerId || "");
        setRole(data.employee.user.role);
      }
      setLoading(false);
    };

    const fetchManagers = async () => {
      const res = await fetch("/api/hr/employees");
      const data = await res.json();
      setManagers(data.employees?.filter((e: Employee) => e.id !== id) || []);
    };

    fetchEmployee();
    fetchManagers();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    const res = await fetch(`/api/hr/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        surname,
        birthDate,
        gross_salary: grossSalary,
        position,
        managerId: managerId || null,
        role,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
    } else {
      setSuccess("Employee updated successfully!");
      setEditing(false);
      const refreshRes = await fetch(`/api/hr/employees/${id}`);
      const refreshData = await refreshRes.json();
      setEmployee(refreshData.employee);
    }
    setSaving(false);
  };

  // ← handleResetPassword is now correctly outside handleSave
  const handleResetPassword = async () => {
    if (
      !confirm(`Are you sure you want to reset ${employee?.name}'s password?`)
    )
      return;

    setResetting(true);
    setError("");

    const res = await fetch(`/api/hr/employees/${id}/reset-password`, {
      method: "POST",
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Failed to reset password");
    } else {
      setResetPassword(data.newPassword);
    }
    setResetting(false);
  };

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to deactivate ${employee?.name} ${employee?.surname}?`,
      )
    )
      return;

    const res = await fetch(`/api/hr/employees/${id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.push("/hr/employees");
    } else {
      setError("Failed to deactivate employee");
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading...
      </div>
    );
  if (!employee)
    return (
      <div className="flex min-h-screen items-center justify-center">
        Employee not found
      </div>
    );

  const avatarUrl =
    employee.user.avatarUrl || getGravatarUrl(employee.user.email);
  const bannerUrl = employee.user.bannerUrl;

  return (
    <div className="max-w-3xl mx-auto p-8">
      {/* Banner & Avatar */}
      <div className="rounded-xl overflow-hidden shadow-lg border mb-8">
        <div
          className="relative w-full h-40"
          style={{
            background: bannerUrl
              ? undefined
              : getGradientFromEmail(employee.user.email),
          }}
        >
          {bannerUrl && (
            <Image
              src={bannerUrl}
              alt="Banner"
              fill
              sizes="100vw"
              className="object-cover"
            />
          )}
        </div>

        <div className="px-6 pb-6">
          <div className="relative -mt-12 mb-4 flex items-end justify-between">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow">
              <Image
                src={avatarUrl}
                alt="Avatar"
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
            <div className="flex gap-2 mb-2">
              {!editing ? (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleResetPassword}
                    disabled={resetting}
                    className="bg-yellow-500 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {resetting ? "Resetting..." : "Reset Password"}
                  </button>
                  {employee.isActive && (
                    <button
                      onClick={handleDelete}
                      className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm"
                    >
                      Deactivate
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {!employee.isActive && (
            <div className="bg-red-50 text-red-600 rounded-lg px-4 py-2 text-sm mb-4">
              This employee has been deactivated
            </div>
          )}

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Employee Number</p>
              <p className="font-medium">{employee.employeeNumber}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <p className="font-medium">{employee.user.email}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">First Name</p>
              {editing ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border rounded-lg p-2 w-full text-sm"
                />
              ) : (
                <p className="font-medium">{employee.name}</p>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Last Name</p>
              {editing ? (
                <input
                  type="text"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  className="border rounded-lg p-2 w-full text-sm"
                />
              ) : (
                <p className="font-medium">{employee.surname}</p>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Birth Date</p>
              {editing ? (
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="border rounded-lg p-2 w-full text-sm"
                />
              ) : (
                <p className="font-medium">
                  {new Date(employee.birthDate).toLocaleDateString()}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Position</p>
              {editing ? (
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="border rounded-lg p-2 w-full text-sm"
                />
              ) : (
                <p className="font-medium">{employee.position}</p>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Gross Salary</p>
              {editing ? (
                <input
                  type="number"
                  value={grossSalary}
                  onChange={(e) => setGrossSalary(e.target.value)}
                  className="border rounded-lg p-2 w-full text-sm"
                />
              ) : (
                <p className="font-medium">
                  R{Number(employee.gross_salary).toLocaleString()}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Role</p>
              {editing ? (
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="border rounded-lg p-2 w-full text-sm"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="HR">HR</option>
                </select>
              ) : (
                <p className="font-medium">{employee.user.role}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 mb-1">Reporting Manager</p>
              {editing ? (
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="border rounded-lg p-2 w-full text-sm"
                >
                  <option value="">No Manager (e.g. CEO)</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.surname} - {m.position} ({m.employeeNumber})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="font-medium">
                  {employee.manager
                    ? `${employee.manager.name} ${employee.manager.surname} - ${employee.manager.position} (${employee.manager.employeeNumber})`
                    : "—"}
                </p>
              )}
            </div>

            {employee.subordinates.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 mb-1">Direct Reports</p>
                <div className="flex flex-col gap-1">
                  {employee.subordinates.map((sub) => (
                    <p key={sub.id} className="font-medium text-sm">
                      {sub.name} {sub.surname} - {sub.position} (
                      {sub.employeeNumber})
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      {resetPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold mb-2">
              Password Reset Successfully
            </h2>
            <p className="text-gray-500 mb-6">
              Share these credentials with the employee securely. They will be
              prompted to change their password on next login.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 flex flex-col gap-2">
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="font-bold">{employee.user.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Temporary Password</p>
                <p className="font-bold font-mono">{resetPassword}</p>
              </div>
            </div>

            <p className="text-xs text-red-500 mb-6">
              ⚠️ Make sure to copy this password now. It will not be shown
              again.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    `Email: ${employee.user.email}\nTemporary Password: ${resetPassword}`,
                  )
                }
                className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2 text-sm w-full"
              >
                Copy Credentials
              </button>
              <button
                onClick={() => setResetPassword(null)}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm w-full"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
