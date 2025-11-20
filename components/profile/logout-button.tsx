"use client"

import { Button, type ButtonProps } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { LogOut } from "lucide-react"
import toast from "react-hot-toast"

export function LogoutButton(props: ButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        toast.error(error.message || "Failed to logout")
        return
      }

      // Use window.location for a hard redirect to ensure all state is cleared
      window.location.href = "/login"
    } catch (error: any) {
      toast.error(error.message || "Failed to logout")
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleLogout} disabled={loading} {...props}>
      <LogOut className="h-4 w-4" />
      {loading ? "Logging out..." : "Logout"}
    </Button>
  )
}

