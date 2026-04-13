import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { InactivityWarning } from "@/components/inactivity-warning"
import { StructuredData } from "@/components/structured-data"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL("https://hayresource.com"),
  title: {
    default: "HayResource - Buy & Sell Hay | Hay Marketplace for Farmers & Ranchers",
    template: "%s | HayResource",
  },
  description:
    "HayResource is the leading hay marketplace connecting farmers, ranchers, and hay suppliers. Find quality hay for sale, browse inventory from local growers, and connect with trusted brokers.",
  keywords: [
    "hay for sale",
    "buy hay",
    "sell hay",
    "hay marketplace",
    "hay resource",
    "hay suppliers",
    "alfalfa hay",
    "timothy hay",
    "hay farmers",
    "hay brokers",
    "livestock feed",
    "farm hay",
    "hay near me",
  ],
  authors: [{ name: "HayResource" }],
  creator: "HayResource",
  publisher: "HayResource",
  generator: "Next.js",
  applicationName: "HayResource",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hayresource.com",
    siteName: "HayResource",
    title: "HayResource - Buy & Sell Hay | Hay Marketplace for Farmers & Ranchers",
    description:
      "HayResource is the leading hay marketplace connecting farmers, ranchers, and hay suppliers. Find quality hay for sale and connect with trusted brokers.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "HayResource - Hay Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HayResource - Buy & Sell Hay | Hay Marketplace",
    description:
      "The leading hay marketplace connecting farmers, ranchers, and hay suppliers. Find quality hay for sale today.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: [
      { url: "/apple-touch-icon.png" },
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  verification: {
    // Add your Google Search Console verification code here after setup
    // google: "your-google-verification-code",
  },
  alternates: {
    canonical: "https://hayresource.com",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <StructuredData />
      </head>
      <body className={`font-sans antialiased pb-14 md:pb-0`}>
        {children}
        <MobileBottomNav />
        <InactivityWarning />
        <Analytics />
      </body>
    </html>
  )
}
