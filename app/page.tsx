import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { LandingPage } from "@/components/marketing/landing-page"
import { StructuredData } from "@/components/marketing/structured-data"

// This is the page that gets shared in WhatsApp groups and printed on posters,
// so it carries the link-preview metadata rather than inheriting the app's.
export const metadata: Metadata = {
  title: "Canteen ordering at Aditya University, Surampalem",
  description:
    "Order from any canteen at Aditya University, Surampalem on your phone. Get a pickup token, collect without queuing, and pay at the counter — same price, no delivery fee.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Never queue at the Aditya University canteen again",
    description:
      "Order ahead from the canteens at Aditya University, Surampalem. Show your token, collect. Pay at the counter — same price, no queue.",
    type: "website",
    siteName: "FoodieHub",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "FoodieHub — order campus food ahead, skip the queue",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Never queue at the canteen again",
    description:
      "Order ahead from campus canteens, show your token, collect.",
    images: ["/og.png"],
  },
}

async function landingPathFor(userId: string) {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle()

  if (profile?.role === "admin") return "/admin"

  if (profile?.role === "canteen_owner") {
    const { data: canteen } = await supabase
      .from("canteens")
      .select("id")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle()
    return canteen ? "/canteen" : "/canteen/register"
  }

  return "/home"
}

export default async function RootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Signed in? Skip the pitch and go to their app.
  if (user) {
    redirect(await landingPathFor(user.id))
  }

  // Everything below is readable by the anon role, so this renders for
  // strangers and is indexable.
  const [
    { data: canteens },
    { data: popularItems },
    { data: offers },
    { count: dishCount },
  ] = await Promise.all([
    supabase
      .from("canteens")
      .select("*")
      .eq("is_approved", true)
      .order("rating", { ascending: false })
      .limit(6),
    supabase
      .from("items")
      .select("*, canteens(name)")
      .eq("is_available", true)
      .order("rating", { ascending: false })
      .limit(8),
    supabase
      .from("offers")
      .select("*, canteens(name)")
      .eq("is_active", true)
      .eq("is_approved", true)
      .gte("valid_until", new Date().toISOString())
      .limit(4),
    supabase
      .from("items")
      .select("*", { head: true, count: "exact" })
      .eq("is_available", true),
  ])

  const canteenList = canteens ?? []

  return (
    <>
      <StructuredData
        canteenCount={canteenList.length}
        dishCount={dishCount ?? 0}
      />
      <LandingPage
        canteens={canteenList}
        popularItems={(popularItems ?? []) as any}
        offers={(offers ?? []) as any}
        stats={{
          dishes: dishCount ?? 0,
          canteens: canteenList.length,
          openNow: canteenList.filter((c) => c.is_open).length,
        }}
      />
    </>
  )
}
