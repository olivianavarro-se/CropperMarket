"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export function Header() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        setProfile(profile)
      }
    }
    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      // If logout fails (e.g., user already deleted), still clear local session
      console.error("Logout error:", error)
    }
    setUser(null)
    setProfile(null)
    router.push("/")
    setTimeout(() => {
      window.location.href = "/"
    }, 100)
  }

  const isHomePage = pathname === "/"
  const containerPadding = isHomePage ? "pl-6" : "pl-4"

  return (
    <header className="border-b bg-white/80 backdrop-blur-md shadow-sm z-10 sticky top-0">
      <div className={`px-4 pr-4 py-4 flex items-center justify-between ${isHomePage ? "pl-6" : ""}`}>
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-700 to-green-900 bg-clip-text text-transparent">
            Cropper
          </h1>
        </Link>

        <nav className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-gray-600">Hello, {profile?.full_name || user.email}</span>
              <Button asChild variant={pathname === "/" ? "default" : "outline"} className="shadow-sm">
                <Link href="/">Home</Link>
              </Button>
              <Button asChild variant={pathname === "/search" ? "default" : "outline"} className="shadow-sm">
                <Link href="/search">Search</Link>
              </Button>
              {(profile?.user_type === "grower" || profile?.user_type === "broker") && (
                <Button asChild variant={pathname === "/dashboard" ? "default" : "outline"} className="shadow-sm">
                  <Link href="/dashboard">My Dashboard</Link>
                </Button>
              )}
              <Button asChild variant={pathname === "/settings" ? "default" : "outline"} className="shadow-sm">
                <Link href="/settings">Account</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant={pathname === "/" ? "default" : "outline"} className="shadow-sm">
                <Link href="/">Home</Link>
              </Button>
              <Button asChild variant={pathname === "/search" ? "default" : "outline"} className="shadow-sm">
                <Link href="/search">Search</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
