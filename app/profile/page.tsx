"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Save, User, Phone, Mail, ArrowLeft } from "lucide-react"

export default function ProfilePage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [fullName, setFullName] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [email, setEmail] = useState("")
    const [userId, setUserId] = useState("")
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser()

            if (!user) {
                router.push("/login")
                return
            }

            setUserId(user.id)
            setEmail(user.email || "")

            const { data: profile, error } = await supabase
                .from("users")
                .select("full_name, phone_number")
                .eq("id", user.id)
                .single()

            if (error) {
                console.error("Error fetching profile:", error)
                toast.error("Failed to load profile")
            } else if (profile) {
                setFullName(profile.full_name || "")
                setPhoneNumber(profile.phone_number || "")
            }

            setLoading(false)
        }

        fetchProfile()
    }, [router, supabase])

    const handleSave = async () => {
        if (!fullName.trim()) {
            toast.error("Full name is required")
            return
        }

        if (!phoneNumber.trim()) {
            toast.error("Phone number is required")
            return
        }

        setSaving(true)

        try {
            const { error } = await supabase
                .from("users")
                .update({
                    full_name: fullName,
                    phone_number: phoneNumber,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", userId)

            if (error) throw error

            toast.success("Profile updated successfully")
            router.refresh()
        } catch (error) {
            console.error("Error updating profile:", error)
            toast.error("Failed to update profile")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto space-y-6">
                <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent" onClick={() => router.push("/home")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Home
                </Button>

                <Card className="shadow-lg border-0">
                    <CardHeader className="bg-white rounded-t-lg border-b pb-6">
                        <CardTitle className="text-2xl font-bold text-gray-900 text-center">Edit Profile</CardTitle>
                        <CardDescription className="text-center text-gray-500">
                            Update your personal information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-400" />
                                Email Address
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                disabled
                                className="bg-gray-50 text-gray-500 border-gray-200"
                            />
                            <p className="text-xs text-gray-400">Email cannot be changed</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                Full Name
                            </Label>
                            <Input
                                id="fullName"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="border-gray-200 focus:ring-primary focus:border-primary transition-all duration-200"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Phone className="h-4 w-4 text-primary" />
                                Phone Number
                            </Label>
                            <Input
                                id="phone"
                                placeholder="Enter your phone number"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="border-gray-200 focus:ring-primary focus:border-primary transition-all duration-200"
                            />
                        </div>

                    </CardContent>
                    <CardFooter className="pt-2 pb-6">
                        <Button
                            className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium shadow-md transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving Changes...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
