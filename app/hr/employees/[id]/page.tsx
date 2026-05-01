"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import crypto from "crypto";
import { getGradientFromEmail } from "@/lib/gradient";
import { useSession } from "next-auth/react";

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
    role: "HR" | "MANAGER" | "EMPLOYEE";
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
  const { data: session } = useSession();
  const isHR = session?.user?.role === "HR";
  const isOwnProfile = session?.user?.email === employee?.user.email;

  const params = useParams();
  const id = params.id as string;

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [grossSalary, setGrossSalary] = useState("");
  const [position, setPosition] = useState("");
  const [managerId, setManagerId] = useState("");
  const [role, setRole] = useState<"HR" | "MANAGER" | "EMPLOYEE">("EMPLOYEE");
  const [email, setEmail] = useState("");

  const updateBirthDate = (day: string, month: string, year: string) => {
    if (!day || !month || !year) return;
    const date = new Date(
      `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
    );
    setBirthDate(date.toISOString().split("T")[0]);
  };

  const refreshEmployee = async () => {
    const res = await fetch(`/api/hr/employees/${id}`);
    const data = await res.json();
    if (res.ok) setEmployee(data.employee);
    return data.employee;
  };

  useEffect(() => {
    const fetchEmployee = async () => {
      const res = await fetch(`/api/hr/employees/${id}`);
      const data = await res.json();
      if (res.ok) {
        const emp: Employee = data.employee;
        setEmployee(emp);
        setName(emp.name);
        setSurname(emp.surname);
        const date = new Date(emp.birthDate);
        setBirthDay(String(date.getDate()));
        setBirthMonth(String(date.getMonth() + 1));
        setBirthYear(String(date.getFullYear()));
        setBirthDate(date.toISOString().split("T")[0]);
        setGrossSalary(emp.gross_salary.toString());
        setPosition(emp.position);
        setManagerId(emp.managerId || "");
        setRole(emp.user.role);
        setEmail(emp.user.email);
      }
      setLoading(false);
    };

    const fetchManagers = async () => {
      const endpoint = isHR ? "/api/hr/employees" : "/api/manager/employees";
      const res = await fetch(endpoint);
      const data = await res.json();
      setManagers(
        data.employees?.filter(
          (e: Employee) =>
            e.id !== id &&
            e.isActive &&
            (e.user.role === "MANAGER" || e.user.role === "HR"),
        ) || [],
      );
    };

    fetchEmployee();
    if (session) fetchManagers();
  }, [id, session]);

  const handleSave = async () => {
    if (!employee?.isActive) {
      setError("Cannot edit a deactivated employee.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    if (
      employee?.user.role === "MANAGER" &&
      role !== "MANAGER" &&
      employee?.subordinates.length > 0
    ) {
      setError(
        `Cannot change ${employee.name} ${employee.surname}'s role because they have ${employee.subordinates.length} direct report(s). Please reassign them first.`,
      );
      setSaving(false);
      return;
    }

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
        email,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
    } else {
      setSuccess("Employee updated successfully!");
      setEditing(false);
      await refreshEmployee();
    }

    setSaving(false);
  };

  const handleResetPassword = async () => {
    if (!employee?.isActive) {
      setError("Cannot reset password for a deactivated employee.");
      return;
    }

    if (!confirm(`Are you sure you want to reset ${employee.name}'s password?`))
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
    if (!employee) return;

    const action = employee.isActive ? "deactivate" : "reactivate";

    if (employee.isActive && employee.subordinates.length > 0) {
      setError(
        `Cannot deactivate ${employee.name} ${employee.surname} because they have ${employee.subordinates.length} direct report(s). Please reassign them first.`,
      );
      return;
    }

    if (
      !confirm(
        `Are you sure you want to ${action} ${employee.name} ${employee.surname}?`,
      )
    )
      return;

    setError("");
    setSuccess("");

    const res = await fetch(`/api/hr/employees/${id}`, { method: "DELETE" });

    if (res.ok) {
      const refreshed = await refreshEmployee();
      setSuccess(
        `Employee ${refreshed?.isActive ? "reactivated" : "deactivated"} successfully!`,
      );
      setEditing(false);
    } else {
      const data = await res.json();
      setError(data.error || `Failed to ${action} employee`);
    }
  };

  const handleCancelEdit = () => {
    if (!employee) return;
    setEditing(false);
    setName(employee.name);
    setSurname(employee.surname);
    setGrossSalary(employee.gross_salary.toString());
    setPosition(employee.position);
    setManagerId(employee.managerId || "");
    setRole(employee.user.role);
    setEmail(employee.user.email);
    const date = new Date(employee.birthDate);
    setBirthDay(String(date.getDate()));
    setBirthMonth(String(date.getMonth() + 1));
    setBirthYear(String(date.getFullYear()));
    setBirthDate(date.toISOString().split("T")[0]);
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
      <div className="rounded-xl overflow-hidden shadow-lg border mb-8 bg-white">
        {/* Banner */}
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
          {/* Avatar and buttons */}
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
                  {employee.isActive && !isOwnProfile && (
                    <>
                      <button
                        onClick={() => setEditing(true)}
                        className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm"
                      >
                        Edit
                      </button>
                      {isHR && (
                        <button
                          onClick={handleResetPassword}
                          disabled={resetting}
                          className="bg-yellow-500 text-white rounded-lg px-4 py-2 text-sm disabled:opacity-50"
                        >
                          {resetting ? "Resetting..." : "Reset Password"}
                        </button>
                      )}
                    </>
                  )}
                  {isHR && !isOwnProfile && (
                    <button
                      onClick={handleDelete}
                      className={`${employee.isActive ? "bg-red-600" : "bg-green-600"} text-white rounded-lg px-4 py-2 text-sm`}
                    >
                      {employee.isActive ? "Deactivate" : "Reactivate"}
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
                    onClick={() => {
                      handleCancelEdit();
                      setError("");
                    }}
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
              This employee has been deactivated. Editing and password reset are
              disabled.
            </div>
          )}

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Employee Number */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Employee Number</p>
              <p className="font-medium">{employee.employeeNumber}</p>
            </div>

            {/* Email - HR only editable */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Email</p>
              {editing && isHR ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border rounded-lg p-2 w-full text-sm"
                />
              ) : (
                <p className="font-medium">{employee.user.email}</p>
              )}
            </div>

            {/* First Name - HR only editable */}
            <div>
              <p className="text-xs text-gray-500 mb-1">First Name</p>
              {editing && isHR ? (
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

            {/* Last Name - HR only editable */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Last Name</p>
              {editing && isHR ? (
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

            {/* Birth Date - HR only editable */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Birth Date</p>
              {editing && isHR ? (
                <div className="flex gap-2">
                  <select
                    value={birthDay}
                    onChange={(e) => {
                      setBirthDay(e.target.value);
                      updateBirthDate(e.target.value, birthMonth, birthYear);
                    }}
                    className="border rounded-lg p-2 w-full text-sm"
                  >
                    <option value="">Day</option>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={String(d)}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    value={birthMonth}
                    onChange={(e) => {
                      setBirthMonth(e.target.value);
                      updateBirthDate(birthDay, e.target.value, birthYear);
                    }}
                    className="border rounded-lg p-2 w-full text-sm"
                  >
                    <option value="">Month</option>
                    {[
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                    ].map((m, i) => (
                      <option key={m} value={String(i + 1)}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    value={birthYear}
                    onChange={(e) => {
                      setBirthYear(e.target.value);
                      updateBirthDate(birthDay, birthMonth, e.target.value);
                    }}
                    className="border rounded-lg p-2 w-full text-sm"
                  >
                    <option value="">Year</option>
                    {Array.from(
                      { length: 80 },
                      (_, i) => new Date().getFullYear() - i,
                    ).map((y) => (
                      <option key={y} value={String(y)}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="font-medium">
                  {new Date(employee.birthDate).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Position - HR and Manager editable */}
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

            {/* Gross Salary - HR and Manager editable */}
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

            {/* Role - HR and Manager editable */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Role</p>
              {editing ? (
                <select
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as "HR" | "MANAGER" | "EMPLOYEE")
                  }
                  className="border rounded-lg p-2 w-full text-sm"
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  {isHR && <option value="HR">HR</option>}
                </select>
              ) : (
                <p className="font-medium">{employee.user.role}</p>
              )}
            </div>

            {/* Reporting Manager - HR and Manager editable */}
            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 mb-1">Reporting Manager</p>
              {editing ? (
                <select
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  className="border rounded-lg p-2 w-full text-sm"
                >
                  <option value="">No Manager</option>
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

            {/* Subordinates */}
            {employee.subordinates.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 mb-1">Direct Reports</p>
                {!employee.isActive && (
                  <div className="bg-yellow-50 text-yellow-700 rounded-lg px-3 py-2 text-xs mb-2">
                    ⚠️ These employees need to be reassigned to a new manager.
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  {employee.subordinates.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between"
                    >
                      <p className="font-medium text-sm">
                        {sub.name} {sub.surname} - {sub.position} (
                        {sub.employeeNumber})
                      </p>
                      <Link
                        href={`/hr/employees/${sub.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </div>
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
