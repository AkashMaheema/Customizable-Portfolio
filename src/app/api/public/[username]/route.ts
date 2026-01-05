import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { usernameSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username: raw } = await params;
  const parsed = usernameSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const username = parsed.data;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      portfolio: {
        select: {
          isPublished: true,
          sections: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!user?.portfolio?.isPublished) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      username: user.username,
      sections: user.portfolio.sections,
      updatedAt: user.portfolio.updatedAt,
    },
    { status: 200 }
  );
}
