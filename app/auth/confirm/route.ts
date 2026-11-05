import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ALLOWED_TYPES: EmailOtpType[] = ["recovery", "signup", "email", "email_change", "invite", "magiclink"]

function safeNextPath(next: string | null, fallback: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback
  return next
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const fallback = type === "recovery" ? "/auth/reset-password" : "/"
  const next = safeNextPath(searchParams.get("next"), fallback)
  const failurePath = type === "recovery" ? "/auth/forgot-password?error=link_expired" : "/auth/login?error=link_expired"

  if (!tokenHash || !type || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.redirect(new URL(failurePath, origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

  if (error) {
    return NextResponse.redirect(new URL(failurePath, origin))
  }

  return NextResponse.redirect(new URL(next, origin))
}
