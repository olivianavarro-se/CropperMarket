"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [accountType, setAccountType] = useState<"grower" | "broker" | "buyer">("buyer")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
          data: {
            full_name: fullName,
            account_type: accountType,
          },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes("User already registered") || error.message.includes("already registered")) {
          setError("This email is already registered. Please use a different email or try logging in.")
        } else if (error.message.includes("Password should be at least 6 characters")) {
          setError(
            "Password must be at least 6 characters and include uppercase, lowercase, numbers, and special characters.",
          )
        } else {
          setError(error.message)
        }
      } else {
        setError("An error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex w-full items-center justify-center p-4 md:p-6 bg-[#FAF8F5] overflow-y-auto z-50">
      <div className="w-full max-w-md">
        <div className="flex flex-col">
          <div className="flex flex-col items-center gap-2 text-center mb-1">
            <Image
              src="/images/hay-20cropper.png"
              alt="HayCropper Marketplace"
              width={360}
              height={270}
              className="object-contain"
            />
          </div>
          <Card className="border-2 border-[#F0B349] bg-white shadow-xl">
            <CardHeader className="pb-1 space-y-0 pt-4 px-6">
              <CardTitle className="text-xl text-[#65411C] font-bold mb-0.5">Create Account</CardTitle>
              <CardDescription className="text-[#8A6842] text-base">Join the HayCropper marketplace</CardDescription>
            </CardHeader>
            <CardContent className="pt-1 pb-2 px-6">
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-1">
                    <Label htmlFor="full-name" className="text-[#65411C] text-sm">
                      Full Name
                    </Label>
                    <Input
                      id="full-name"
                      type="text"
                      placeholder="John Doe"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="border-[#D4AF8E] h-10 text-base"
                    />
                  </div>
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
                      className="border-[#D4AF8E] h-10 text-base"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="account-type" className="text-[#65411C] text-sm">
                      Account Type
                    </Label>
                    <Select
                      value={accountType}
                      onValueChange={(value: "grower" | "broker" | "buyer") => setAccountType(value)}
                    >
                      <SelectTrigger id="account-type" className="border-[#D4AF8E] h-10 text-base">
                        <SelectValue placeholder="Select account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buyer">Buyer</SelectItem>
                        <SelectItem value="broker">Broker</SelectItem>
                        <SelectItem value="grower">Grower</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="password" className="text-[#65411C] text-sm">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10 border-[#D4AF8E] h-10 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A6842] hover:text-[#65411C]"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-1">
                    <Label htmlFor="repeat-password" className="text-[#65411C] text-sm">
                      Repeat Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="repeat-password"
                        type={showRepeatPassword ? "text" : "password"}
                        required
                        value={repeatPassword}
                        onChange={(e) => setRepeatPassword(e.target.value)}
                        className="pr-10 border-[#D4AF8E] h-10 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A6842] hover:text-[#65411C]"
                      >
                        {showRepeatPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <Button
                    type="submit"
                    className="w-full bg-[#F0B349] hover:bg-[#FCE2A4] text-[#65411C] font-bold h-10 shadow-md hover:shadow-lg transition-all text-base"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating an account..." : "Sign up"}
                  </Button>
                </div>
                <div className="mt-2 text-center text-sm text-[#8A6842]">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="text-[#F0B349] hover:text-[#FCE2A4] underline underline-offset-4 font-bold"
                  >
                    Login
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
