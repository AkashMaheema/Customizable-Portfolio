import { redirect } from "next/navigation";
import { Shell } from "@/components/Shell";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";
import { DashboardClient } from "./DashboardClient";

export const runtime = "nodejs";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      username: true,
      portfolio: { select: { isPublished: true } },
    },
  });

  if (!user) redirect("/login");

  return (
    <Shell
      title="Dashboard"
      subtitle="Edit your username, portfolio sections, and publishing status."
    >
      <DashboardClient
        username={user.username}
        hasPortfolio={!!user.portfolio}
        isPublished={user.portfolio?.isPublished ?? false}
        publicUrl={`/${user.username}`}
      />
    </Shell>
  );
}
