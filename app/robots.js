import { getAppUrl } from "@/lib/utils/url";

export default function robots() {
  const baseUrl = getAppUrl();

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pricing", "/charities", "/charities/*"],
      disallow: [
        "/api/",
        "/admin/",
        "/admin/*",
        "/dashboard/",
        "/dashboard/*",
        "/winnings",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
