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

const passwordRequirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "Lowercase letter (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "Uppercase letter (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Number (0-9)", test: (p: string) => /[0-9]/.test(p) },
  { label: "Special character (!@#$...)", test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|<>?,./`~]/.test(p) },
]

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
  const [passwordFocused, setPasswordFocused] = useState(false)
  const router = useRouter()

  const passwordMeetsAll = passwordRequirements.every(({ test }) => test(password))

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (!passwordMeetsAll) {
      setError("Please make sure your password meets all requirements.")
      setIsLoading(false)
      return
    }

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
          emailRedirectTo: "https://v0-hay-market-platform.vercel.app/",
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
        } else if (error.message.toLowerCase().includes("password")) {
          setError("Password does not meet the requirements. Please check the checklist below the password field.")
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
      <div className="w-full max-w-sm">
        <div className="flex flex-col">
          <div className="flex flex-col items-center gap-1 text-center mb-2">
            <Link href="/" className="cursor-pointer">
              <Image
                src="/images/hay-20cropper.png"
                alt="HayCropper Marketplace"
                width={360}
                height={270}
                className="object-contain w-[240px] md:w-[320px]"
              />
            </Link>
          </div>
          <Card className="border-2 border-[#F0B349] bg-white shadow-xl">
            <CardHeader className="pb-0.5 space-y-0 pt-3 px-4">
              <CardTitle className="text-lg text-[#65411C] font-bold mb-0">Create Account</CardTitle>
              <CardDescription className="text-[#8A6842] text-sm">Join the HayCropper marketplace</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 pb-3 px-4">
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-2.5">
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
                      className="border-[#D4AF8E] h-9"
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
                      className="border-[#D4AF8E] h-9"
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
                      <SelectTrigger id="account-type" className="border-[#D4AF8E] h-9">
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
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
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
                    {(passwordFocused || password.length > 0) && (
                      <div className="mt-1 rounded-md border border-[#E8D5B8] bg-[#FAF8F5] px-3 py-2 flex flex-col gap-1">
                        {passwordRequirements.map(({ label, test }) => {
                          const met = test(password)
                          return (
                            <div key={label} className="flex items-center gap-1.5">
                              <span className={`text-xs font-bold leading-none ${met ? "text-green-600" : "text-red-400"}`}>
                                {met ? "✓" : "✗"}
                              </span>
                              <span className={`text-xs ${met ? "text-green-700" : "text-[#8A6842]"}`}>{label}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
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
                        className="pr-10 border-[#D4AF8E] h-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRepeatPassword(!showRepeatPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A6842] hover:text-[#65411C]"
                      >
                        {showRepeatPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <Button
                    type="submit"
                    className="w-full bg-[#F0B349] hover:bg-[#FCE2A4] text-[#65411C] font-bold h-9 shadow-md hover:shadow-lg transition-all text-sm"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating an account..." : "Sign up"}
                  </Button>
                </div>
                <div className="mt-2 text-center text-xs text-[#8A6842]">
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
