"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import { passwordRequirements, passwordMeetsAllRequirements } from "@/lib/password-requirements"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let resolved = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
        resolved = true
        setSessionError(null)
        setIsReady(true)
      }
    })

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (data.session && !error) {
        resolved = true
        setIsReady(true)
        return
      }
      // Give the browser client a moment to exchange a ?code= from older email links.
      setTimeout(() => {
        if (!resolved) {
          setSessionError("This reset link has expired or was already used. Please request a new one.")
        }
      }, 2500)
    }

    checkSession()
    return () => subscription.unsubscribe()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!passwordMeetsAllRequirements(password)) {
      setError("Please make sure your password meets all requirements.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })
      if (error) throw error

      router.push("/auth/login")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex w-full items-center justify-center p-4 md:p-8 bg-[#FAF8F5] overflow-y-auto z-50">
      <div className="w-full max-w-sm my-auto">
        <div className="flex flex-col">
          <div className="flex flex-col items-center gap-1 text-center mb-4">
            <Link href="/" className="cursor-pointer flex flex-col items-center">
              <Image
                src="/images/hayresource-logo.png"
                alt="HayResource Marketplace"
                width={540}
                height={405}
                className="object-contain w-[270px] md:w-[360px]"
              />
              <h1 className="text-2xl md:text-3xl font-bold text-hay-dark tracking-wide mt-2">HAYRESOURCE</h1>
              <span className="text-xs md:text-sm text-hay-medium tracking-widest -mt-1">MARKETPLACE</span>
            </Link>
          </div>
          <Card className="border-2 border-[#F0B349] bg-white shadow-xl">
            <CardHeader className="pb-0.5 space-y-0 pt-3 px-4">
              <CardTitle className="text-lg text-[#65411C] font-bold mb-0">Set New Password</CardTitle>
              <CardDescription className="text-[#8A6842] text-sm">Enter your new password below</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 pb-3 px-4">
              {sessionError ? (
                <div className="flex flex-col gap-3">
                  <div
                    role="alert"
                    className="rounded-lg bg-[#FCE2A4]/40 p-3 text-xs text-[#65411C] border border-[#F0B349]"
                  >
                    {sessionError}
                  </div>
                  <Link href="/auth/forgot-password">
                    <Button className="w-full bg-[#F0B349] hover:bg-[#FCE2A4] text-[#65411C] font-bold text-sm h-9 shadow-md">
                      Request New Reset Link
                    </Button>
                  </Link>
                </div>
              ) : !isReady ? (
                <p className="py-2 text-center text-sm text-[#8A6842]">Verifying reset link...</p>
              ) : (
                <form onSubmit={handleResetPassword}>
                  <div className="flex flex-col gap-3">
                    <div className="grid gap-1">
                      <Label htmlFor="password" className="text-[#65411C] text-sm">
                        New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          aria-describedby="password-requirements"
                          className="pr-10 border-[#D4AF8E] h-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          aria-pressed={showPassword}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A6842] hover:text-[#65411C]"
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <ul
                        id="password-requirements"
                        className="mt-1 flex flex-col gap-1 rounded-md border border-[#D4AF8E] bg-[#FAF8F5] px-3 py-2"
                      >
                        {passwordRequirements.map(({ label, test }) => {
                          const met = test(password)
                          return (
                            <li key={label} className="flex items-center gap-1.5">
                              <span
                                aria-hidden="true"
                                className={`text-xs font-bold leading-none ${met ? "text-green-600" : "text-red-400"}`}
                              >
                                {met ? "✓" : "✗"}
                              </span>
                              <span className={`text-xs ${met ? "text-green-700" : "text-[#8A6842]"}`}>
                                {label}
                                <span className="sr-only">{met ? " (met)" : " (not met)"}</span>
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor="confirmPassword" className="text-[#65411C] text-sm">
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pr-10 border-[#D4AF8E] h-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                          aria-pressed={showConfirmPassword}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A6842] hover:text-[#65411C]"
                        >
                          {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <Button
                      type="submit"
                      className="w-full bg-[#F0B349] hover:bg-[#FCE2A4] text-[#65411C] font-bold text-sm h-9 shadow-md hover:shadow-lg transition-all"
                      disabled={isLoading}
                    >
                      {isLoading ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
