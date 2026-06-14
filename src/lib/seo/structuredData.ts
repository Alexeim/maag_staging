export type JsonLdObject = Record<string, unknown>;

export const toStructuredDataArray = (
  value?: JsonLdObject | JsonLdObject[],
) => {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

export const buildGlobalStructuredData = (
  siteOrigin: string,
  toAbsoluteUrl: (value?: string) => string | undefined,
): JsonLdObject[] => {
  const organizationId = toAbsoluteUrl("/#organization");
  const websiteId = toAbsoluteUrl("/#website");

  return [
    {
      "@context": "https://schema.org",
      "@type": "NewsMediaOrganization",
      "@id": organizationId,
      name: "MAAG France",
      url: siteOrigin,
      logo: toAbsoluteUrl("/favicon.svg"),
      inLanguage: "ru",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": websiteId,
      name: "MAAG France",
      url: siteOrigin,
      inLanguage: "ru",
      publisher: {
        "@id": organizationId,
      },
    },
  ];
};
