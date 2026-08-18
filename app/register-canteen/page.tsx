import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeft,
  BarChart3,
  TicketPercent,
  QrCode,
  Store,
  Utensils,
} from "@/components/ui/icons"
import { Logo } from "@/components/brand/logo"
import { CanteenApplicationForm } from "@/components/marketing/canteen-application-form"

export const metadata: Metadata = {
  title: "Put your canteen on FoodieHub",
  description:
    "Take orders ahead at Aditya University, Surampalem. No commission, nothing to install. Apply in a minute.",
  alternates: { canonical: "/register-canteen" },
}

const benefits = [
  {
    icon: Store,
    title: "A live order queue",
    body: "Orders appear the second they are placed, oldest first, on any phone or tablet. One tap moves an order along.",
  },
  {
    icon: QrCode,
    title: "Token collection",
    body: "Scan the student's code or type it in to pull up the order, take payment and work out the change.",
  },
  {
    icon: Utensils,
    title: "Your menu, your prices",
    body: "Photos, per-day opening hours, and one tap to mark a dish sold out when you run out mid-rush.",
  },
  {
    icon: BarChart3,
    title: "Sales you can check",
    body: "Revenue, best sellers, busiest hours, and a cash-up figure to count the drawer against. Exports to CSV.",
  },
  {
    icon: TicketPercent,
    title: "Offers when you want them",
    body: "Percentage or flat discounts with a minimum spend and a cap. Pause and resume without deleting.",
  },
]

export default function RegisterCanteenPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="app-container-wide flex h-16 items-center justify-between">
          <Logo markClassName="h-8 w-8" wordClassName="text-[0.95rem]" className="gap-2.5" />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
      </header>

      <main id="main" className="app-container-wide py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-[-0.03em] text-foreground sm:text-4xl">
              Put your canteen on FoodieHub
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Orders arrive before the crowd does, so prep starts earlier and
              the counter stops being the bottleneck. You keep taking payment
              exactly as you do now.
            </p>

            <p className="mt-4 rounded-2xl border border-primary/25 bg-primary-soft p-4 text-sm text-foreground">
              <strong>FoodieHub takes no commission.</strong> Delivery
              platforms take 20–30% — on a ₹40 plate that is the whole margin.
              Here you keep every rupee you take at the counter.
            </p>

            <ul className="mt-8 space-y-5">
              {benefits.map((benefit) => {
                const Icon = benefit.icon
                return (
                  <li key={benefit.title} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold text-foreground">
                        {benefit.title}
                      </span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                        {benefit.body}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
              <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
                Apply
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                An administrator approves new canteens before students see
                them, so we&apos;ll speak to you first.
              </p>

              <div className="mt-5">
                <CanteenApplicationForm />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
