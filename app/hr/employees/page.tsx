"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Employee {
  id: string;
  employeeNumber: string;
  name: string;
  surname: string;
  position: string;
  isActive: boolean;
  manager: {
    name: string;
    surname: string;
    employeeNumber: string;
  } | null;
  user: {
    email: string;
    role: string;
  };
}

type SortField =
  | "employeeNumber"
  | "name"
  | "position"
  | "email"
  | "role"
  | "status";
type SortDirection = "asc" | "desc";

export default function HREmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("active");
  const [sortField, setSortField] = useState<SortField>("employeeNumber");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  useEffect(() => {
    const fetchEmployees = async () => {
      const res = await fetch("/api/hr/employees");
      const data = await res.json();
      setEmployees(data.employees || []);
      setLoading(false);
    };
    fetchEmployees();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return " ↕";
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  const filtered = employees
    .filter((emp) => {
      const matchesSearch =
        search === "" ||
        emp.name.toLowerCase().includes(search.toLowerCase()) ||
        emp.surname.toLowerCase().includes(search.toLowerCase()) ||
        emp.employeeNumber.toLowerCase().includes(search.toLowerCase()) ||
        emp.position.toLowerCase().includes(search.toLowerCase()) ||
        emp.user.email.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && emp.isActive) ||
        (filter === "inactive" && !emp.isActive);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      let aVal = "";
      let bVal = "";

      switch (sortField) {
        case "employeeNumber":
          aVal = a.employeeNumber;
          bVal = b.employeeNumber;
          break;
        case "name":
          aVal = `${a.name} ${a.surname}`;
          bVal = `${b.name} ${b.surname}`;
          break;
        case "position":
          aVal = a.position;
          bVal = b.position;
          break;
        case "email":
          aVal = a.user.email;
          bVal = b.user.email;
          break;
        case "role":
          aVal = a.user.role;
          bVal = b.user.role;
          break;
        case "status":
          aVal = a.isActive ? "active" : "inactive";
          bVal = b.isActive ? "active" : "inactive";
          break;
      }

      return sortDirection === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });

  const SortableHeader = ({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) => (
    <th
      className="text-left p-4 cursor-pointer hover:bg-gray-100 select-none"
      onClick={() => handleSort(field)}
    >
      {label}
      <span className="text-gray-400 text-xs">{getSortIcon(field)}</span>
    </th>
  );

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

      {/* Search and Filter Bar */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name, employee number, position or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded-lg p-2 w-full text-sm border-black"
        />
        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value as "all" | "active" | "inactive")
          }
          className="border rounded-lg p-2 text-sm min-w-32 border-black"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500 mb-4">
        Showing {filtered.length} of {employees.length} employees
      </p>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : (
        <div className="rounded-xl border overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <SortableHeader field="employeeNumber" label="Employee #" />
                <SortableHeader field="name" label="Name" />
                <SortableHeader field="position" label="Position" />
                <SortableHeader field="email" label="Email" />
                <th className="text-left p-4">Manager</th>
                <SortableHeader field="role" label="Role" />
                <SortableHeader field="status" label="Status" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => (
                <tr key={emp.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">{emp.employeeNumber}</td>
                  <td className="p-4">
                    <Link
                      href={`/hr/employees/${emp.id}`}
                      className="hover:underline"
                    >
                      {emp.name} {emp.surname}
                    </Link>
                  </td>
                  <td className="p-4">{emp.position}</td>
                  <td className="p-4">{emp.user.email}</td>
                  <td className="p-4">
                    {emp.manager
                      ? `${emp.manager.name} ${emp.manager.surname} (${emp.manager.employeeNumber})`
                      : "—"}
                  </td>
                  <td className="p-4">{emp.user.role}</td>
                  <td className="p-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        emp.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {emp.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-gray-500">
                    {search
                      ? `No employees found matching "${search}"`
                      : "No employees found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
