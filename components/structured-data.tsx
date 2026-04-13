export function StructuredData() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "HayResource",
    url: "https://hayresource.com",
    logo: "https://hayresource.com/favicon.png",
    description:
      "HayResource is the leading hay marketplace connecting farmers, ranchers, and hay suppliers.",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      availableLanguage: "English",
    },
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "HayResource",
    url: "https://hayresource.com",
    description:
      "Buy and sell hay online. Connect with hay suppliers, farmers, and brokers.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://hayresource.com/dashboard?search={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  }

  const marketplaceSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "HayResource Marketplace",
    url: "https://hayresource.com",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description:
      "Agricultural marketplace for buying and selling hay. Connect with local hay suppliers, farmers, ranchers, and brokers.",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      offerCount: "1000+",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(marketplaceSchema),
        }}
      />
    </>
  )
}
