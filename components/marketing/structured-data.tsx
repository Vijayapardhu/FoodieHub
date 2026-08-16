const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://foodiehub-dusky.vercel.app"

/**
 * JSON-LD for the landing page.
 *
 * Three linked things, because they answer three different questions a search
 * engine asks: what is this site (WebSite), what is the thing it offers
 * (SoftwareApplication — a free, installable web app), and where on earth
 * does it operate (Place — Aditya University, Surampalem). The last one is
 * what makes "canteen ordering near Aditya University" resolve to this rather
 * than to a national delivery brand.
 *
 * Written as one @graph so the nodes can reference each other by @id instead
 * of repeating themselves.
 */
export function StructuredData({
  canteenCount,
  dishCount,
}: {
  canteenCount: number
  dishCount: number
}) {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "FoodieHub",
        description:
          "Order ahead from the canteens at Aditya University, Surampalem. Skip the queue, collect with a pickup token, pay at the counter.",
        inLanguage: "en-IN",
        publisher: { "@id": `${SITE_URL}/#developer` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#app`,
        name: "FoodieHub",
        url: SITE_URL,
        applicationCategory: "FoodApplication",
        operatingSystem: "Any — runs in a browser, installs to the home screen",
        description: `Campus canteen ordering for Aditya University, Surampalem. ${dishCount} dishes across ${canteenCount} canteens, with live order tracking and a pickup token.`,
        // Genuinely free on both sides — no student fee and no commission.
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "INR",
        },
        author: { "@id": `${SITE_URL}/#developer` },
        featureList: [
          "Order ahead from campus canteens",
          "Live order tracking with a pickup token",
          "Estimated ready time per dish",
          "Pay at the counter — no online payment",
          "Works offline and installs to the home screen",
        ],
      },
      {
        "@type": "Place",
        "@id": `${SITE_URL}/#location`,
        name: "Aditya University",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Aditya University",
          addressLocality: "Surampalem",
          addressRegion: "Andhra Pradesh",
          postalCode: "533437",
          addressCountry: "IN",
        },
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#developer`,
        name: "Vijaya Pardhu",
        url: "https://vijayaapardhu.dev",
        jobTitle: "Developer",
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      // Content is a literal built here, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  )
}
