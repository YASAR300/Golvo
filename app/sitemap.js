import { adminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/utils/url";

export default async function sitemap() {
  const baseUrl = getAppUrl();

  const staticRoutes = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/charities`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  let charityRoutes = [];
  try {
    const { data: charities } = await adminClient
      .from("charities")
      .select("slug, created_at");

    if (charities) {
      charityRoutes = charities.map((c) => ({
        url: `${baseUrl}/charities/${c.slug}`,
        lastModified: new Date(c.created_at || Date.now()),
        changeFrequency: "weekly",
        priority: 0.7,
      }));
    }
  } catch (err) {
    console.warn("Could not fetch charities for sitemap:", err);
  }

  return [...staticRoutes, ...charityRoutes];
}
