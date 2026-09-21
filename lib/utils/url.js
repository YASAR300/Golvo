/**
 * Retrieves the application base URL, supporting both private APP_URL (recommended for Vercel secrets)
 * and NEXT_PUBLIC_APP_URL fallback.
 * @returns {string}
 */
export function getAppUrl() {
  const url =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  return url.replace(/\/$/, "");
}

export default getAppUrl;
