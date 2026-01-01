"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Mail, Phone, User, Sparkles } from "lucide-react"

export default function CompleteProfilePage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const [formData, setFormData] = useState({
        email: "",
        fullName: "",
        phoneNumber: "",
    })

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    router.push("/login")
                    return
                }

                // Fetch existing profile data
                const { data: profile } = await supabase
                    .from("users")
                    .select("full_name, phone_number, role")
                    .eq("id", user.id)
                    .single()

                // If phone number exists, they don't need to be here
                if (profile?.phone_number) {
                    router.push(profile.role === 'admin' ? '/admin' : profile.role === 'canteen_owner' ? '/canteen' : '/')
                    return
                }

                setFormData({
                    email: user.email || "",
                    fullName: profile?.full_name || user.user_metadata?.full_name || "",
                    phoneNumber: "",
                })
            } catch (error) {
                console.error("Error fetching user:", error)
                toast.error("Failed to load profile")
            } finally {
                setLoading(false)
            }
        }

        fetchUser()
    }, [router, supabase])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.phoneNumber.length < 10) {
            toast.error("Please enter a valid phone number")
            return
        }

        try {
            setSaving(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) throw new Error("No user found")

            const { error } = await supabase
                .from("users")
                .update({
                    full_name: formData.fullName,
                    phone_number: formData.phoneNumber,
                })
                .eq("id", user.id)

            if (error) throw error

            toast.success("Profile updated successfully!")
            router.push("/")
            router.refresh()
        } catch (error: any) {
            console.error("Error updating profile:", error)
            toast.error(error.message || "Failed to update profile")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50/50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50/50 p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-orange-400 mb-4 shadow-lg">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                        Complete Your Profile
                    </h1>
                    <p className="text-muted-foreground">
                        We need a few more details to get you started
                    </p>
                </div>

                <Card className="border-0 shadow-xl shadow-orange-100/50">
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        value={formData.email}
                                        disabled
                                        className="pl-10 bg-muted/50"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="fullName">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="fullName"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        placeholder="John Doe"
                                        required
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        placeholder="+1234567890"
                                        required
                                        className="pl-10"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                disabled={saving}
                                className="w-full h-11 rounded-xl bg-gradient-to-r from-primary to-orange-400 hover:from-primary/90 hover:to-orange-400/90 text-white font-medium shadow-lg shadow-primary/25"
                            >
                                {saving ? "Saving..." : "Continue"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
