import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import UserCard from "@/components/ui/UserCard";

export default async function HRDashboardPage() {
  const session = await auth();

  if (!session || session.user.role !== "HR") {
    redirect("/dashboard");
  }
  const getUserData = unstable_cache(
    async (email: string) => {
      return await prisma.user.findUnique({
        where: { email },
        select: {
          avatarUrl: true,
          bannerUrl: true,
          employee: {
            select: {
              position: true,
              name: true,
              surname: true,
            },
          },
        },
      });
    },
    ["hr-user-data"],
    { revalidate: 60, tags: ["user-data"] },
  );

  const user = await getUserData(session.user.email!);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6 ">
        <h1 className="text-2xl font-bold">HR Dashboard</h1>
      </div>
      <UserCard
        email={session.user.email}
        avatarUrl={user?.avatarUrl}
        bannerUrl={user?.bannerUrl}
        role={session.user.role}
        position={user?.employee?.position}
        name={user?.employee?.name}
        surname={user?.employee?.surname}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Link
          href="/hr/employees"
          className="p-6 rounded-xl border shadow-sm hover:shadow-md transition"
        >
          <h2 className="text-lg font-bold mb-1">Employees</h2>
          <p className="text-gray-500 text-sm">View and manage all employees</p>
        </Link>

        <Link
          href="/hr/employees/new"
          className="p-6 rounded-xl border shadow-sm hover:shadow-md transition"
        >
          <h2 className="text-lg font-bold mb-1">Create Employee</h2>
          <p className="text-gray-500 text-sm">
            Add a new employee to the system
          </p>
        </Link>
      </div>
    </div>
  );
}
