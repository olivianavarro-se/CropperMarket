"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import Image from "next/image"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const redirectUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
        ? `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL}/auth/reset-password`
        : `${window.location.origin}/auth/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })
      if (error) throw error
      setSuccess(true)
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
          <div className="flex flex-col items-center gap-1 text-center mb-0.5">
            <Image
              src="/images/hay-20cropper.png"
              alt="HayCropper Marketplace"
              width={240}
              height={180}
              className="object-contain w-[160px] md:w-[240px]"
            />
          </div>
          <Card className="border-2 border-[#F0B349] bg-white shadow-xl">
            <CardHeader className="pb-0.5 space-y-0 pt-3 px-4">
              <CardTitle className="text-lg text-[#65411C] font-bold mb-0">Reset Password</CardTitle>
              <CardDescription className="text-[#8A6842] text-sm">
                Enter your email address and we'll send you a link to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 pb-3 px-4">
              {success ? (
                <div className="flex flex-col gap-3">
                  <div className="rounded-lg bg-[#F0F5EB] p-3 text-xs text-[#5A7A3A] border border-[#D4E4C8]">
                    Check your email for a password reset link. It may take a few minutes to arrive.
                  </div>
                  <Link href="/auth/login">
                    <Button variant="outline" className="w-full bg-transparent border-[#D4AF8E] text-[#65411C] hover:bg-[#FAF8F5] h-9 text-sm">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleResetPassword}>
                  <div className="flex flex-col gap-3">
                    <div className="grid gap-1">
                      <Label htmlFor="email" className="text-[#65411C] text-sm">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="farmer@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-[#D4AF8E] h-9"
                      />
                    </div>
                    {error && <p className="text-xs text-red-500">{error}</p>}
                    <Button
                      type="submit"
                      className="w-full bg-[#F0B349] hover:bg-[#FCE2A4] text-[#65411C] font-bold text-sm h-9 shadow-md hover:shadow-lg transition-all"
                      disabled={isLoading}
                    >
                      {isLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </div>
                  <div className="mt-3 text-center text-xs text-[#8A6842]">
                    Remember your password?{" "}
                    <Link
                      href="/auth/login"
                      className="text-[#F0B349] hover:text-[#FCE2A4] underline underline-offset-4 font-bold"
                    >
                      Back to Login
                    </Link>
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
