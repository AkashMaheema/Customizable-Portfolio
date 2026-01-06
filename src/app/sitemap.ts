import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/site";

export const runtime = "nodejs";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();

  const users = await prisma.user.findMany({
    where: { portfolio: { isPublished: true } },
    select: { username: true, portfolio: { select: { updatedAt: true } } },
  });

  return users.map((u) => ({
    url: `${baseUrl}/${u.username}`,
    lastModified: u.portfolio?.updatedAt ?? new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));
}
