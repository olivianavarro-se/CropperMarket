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
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    const getUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()
        
        // Handle abort or unmount gracefully
        if (!isMounted) return
        if (error && error.message === "Auth session missing!") {
          // Expected for non-logged-in users
          if (isMounted) {
            setIsLoadingProfile(false)
          }
          return
        }
        
        setUser(user)

        if (user && isMounted) {
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
          if (isMounted) {
            setProfile(profile)
            setIsLoadingProfile(false)
          }
        } else if (isMounted) {
          setIsLoadingProfile(false)
        }
      } catch (err) {
        // Silently handle abort errors (expected on unmount)
        if (err instanceof Error && err.name === "AbortError") {
          return
        }
        if (isMounted) {
          setIsLoadingProfile(false)
        }
      }
    }
    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (isMounted) {
        const currentUser = session?.user ?? null
        setUser(currentUser)
        
        if (!currentUser) {
          setProfile(null)
          setIsLoadingProfile(false)
        } else {
          // Fetch profile when user changes
          setIsLoadingProfile(true)
          const { data: profile } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single()
          if (isMounted) {
            setProfile(profile)
            setIsLoadingProfile(false)
          }
        }
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
          const currentUser = await supabase.auth.getUser()
          if (payload.new && currentUser.data.user && payload.new.id === currentUser.data.user.id && isMounted) {
            setProfile(payload.new)
          }
        },
      )
      .subscribe()

    return () => {
      isMounted = false
      subscription.unsubscribe()
      profileChannel.unsubscribe()
    }
  }, [])

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
              {!isLoadingProfile && (
                <span className="text-sm text-[#8A6842]">
                  Hello, {(profile?.full_name && profile.full_name.trim()) || user.email?.split('@')[0] || 'User'}
                </span>
              )}
              <Button asChild variant={pathname === "/" ? "default" : "outline"} size="sm" className="shadow-sm">
                <Link href="/">Home</Link>
              </Button>
              <Button asChild variant={pathname === "/search" ? "default" : "outline"} size="sm" className="shadow-sm">
                <Link href="/search">Search</Link>
              </Button>
              <Button
                asChild
                variant={pathname === "/dashboard" ? "default" : "outline"}
                size="sm"
                className="shadow-sm"
              >
                <Link href="/dashboard">Dashboard</Link>
              </Button>
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
