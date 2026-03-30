"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"

export function Header() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const userIdRef = useRef<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    let isMounted = true

    // Reusable function to fetch and update profile
    const fetchProfile = async (userId: string) => {
      if (!isMounted) return null
      try {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single()
        return profile
      } catch {
        return null
      }
    }

    const getUser = async () => {
      if (!isMounted) return
      
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (!isMounted) return
        
        if (error || !user) {
          setUser(null)
          setProfile(null)
          userIdRef.current = null
          setIsLoadingProfile(false)
          return
        }
        
        setUser(user)
        userIdRef.current = user.id
        const profile = await fetchProfile(user.id)
        
        if (isMounted) {
          setProfile(profile)
          setIsLoadingProfile(false)
        }
      } catch (err) {
        if (!isMounted) return
        if (err instanceof Error && (err.name === "AbortError" || err.message.includes("aborted"))) {
          return
        }
        setUser(null)
        setProfile(null)
        setIsLoadingProfile(false)
      }
    }
    
    getUser().catch(() => {})

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return
      
      const currentUser = session?.user ?? null
      const currentUserId = currentUser?.id ?? null
      
      // Only update if the user actually changed
      if (userIdRef.current !== currentUserId) {
        userIdRef.current = currentUserId
        setUser(currentUser)
        
        if (!currentUser) {
          setProfile(null)
          setIsLoadingProfile(false)
        } else {
          setIsLoadingProfile(true)
          const profile = await fetchProfile(currentUser.id)
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
        (payload) => {
          // Update profile if it matches current user
          if (isMounted && payload.new && userIdRef.current === payload.new.id) {
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
    await supabase.auth.signOut()
    router.push("/")
  }

  const isHomePage = pathname === "/"
  const isActive = (path: string) => pathname === path

  return (
    <header className="border-b bg-hay-bg/90 backdrop-blur-md shadow-sm z-10 sticky top-0 border-hay-border">
      <div className="px-3 md:px-4 py-2 md:py-3 flex items-center justify-between">
        {/* Logo -- slightly smaller on mobile */}
        <Link href="/" className="flex items-center gap-1.5 md:gap-2 hover:opacity-80 transition-opacity">
          <Image
            src="/images/hay-20cropper-20logo.png"
            alt="HayResource Logo"
            width={64}
            height={64}
            className="object-contain w-10 h-10 md:w-16 md:h-16"
          />
          <div className="flex flex-col">
            <h1 className="text-base md:text-xl font-bold text-hay-dark tracking-wide">HAYRESOURCE</h1>
            <span className="text-[8px] md:text-[10px] text-hay-medium tracking-widest -mt-0.5 md:-mt-1">MARKETPLACE</span>
          </div>
        </Link>

        {/* Desktop nav -- hidden on mobile, shown on md+ (unchanged from before) */}
        <nav className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {!isLoadingProfile && (
                <span className="text-sm text-hay-medium">
                  Hello, {(profile?.full_name && profile.full_name.trim()) || user.email?.split('@')[0] || 'User'}
                </span>
              )}
              <Button asChild variant={isActive("/") ? "default" : "outline"} size="sm" className="shadow-sm">
                <Link href="/">Home</Link>
              </Button>
              <Button asChild variant={isActive("/dashboard") ? "default" : "outline"} size="sm" className="shadow-sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant={isActive("/settings") ? "default" : "outline"} size="sm" className="shadow-sm">
                <Link href="/settings">Account</Link>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant={isActive("/") ? "default" : "outline"} size="sm" className="shadow-sm">
                <Link href="/">Home</Link>
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

        {/* Mobile nav -- only essential actions, bottom nav handles the rest */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            !isLoadingProfile && (
              <span className="text-xs text-hay-medium">
                Hi, {(profile?.full_name && profile.full_name.trim()) || user.email?.split('@')[0] || 'there'}
              </span>
            )
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="h-8 px-2 text-xs">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="h-8 px-3 text-xs">
                <Link href="/auth/sign-up">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
