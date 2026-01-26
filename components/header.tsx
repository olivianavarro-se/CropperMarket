"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"

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

    const profileChannel = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        async (payload) => {
          // Update profile state when the profile is updated
          if (payload.new && user && payload.new.id === user.id) {
            setProfile(payload.new)
          }
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
      profileChannel.unsubscribe()
    }
  }, [user]) // Updated dependency array to useExhaustiveDependencies

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
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

  return (
    <header className="border-b bg-[#FFFDF8]/90 backdrop-blur-md shadow-sm z-10 sticky top-0 border-[#E8D5B5]">
      <div className={`px-4 pr-4 py-3 flex items-center justify-between ${isHomePage ? "pl-6" : ""}`}>
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Image
            src="/images/hay-20cropper-20logo.png"
            alt="HayCropper Logo"
            width={64}
            height={64}
            className="object-contain"
          />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-[#65411C] tracking-wide">HAYCROPPER</h1>
            <span className="text-[10px] text-[#8A6842] tracking-widest -mt-1">MARKETPLACE</span>
          </div>
        </Link>

        <nav className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-[#8A6842]">Hello, {profile?.full_name || user.email}</span>
              <Button asChild variant={pathname === "/" ? "default" : "outline"} size="sm" className="shadow-sm">
                <Link href="/">Home</Link>
              </Button>
              <Button asChild variant={pathname === "/search" ? "default" : "outline"} size="sm" className="shadow-sm">
                <Link href="/search">Search</Link>
              </Button>
              {(profile?.account_type === "grower" || profile?.account_type === "broker" || profile?.account_type === "buyer") && (
                <Button
                  asChild
                  variant={pathname === "/dashboard" ? "default" : "outline"}
                  size="sm"
                  className="shadow-sm"
                >
                  <Link href="/dashboard">My Dashboard</Link>
                </Button>
              )}
              <Button
                asChild
                variant={pathname === "/settings" ? "default" : "outline"}
                size="sm"
                className="shadow-sm"
              >
                <Link href="/settings">Account</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant={pathname === "/" ? "default" : "outline"} size="sm" className="shadow-sm">
                <Link href="/">Home</Link>
              </Button>
              <Button asChild variant={pathname === "/search" ? "default" : "outline"} size="sm" className="shadow-sm">
                <Link href="/search">Search</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/sign-up">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
