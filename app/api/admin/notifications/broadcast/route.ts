import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { audience, email, title, message, type } = body || {}

  if (!title || !message) {
    return NextResponse.json(
      { error: "Title and message are required" },
      { status: 400 }
    )
  }

  let userQuery = supabase.from("users").select("id")

  if (audience === "students") {
    userQuery = userQuery.eq("role", "student")
  } else if (audience === "canteen_owner") {
    userQuery = userQuery.eq("role", "canteen_owner")
  } else if (audience === "single") {
    if (!email) {
      return NextResponse.json(
        { error: "Email required for single audience" },
        { status: 400 }
      )
    }
    userQuery = userQuery.eq("email", email)
  }

  const { data: targets, error } = await userQuery.limit(1000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!targets || targets.length === 0) {
    return NextResponse.json(
      { error: "No recipients found" },
      { status: 404 }
    )
  }

  const insertPayload = targets.map((target) => ({
    user_id: target.id,
    title,
    message,
    type: type || "system",
  }))

  const { error: insertError } = await supabase
    .from("notifications")
    .insert(insertPayload)

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, count: insertPayload.length })
}

