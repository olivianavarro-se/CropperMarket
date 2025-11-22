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
    // </CHANGE>
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push("/")
    // Use window.location.reload() to ensure complete state reset
    setTimeout(() => {
      window.location.href = "/"
    }, 100)
  }
  // </CHANGE>

  return (
    <header className="border-b bg-white/80 backdrop-blur-md shadow-sm z-10 sticky top-0">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
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
              {profile?.user_type === "supplier" && (
                <>
                  <Button asChild variant={pathname === "/" ? "default" : "outline"} className="shadow-sm">
                    <Link href="/">Browse Market</Link>
                  </Button>
                  <Button asChild variant={pathname === "/dashboard" ? "default" : "outline"} className="shadow-sm">
                    <Link href="/dashboard">My Dashboard</Link>
                  </Button>
                </>
              )}
              <Button onClick={handleLogout} variant="ghost">
                Logout
              </Button>
            </>
          ) : (
            <>
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
