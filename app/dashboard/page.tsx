import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import UserCard from "@/components/ui/UserCard";
import LogoutButton from "@/components/ui/LogoutButton";

const getUserData = unstable_cache(
  async (email: string) => {
    const user = await prisma.user.findUnique({
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
    return user;
  },
  ["user-data"],
  { revalidate: 60, tags: ["user-data"] },
);

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }
  if (session.user.role === "HR") {
    redirect("/hr/dashboard");
  }

  const user = await getUserData(session.user.email);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-">
        <h1 className="text-2xl font-bold">Dashboard</h1>
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
    </div>
  );
}
