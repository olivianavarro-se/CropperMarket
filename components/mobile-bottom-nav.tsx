"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Map, LayoutDashboard, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

export function MobileBottomNav() {
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    
    // Get initial auth state with error handling
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        // Invalid/expired token - user is not logged in
        setIsLoggedIn(false)
      } else {
        setIsLoggedIn(!!data.user)
      }
    }).catch(() => {
      // Any auth errors mean user is not authenticated
      setIsLoggedIn(false)
    })
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)
    })
    
    return () => subscription.unsubscribe()
  }, [])

  // Don't show on auth pages
  if (pathname.startsWith("/auth")) return null

  // Always-visible tabs, plus auth-only tabs
  const navItems = [
    { href: "/", label: "Map", icon: Map },
    ...(isLoggedIn
      ? [
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/settings", label: "Account", icon: User },
        ]
      : []),
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-hay-border bg-hay-bg/95 backdrop-blur-md md:hidden">
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
                  ? "text-hay-dark"
                  : "text-hay-medium/60 active:text-hay-dark"
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
                <span className="absolute top-0 h-[2px] w-10 rounded-b bg-hay-dark" />
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
