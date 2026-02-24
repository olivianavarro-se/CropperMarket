"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      router.push("/")
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
          <div className="flex flex-col items-center gap-1 text-center mb-2">
            <Link href="/" className="cursor-pointer block w-[240px] md:w-[320px] aspect-[3/2]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/hay-20cropper.png"
                alt="HayCropper Marketplace"
                className="w-full h-full object-contain"
                fetchPriority="high"
                decoding="sync"
              />
            </Link>
          </div>
          <Card className="border-2 border-[#F0B349] bg-white shadow-xl">
            <CardHeader className="pb-0.5 space-y-0 pt-3 px-4">
              <CardTitle className="text-lg text-[#65411C] font-bold mb-0">Welcome Back</CardTitle>
              <CardDescription className="text-[#8A6842] text-sm">Sign in to access your marketplace</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 pb-3 px-4">
              <form onSubmit={handleLogin}>
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
                  <div className="grid gap-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-[#65411C] text-sm">
                        Password
                      </Label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-xs text-[#F0B349] hover:text-[#FCE2A4] underline underline-offset-4"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10 border-[#D4AF8E] h-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A6842] hover:text-[#65411C]"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <Button
                    type="submit"
                    className="w-full bg-[#F0B349] hover:bg-[#FCE2A4] text-[#65411C] font-bold text-sm h-9 shadow-md hover:shadow-lg transition-all"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Login"}
                  </Button>
                </div>
                <div className="mt-3 text-center text-xs text-[#8A6842]">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/auth/sign-up"
                    className="text-[#F0B349] hover:text-[#FCE2A4] underline underline-offset-4 font-bold"
                  >
                    Sign up
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
