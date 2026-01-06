export function getBaseUrl() {
  // Used for canonical URLs + sitemap.
  // Set NEXT_PUBLIC_SITE_URL in production, e.g. https://customizable-portfolio-plus.vercel.app
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  return raw.replace(/\/$/, "");
}
