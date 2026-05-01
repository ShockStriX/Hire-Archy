"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Employee {
  id: string;
  name: string;
  surname: string;
  position: string;
  employeeNumber: string;
  isActive: boolean;
  user: {
    role: string;
  };
}

interface CreatedEmployee {
  employeeNumber: string;
  initialPassword: string;
  email: string;
  role: "EMPLOYEE" | "MANAGER" | "HR";
}

export default function NewEmployeePage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [grossSalary, setGrossSalary] = useState("");
  const [position, setPosition] = useState("");
  const [managerId, setManagerId] = useState("");
  const [role, setRole] = useState<"EMPLOYEE" | "MANAGER" | "HR">("EMPLOYEE");
  const [managers, setManagers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedEmployee | null>(null);
  const router = useRouter();
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthYear, setBirthYear] = useState("");

  const updateBirthDate = (day: string, month: string, year: string) => {
    if (day && month && year) {
      const date = new Date(
        `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
      );
      setBirthDate(date.toISOString().split("T")[0]);
    }
  };

  useEffect(() => {
    // Fetch existing employees for manager dropdown
    const fetchEmployees = async () => {
      const res = await fetch("/api/hr/employees");
      const data = await res.json();
      setManagers(
        data.employees?.filter(
          (e: Employee) =>
            e.isActive && (e.user.role === "MANAGER" || e.user.role === "HR"),
        ) || [],
      );
    };
    fetchEmployees();
  }, []);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

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
        role,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      setLoading(false);
    } else {
      setCreated(data);
      setLoading(false);
    }
  };

  if (created) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md p-8 rounded-xl shadow-md bg-white">
          <h1 className="text-2xl font-bold mb-2 text-green-600">
            {created.role === "HR"
              ? "HR Account Created!"
              : created.role === "MANAGER"
                ? "Manager Account Created!"
                : "Employee Created!"}
          </h1>
          <p className="text-gray-500 mb-6">
            Please share the following credentials with the{" "}
            {created.role === "HR"
              ? "HR administrator"
              : created.role === "MANAGER"
                ? "manager"
                : "employee"}{" "}
            securely.
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
              onClick={() =>
                navigator.clipboard.writeText(
                  `Employee Number: ${created.employeeNumber}\nEmail: ${created.email}\nTemporary Password: ${created.initialPassword}`,
                )
              }
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
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-xl shadow-md bg-white">
        <h1 className="text-2xl font-bold mb-6">Create New Account</h1>

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
          <div>
            <p className="text-xs text-gray-500 mb-1">Birth Date</p>
            <div className="flex gap-2">
              <select
                value={birthDay}
                onChange={(e) => {
                  setBirthDay(e.target.value);
                  updateBirthDate(e.target.value, birthMonth, birthYear);
                }}
                className="border rounded-lg p-2 w-full"
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
                className="border rounded-lg p-2 w-full"
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
                className="border rounded-lg p-2 w-full"
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
          </div>
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
            value={role}
            onChange={(e) =>
              setRole(e.target.value as "EMPLOYEE" | "MANAGER" | "HR")
            }
            className="border rounded-lg p-2 w-full"
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
            <option value="HR">HR Administrator</option>
          </select>

          <select
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            className="border rounded-lg p-2 w-full"
          >
            <option value="">No Manager</option>
            {managers.map((manager) => (
              <option key={manager.id} value={manager.id}>
                {manager.name} {manager.surname} - {manager.position} (
                {manager.employeeNumber})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 text-white rounded-lg p-2 w-full disabled:opacity-50"
          >
            {loading
              ? "Creating..."
              : role === "HR"
                ? "Create HR Account"
                : role === "MANAGER"
                  ? "Create Manager Account"
                  : "Create Employee"}
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
  );
}
