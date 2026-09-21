/**
 * Retrieves the application base URL, supporting APP_URL for production
 * with automatic fallback to https://golvo.vercel.app for non-localhost.
 * @returns {string}
 */
export function getAppUrl() {
  if (typeof window !== "undefined") {
    // Local dev preserves localhost:3000
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      return window.location.origin;
    }
    // Any production/Vercel host defaults directly to the canonical domain
    return "https://golvo.vercel.app";
  }

  // Server-side: prefer APP_URL, fallback to https://golvo.vercel.app in production
  const url =
    process.env.APP_URL ||
    (process.env.NODE_ENV === "production" ? "https://golvo.vercel.app" : "http://localhost:3000");

  return url.replace(/\/$/, "");
}

export default getAppUrl;

