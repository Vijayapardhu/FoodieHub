"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"
import toast from "react-hot-toast"
import { Button, type ButtonProps } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function LogoutButton(props: ButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        toast.error(error.message || "Could not log out")
        setLoading(false)
        return
      }

      // Hard navigation so cached server components and the cart chrome reset.
      window.location.href = "/login"
    } catch (error: any) {
      toast.error(error?.message || "Could not log out")
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleLogout} loading={loading} {...props}>
      {loading ? null : <LogOut className="h-4 w-4" />}
      {loading ? "Logging out…" : "Log out"}
    </Button>
  )
}
