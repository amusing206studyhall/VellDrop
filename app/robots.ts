import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/api/",
        "/auth/",
        "/secure-share/",
        "/billing/",
      ],
    },
    sitemap:
      (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000") +
      "/sitemap.xml",
  };
}
