"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import crypto from "crypto";
import { useRouter } from "next/navigation";

const Tree = dynamic(
  () => import("react-organizational-chart").then((mod) => mod.Tree),
  { ssr: false },
);

const TreeNode = dynamic(
  () => import("react-organizational-chart").then((mod) => mod.TreeNode),
  { ssr: false },
);

function getGravatarUrl(email: string, size: number = 80) {
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
  position: string;
  gross_salary?: number;
  isActive: boolean;
  managerId: string | null;
  user: {
    email: string;
    role: string;
    avatarUrl: string | null;
  };
  subordinates?: Employee[];
}

interface SelectedEmployee {
  id: string;
  name: string;
  surname: string;
  position: string;
  email: string;
  role: string;
  avatarUrl: string | null;
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case "HR":
      return "bg-[#DCFCE7] text-purple-700";
    case "MANAGER":
      return "bg-[#E0E7FF] text-blue-700";
    default:
      return "bg-[#F1F5F9] text-[gray-700]";
  }
}

function EmployeeCard({
  employee,
  isCurrentUser,
  showSalary,
  isHighlighted,
  onSelect,
}: {
  employee: Employee;
  isCurrentUser: boolean;
  showSalary: boolean;
  isHighlighted: boolean;
  onSelect: (emp: SelectedEmployee) => void;
}) {
  const avatarUrl =
    employee.user.avatarUrl || getGravatarUrl(employee.user.email);

  return (
    <div
      onClick={() =>
        onSelect({
          id: employee.id,
          name: employee.name,
          surname: employee.surname,
          position: employee.position,
          email: employee.user.email,
          role: employee.user.role,
          avatarUrl: employee.user.avatarUrl,
        })
      }
      className={`
        inline-flex flex-col items-center p-3 rounded-xl border shadow-sm cursor-pointer
        hover:shadow-md transition-all min-w-36 max-w-44
        ${
          isCurrentUser
            ? "border-blue-500 border-2 bg-white"
            : isHighlighted
              ? "border-yellow-400 bg-yellow-50 shadow-yellow-200 shadow-md"
              : "border-gray-200 bg-white"
        }
      `}
    >
      <img
        src={avatarUrl}
        alt={`${employee.name} ${employee.surname}`}
        className="w-12 h-12 rounded-full object-cover mb-2 border-2 border-white shadow"
      />
      <p className="font-semibold text-xs text-center leading-tight">
        {employee.name} {employee.surname}
      </p>
      <p className="text-xs text-gray-500 text-center leading-tight mt-0.5">
        {employee.position}
      </p>
      <span
        className={`text-xs px-2 py-0.5 rounded-full mt-1 ${getRoleBadgeColor(employee.user.role)}`}
      >
        {employee.user.role}
      </span>
      {showSalary && employee.gross_salary && (
        <p className="text-xs text-green-600 font-medium mt-1">
          R{Number(employee.gross_salary).toLocaleString()}
        </p>
      )}
    </div>
  );
}

function OrgNode({
  employee,
  currentEmployeeId,
  showSalary,
  search,
  onSelect,
}: {
  employee: Employee;
  currentEmployeeId?: string;
  showSalary: boolean;
  search: string;
  onSelect: (emp: SelectedEmployee) => void;
}) {
  const isCurrentUser = employee.id === currentEmployeeId;

  const isHighlighted =
    search.trim() !== "" &&
    (employee.name.toLowerCase().includes(search.toLowerCase()) ||
      employee.surname.toLowerCase().includes(search.toLowerCase()) ||
      employee.position.toLowerCase().includes(search.toLowerCase()) ||
      employee.user.email.toLowerCase().includes(search.toLowerCase()) ||
      employee.user.role.toLowerCase().includes(search.toLowerCase()));

  return (
    <TreeNode
      label={
        <div className="flex justify-center">
          <EmployeeCard
            employee={employee}
            isCurrentUser={isCurrentUser}
            showSalary={showSalary}
            isHighlighted={isHighlighted}
            onSelect={onSelect}
          />
        </div>
      }
    >
      {employee.subordinates?.map((sub) => (
        <OrgNode
          key={sub.id}
          employee={sub}
          currentEmployeeId={currentEmployeeId}
          showSalary={showSalary}
          search={search}
          onSelect={onSelect}
        />
      ))}
    </TreeNode>
  );
}

