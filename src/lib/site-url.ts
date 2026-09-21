const DEVELOPMENT_SITE_URL = "http://localhost:3000";

export function getSiteUrl(): URL {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!configuredUrl) {
    if (process.env.NODE_ENV === "development") {
      return new URL(DEVELOPMENT_SITE_URL);
    }

    throw new Error("NEXT_PUBLIC_SITE_URL must be configured outside development.");
  }

  const siteUrl = new URL(configuredUrl);

  if (siteUrl.protocol !== "http:" && siteUrl.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use the http or https protocol.");
  }

  siteUrl.pathname = "/";
  siteUrl.search = "";
  siteUrl.hash = "";

  return siteUrl;
}
