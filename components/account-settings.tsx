"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { User, Key, Trash2, LogOut } from "lucide-react"
import { deleteAccount } from "@/app/actions/delete-account"

interface AccountSettingsProps {
  user: any
  profile: any
  supplier: any
}

export function AccountSettings({ user, profile, supplier }: AccountSettingsProps) {
  const [fullName, setFullName] = useState(profile?.full_name || "")
  const [contactEmail, setContactEmail] = useState(supplier?.email || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true)
    setProfileError(null)
    setProfileSuccess(null)

    try {
      const { error: profileError } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id)

      if (profileError) throw profileError

      if (supplier && contactEmail !== supplier.email) {
        const { error: supplierError } = await supabase
          .from("suppliers")
          .update({ email: contactEmail })
          .eq("user_id", user.id)

        if (supplierError) throw supplierError
      }

      setProfileSuccess("Profile updated successfully!")
      router.refresh()
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleChangePassword = async () => {
    setIsChangingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(null)

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match")
      setIsChangingPassword(false)
      return
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters")
      setIsChangingPassword(false)
      return
    }

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })

      if (signInError) {
        throw new Error("Current password is incorrect")
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) throw updateError

      setPasswordSuccess("Password changed successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setPasswordError(err.message || "Failed to change password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Logout error:", error)
    }
    router.push("/")
    setTimeout(() => {
      window.location.href = "/"
    }, 100)
  }

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    setProfileError(null)

    try {
      const result = await deleteAccount()

      if (!result.success) {
        throw new Error(result.error || "Failed to delete account")
      }

      router.push("/")
      setTimeout(() => {
        window.location.href = "/"
      }, 100)
    } catch (err: any) {
      setProfileError(err.message || "Failed to delete account")
      setIsDeletingAccount(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>View and update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Account Email (Login)</Label>
            <Input value={user.email} disabled className="bg-gray-50" />
            <p className="text-xs text-muted-foreground">This email is used to log in and cannot be changed.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full-name">Full Name</Label>
            <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          {supplier && (
            <>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Contact Email (Public)</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This email will be displayed in your business profile for others to contact you.
                </p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Account Type</Label>
            <Input value={profile?.user_type || "N/A"} disabled className="bg-gray-50 capitalize" />
          </div>

          {(profileSuccess || profileError) && (
            <div
              className={`rounded-md p-3 ${profileSuccess ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
            >
              <p className={`text-sm ${profileSuccess ? "text-green-800" : "text-red-800"}`}>
                {profileSuccess || profileError}
              </p>
            </div>
          )}

          <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
            {isUpdatingProfile ? "Updating..." : "Update Profile"}
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {(passwordSuccess || passwordError) && (
            <div
              className={`rounded-md p-3 ${passwordSuccess ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}
            >
              <p className={`text-sm ${passwordSuccess ? "text-green-800" : "text-red-800"}`}>
                {passwordSuccess || passwordError}
              </p>
            </div>
          )}

          <Button
            onClick={handleChangePassword}
            disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
          >
            {isChangingPassword ? "Changing..." : "Change Password"}
          </Button>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
          <CardDescription>Log out or permanently delete your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            <Button variant="outline" onClick={handleLogout} className="w-full justify-start bg-transparent">
              <LogOut className="h-4 w-4 mr-2" />
              Log Out
            </Button>

            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)} className="w-full justify-start">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                This action cannot be undone. This will permanently delete your account and remove all your data from
                our servers, including:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Your profile information</li>
                {supplier && (
                  <>
                    <li>Your business profile</li>
                    <li>All your inventory listings</li>
                  </>
                )}
                <li>All associated data</li>
              </ul>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingAccount}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeletingAccount ? "Deleting..." : "Yes, delete my account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
