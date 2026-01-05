import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/session";
import { defaultSections } from "@/lib/portfolio";

export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.portfolio.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { ok: true, portfolioId: existing.id },
      { status: 200 }
    );
  }

  const portfolio = await prisma.portfolio.create({
    data: {
      userId: session.user.id,
      sections: defaultSections(),
    },
    select: { id: true },
  });

  return NextResponse.json(
    { ok: true, portfolioId: portfolio.id },
    { status: 201 }
  );
}
