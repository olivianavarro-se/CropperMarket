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

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        setSessionError("Invalid or expired reset link. Please request a new password reset.")
        setIsReady(false)
      } else {
        setIsReady(true)
      }
    }

    checkSession()
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
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
    <div className="fixed inset-0 flex w-full items-center justify-center p-4 md:p-10 bg-gradient-to-br from-amber-50 to-green-50 overflow-y-auto z-50">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold text-green-900">Cropper</h1>
            <p className="text-sm text-green-700">Your Hay Market Platform</p>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Set New Password</CardTitle>
              <CardDescription>Enter your new password below</CardDescription>
            </CardHeader>
            <CardContent>
              {sessionError ? (
                <div className="flex flex-col gap-4">
                  <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{sessionError}</div>
                  <Link href="/auth/forgot-password">
                    <Button variant="outline" className="w-full bg-transparent">
                      Request New Reset Link
                    </Button>
                  </Link>
                </div>
              ) : !isReady ? (
                <div className="text-center text-sm text-muted-foreground">Verifying reset link...</div>
              ) : (
                <form onSubmit={handleResetPassword}>
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="password">New Password</Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        minLength={6}
                      />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading}>
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
