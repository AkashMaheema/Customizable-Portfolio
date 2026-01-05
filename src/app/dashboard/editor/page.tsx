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

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: session.user.id },
    select: { sections: true },
  });

  if (!portfolio) redirect("/dashboard");

  const sections = sectionsSchema.safeParse(portfolio.sections);
  if (!sections.success) redirect("/dashboard");

  return (
    <Shell title="Editor" subtitle="Reorder sections and edit content inline.">
      <EditorClient initialSections={sections.data} />
    </Shell>
  );
}
