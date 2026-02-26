"use client"

import { useEffect, useRef, useCallback } from "react"

const INACTIVITY_LIMIT_MS = 13 * 60 * 1000  // 13 minutes → then show warning
const WARNING_DURATION_MS = 2 * 60 * 1000    // 2 minute warning countdown

interface UseInactivityTimeoutOptions {
  onWarn: () => void
  onLogout: () => void
  enabled: boolean
}

export function useInactivityTimeout({ onWarn, onLogout, enabled }: UseInactivityTimeoutOptions) {
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isWarningShown = useRef(false)

  const clearAllTimers = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    if (logoutTimer.current) clearTimeout(logoutTimer.current)
  }, [])

  const resetTimers = useCallback(() => {
    if (!enabled) return
    clearAllTimers()
    isWarningShown.current = false

    inactivityTimer.current = setTimeout(() => {
      isWarningShown.current = true
      onWarn()
      logoutTimer.current = setTimeout(() => {
        onLogout()
      }, WARNING_DURATION_MS)
    }, INACTIVITY_LIMIT_MS)
  }, [enabled, onWarn, onLogout, clearAllTimers])

  // Call this when the user clicks "Stay logged in"
  const extendSession = useCallback(() => {
    resetTimers()
  }, [resetTimers])

  useEffect(() => {
    if (!enabled) {
      clearAllTimers()
      return
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"]

    const handleActivity = () => {
      if (!isWarningShown.current) {
        resetTimers()
      }
    }

    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }))
    resetTimers()

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity))
      clearAllTimers()
    }
  }, [enabled, resetTimers, clearAllTimers])

  return { extendSession, clearAllTimers }
}
