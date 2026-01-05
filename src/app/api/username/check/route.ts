import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { usernameSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TTL_MS = 15_000;
const cache = new Map<string, { available: boolean; exp: number }>();

function getCached(username: string) {
  const hit = cache.get(username);
  if (!hit) return null;
  if (Date.now() > hit.exp) {
    cache.delete(username);
    return null;
  }
  return hit.available;
}

function setCached(username: string, available: boolean) {
  cache.set(username, { available, exp: Date.now() + TTL_MS });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("username") ?? "").trim();

  // Fast path: avoid DB calls for obvious invalid values.
  if (raw.length < 3 || raw.length > 24) {
    return NextResponse.json(
      { available: false, reason: "invalid" },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  const parsed = usernameSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { available: false, reason: "invalid" },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  const username = parsed.data;

  const cached = getCached(username);
  if (cached !== null) {
    return NextResponse.json(
      { available: cached },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  const exists = await prisma.user
    .findUnique({
      where: { username },
      select: { id: true },
    })
    .catch(() => {
      return "__db_error__" as const;
    });

  if (exists === "__db_error__") {
    return NextResponse.json(
      { available: false, reason: "error" },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }

  const available = !exists;
  setCached(username, available);

  return NextResponse.json(
    { available },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
