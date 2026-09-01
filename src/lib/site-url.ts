/**
 * Canonical app URL for auth redirects in emails.
 * Prefer NEXT_PUBLIC_SITE_URL so reset links always use production,
 * even when the API runs on a Vercel preview deployment.
 */
export function getSiteUrl(request?: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  if (request) {
    return new URL(request.url).origin;
  }

  return "http://localhost:3000";
}
