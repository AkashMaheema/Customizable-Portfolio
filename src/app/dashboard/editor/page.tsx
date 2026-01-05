import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";
import { sectionsSchema } from "@/lib/validation";
import { Shell } from "@/components/Shell";
import { EditorClient } from "./EditorClient";

export const runtime = "nodejs";

export default async function EditorPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      username: true,
      portfolio: { select: { sections: true } },
    },
  });

  if (!user?.portfolio) redirect("/dashboard");

  const sections = sectionsSchema.safeParse(user.portfolio.sections);
  if (!sections.success) redirect("/dashboard");

  return (
    <Shell title="Editor" subtitle="Reorder sections and edit content inline.">
      <EditorClient username={user.username} initialSections={sections.data} />
    </Shell>
  );
}
