import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="fixed inset-0 flex w-full items-center justify-center p-4 md:p-10 bg-gradient-to-br from-amber-50 to-green-50 overflow-y-auto z-50">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              We&apos;ve sent you a confirmation email. Please click the link in the email to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-[#F0B349] hover:bg-[#FCE2A4] text-[#65411C] font-bold">
              <a href="https://v0-hay-market-platform.vercel.app/">Go to HayCropper</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