export default function OrganogramPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const [data, setData] = useState<{
    tree?: Employee[];
    role?: string;
    currentEmployee?: Employee;
    currentEmployeeId?: string;
    manager?: Employee | null;
    colleagues?: Employee[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SelectedEmployee | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchOrganogram = async () => {
      const res = await fetch("/api/organogram");
      const json = await res.json();
      setData(json);
      setLoading(false);
    };
    fetchOrganogram();
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    },
    [position],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    },
    [isDragging, dragStart],
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setScale((prev) => Math.min(Math.max(prev - e.deltaY * 0.001, 0.3), 2));
  }, []);

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center">
        Loading organogram...
      </div>
    );

  const showSalary = data?.role === "HR" || data?.role === "MANAGER";

  // Employee view
  if (data?.role === "EMPLOYEE") {
    const currentEmployee = data.currentEmployee!;
    const manager = data.manager;
    const colleagues = data.colleagues || [];

    // Build a fake tree structure for the employee view
    const employeeNode: Employee = {
      ...currentEmployee,
      subordinates: [],
    };

    const colleagueNodes: Employee[] = colleagues.map((col) => ({
      ...col,
      subordinates: [],
    }));

    // All siblings (current employee + colleagues) under the manager
    const siblings = [employeeNode, ...colleagueNodes];

    // If there's a manager, use them as root
    // If not, render siblings directly
    const rootNode: Employee | null = manager
      ? {
          ...manager,
          subordinates: siblings,
        }
      : null;

    return (
      <div className="flex flex-col flex-1 relative">
        {/* Fixed header */}
        <div className="fixed top-28 left-0 right-0 z-30 bg-[#6366F1] border-b flex justify-between items-center px-8 py-4">
          <h1 className="text-2xl font-bold">My Position</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setScale((s) => Math.min(s + 0.1, 2))}
              className="bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1 text-sm"
            >
              +
            </button>
            <button
              onClick={() => setScale(1)}
              className="bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1 text-sm"
            >
              Reset
            </button>
            <button
              onClick={() => setScale((s) => Math.max(s - 0.1, 0.3))}
              className="bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1 text-sm"
            >
              −
            </button>
          </div>
        </div>

        {/* Organogram canvas */}
        <div
          className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing bg-[#F5F7FA] mt-16"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: "center top",
              transition: isDragging ? "none" : "transform 0.1s",
              padding: "40px",
              minWidth: "max-content",
            }}
          >
            {rootNode ? (
              <Tree
                lineWidth="2px"
                lineColor="#3b82f6"
                lineBorderRadius="8px"
                label={<div />}
              >
                <OrgNode
                  employee={rootNode}
                  currentEmployeeId={currentEmployee.id}
                  showSalary={false}
                  search=""
                  onSelect={setSelected}
                />
              </Tree>
            ) : (
              // No manager - render siblings directly
              <Tree
                lineWidth="2px"
                lineColor="#3b82f6"
                lineBorderRadius="8px"
                label={<div />}
              >
                {siblings.map((emp) => (
                  <OrgNode
                    key={emp.id}
                    employee={emp}
                    currentEmployeeId={currentEmployee.id}
                    showSalary={false}
                    search=""
                    onSelect={setSelected}
                  />
                ))}
              </Tree>
            )}
          </div>
        </div>

        {/* Node click modal - read only for employees */}
        {selected && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setSelected(null)}
          >
            <div
              className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={selected.avatarUrl || getGravatarUrl(selected.email)}
                  className="w-16 h-16 rounded-full object-cover"
                  alt={selected.name}
                />
                <div>
                  <p className="font-bold text-lg">
                    {selected.name} {selected.surname}
                  </p>
                  <p className="text-gray-500 text-sm">{selected.position}</p>
                  <p className="text-gray-400 text-xs">{selected.email}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${getRoleBadgeColor(selected.role)}`}
                  >
                    {selected.role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2 text-sm w-full"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // HR and Manager view
  return (
    <div className="flex flex-col flex-1 relative">
      {/* Fixed header */}
      <div className="fixed top-28 left-0 right-0 z-30 bg-[#EEF2F7] border-b flex justify-between items-center px-8 py-4">
        <h1 className="text-2xl font-bold">Organogram</h1>

        <div className="flex items-center gap-4">
          {/* Search bar */}
          <input
            type="text"
            placeholder="Search by name, position or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm w-64 border-black"
          />

          {/* Zoom controls */}
          <div className="flex gap-2">
            <button
              onClick={() => setScale((s) => Math.min(s + 0.1, 2))}
              className="bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1 text-sm border-black"
            >
              +
            </button>
            <button
              onClick={() => setScale(1)}
              className="bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1 text-sm"
            >
              Reset
            </button>
            <button
              onClick={() => setScale((s) => Math.max(s - 0.1, 0.3))}
              className="bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-1 text-sm"
            >
              −
            </button>
          </div>
        </div>
      </div>

      {/* Organogram canvas */}
      <div
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing bg-[#EEF2F7]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: "center top",
            transition: isDragging ? "none" : "transform 0.1s",
            padding: "40px",
            minWidth: "max-content",
          }}
        >
          {data?.tree && data.tree.length > 0 && (
            <Tree
              lineWidth="2px"
              lineColor="#3b82f6"
              lineBorderRadius="8px"
              label={<div />}
            >
              {data.tree.map((root) => (
                <OrgNode
                  key={root.id}
                  employee={root}
                  currentEmployeeId={data.currentEmployeeId}
                  showSalary={showSalary}
                  search={search}
                  onSelect={setSelected}
                />
              ))}
            </Tree>
          )}
        </div>
      </div>

      {/* Node click modal - HR and Manager view */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <img
                src={selected.avatarUrl || getGravatarUrl(selected.email)}
                className="w-16 h-16 rounded-full object-cover"
                alt={selected.name}
              />
              <div>
                <p className="font-bold text-lg">
                  {selected.name} {selected.surname}
                </p>
                <p className="text-gray-500 text-sm">{selected.position}</p>
                <p className="text-gray-400 text-xs">{selected.email}</p>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${getRoleBadgeColor(selected.role)}`}
                >
                  {selected.role}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {selected.id !== data?.currentEmployeeId &&
                selected.id !== data?.manager?.id && ( // Hide for manager above
                  <button
                    onClick={() => router.push(`/hr/employees/${selected.id}`)}
                    className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm w-full mb-2"
                  >
                    Edit Details
                  </button>
                )}
              <button
                onClick={() => setSelected(null)}
                className="bg-gray-200 text-gray-800 rounded-lg px-4 py-2 text-sm w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
