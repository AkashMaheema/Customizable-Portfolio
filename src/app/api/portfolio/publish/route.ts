import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";
import { publishSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = publishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const portfolio = await prisma.portfolio.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!portfolio) {
    return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
  }

  const updated = await prisma.portfolio.update({
    where: { id: portfolio.id },
    data: { isPublished: parsed.data.isPublished },
    select: { isPublished: true },
  });

  return NextResponse.json({ ok: true, ...updated }, { status: 200 });
}
