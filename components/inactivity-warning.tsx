"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { useInactivityTimeout } from "@/hooks/use-inactivity-timeout"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

const WARNING_SECONDS = 120 // 2 minutes

const AUTH_PATHS = ["/auth/login", "/auth/sign-up", "/auth/forgot-password", "/auth/reset-password", "/auth/sign-up-success"]

export function InactivityWarning() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(WARNING_SECONDS)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p))

  // Check auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session)
      if (!session) setShowWarning(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = useCallback(async () => {
    setShowWarning(false)
    await supabase.auth.signOut()
    router.push("/auth/login")
  }, [router])

  const handleWarn = useCallback(() => {
    setShowWarning(true)
    setSecondsLeft(WARNING_SECONDS)
  }, [])

  const { extendSession } = useInactivityTimeout({
    onWarn: handleWarn,
    onLogout: handleLogout,
    enabled: isLoggedIn && !isAuthPage,
  })

  // Countdown timer when warning is visible
  useEffect(() => {
    if (!showWarning) return
    if (secondsLeft <= 0) {
      handleLogout()
      return
    }
    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [showWarning, secondsLeft, handleLogout])

  const handleStayLoggedIn = () => {
    setShowWarning(false)
    extendSession()
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  if (!showWarning) return null

  return (
    <AlertDialog open={showWarning}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#65411C]">Are you still there?</AlertDialogTitle>
          <AlertDialogDescription className="text-[#8A6842]">
            You have been inactive for a while. For your security, you will be automatically logged out in{" "}
            <span className="font-bold text-red-500 tabular-nums text-base">{formatTime(secondsLeft)}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-[#D4AF8E] text-[#65411C] hover:bg-[#FAF0E0] w-full sm:w-auto"
          >
            Log out now
          </Button>
          <Button
            onClick={handleStayLoggedIn}
            className="bg-[#F0B349] hover:bg-[#e0a030] text-[#65411C] font-bold w-full sm:w-auto"
          >
            Stay logged in
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
