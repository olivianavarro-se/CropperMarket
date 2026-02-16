"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Map, Search, Package, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileBottomNav() {
  const pathname = usePathname()

  const navItems = [
    {
      href: "/",
      label: "Map",
      icon: Map,
      active: pathname === "/",
    },
    {
      href: "/search",
      label: "Search",
      icon: Search,
      active: pathname === "/search",
    },
    {
      href: "/dashboard",
      label: "Orders",
      icon: Package,
      active: pathname.startsWith("/dashboard"),
    },
    {
      href: "/dashboard",
      label: "Account",
      icon: LayoutDashboard,
      active: false,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe md:hidden">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                item.active
                  ? "text-green-600"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Icon className={cn("h-6 w-6", item.active && "fill-green-600")} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
