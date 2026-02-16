"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Map, Search, LayoutDashboard, User } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Map", icon: Map },
  { href: "/search", label: "Search", icon: Search },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/settings", label: "Account", icon: User },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  // Don't show on auth pages
  if (pathname.startsWith("/auth")) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E8D5B5] bg-[#FFFDF8]/95 backdrop-blur-md md:hidden">
      <div className="flex items-stretch justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                "min-h-[56px] justify-center",
                isActive
                  ? "text-[#65411C]"
                  : "text-[#8A6842]/60 active:text-[#65411C]"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "stroke-[2.5]" : "stroke-[1.5]"
                )}
              />
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute top-0 h-[2px] w-10 rounded-b bg-[#65411C]" />
              )}
            </Link>
          )
        })}
      </div>
      {/* Safe area padding for phones with home indicators */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  )
}
