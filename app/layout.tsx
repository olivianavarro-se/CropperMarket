import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { InactivityWarning } from "@/components/inactivity-warning"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "HayResource Marketplace - Your Hay Market Platform",
  description:
    "Discover hay suppliers, browse inventory, and connect with brokers and growers in the agricultural marketplace.",
  generator: "v0.app",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: [
      { url: "/apple-touch-icon.png" },
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased pb-14 md:pb-0`}>
        {children}
        <MobileBottomNav />
        <InactivityWarning />
        <Analytics />
      </body>
    </html>
  )
}
