import Link from "next/link"
import Image from "next/image"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  ChefHatIcon,
  Clock01Icon,
  Coupon01Icon,
  Dish01Icon,
  InvoiceIcon,
  Notification01Icon,
  QrCode01Icon,
  Rocket01Icon,
  Search01Icon,
  ShieldKeyIcon,
  StarIcon,
  Store01Icon,
  Tick02Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons"
import { Database } from "@/types/database.types"
import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/ui/reveal"
import { VegMark } from "@/components/ui/status-badge"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"

type Canteen = Database["public"]["Tables"]["canteens"]["Row"]
type Item = Database["public"]["Tables"]["items"]["Row"] & {
  canteens: { name: string } | null
}
type Offer = Database["public"]["Tables"]["offers"]["Row"] & {
  canteens: { name: string } | null
}

interface LandingPageProps {
  canteens: Canteen[]
  popularItems: Item[]
  offers: Offer[]
  stats: { dishes: number; canteens: number; openNow: number }
}

const navLinks = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#canteens", label: "For canteens" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
]

const steps = [
  {
    icon: Search01Icon,
    title: "Find something to eat",
    body: "Search every canteen at once, or filter by category, price, rating and pure-veg. Sold-out dishes are hidden, so what you see is what exists.",
    kitchen: "Owners toggle availability from their phone the moment a tray empties.",
  },
  {
    icon: Dish01Icon,
    title: "Build the order",
    body: "Add items, adjust quantities, apply an offer, and leave notes — less spicy, pack the chutney separately, no onion.",
    kitchen: "Notes and dietary flags sit on the order card, not buried in a detail screen.",
  },
  {
    icon: Clock01Icon,
    title: "Choose when to collect",
    body: "Now, or scheduled up to a week ahead. Pin it to the lunch bell and the kitchen paces its prep around your slot.",
    kitchen: "The queue sorts oldest first, so nobody is skipped for ordering quietly.",
  },
  {
    icon: QrCode01Icon,
    title: "Collect with a token",
    body: "You get a six-character code and a QR. Status moves from placed to confirmed to cooking to ready, with a notification at each step.",
    kitchen: "Staff scan the QR or type the code, see the bill, and enter cash received for automatic change.",
  },
]

const featureGroups = [
  {
    label: "Ordering",
    icon: Dish01Icon,
    items: [
      "Search every canteen's menu from one box",
      "Filter by category, price, rating, pure-veg and open-now",
      "Veg and non-veg marks on every dish",
      "Cart splits automatically across two canteens",
      "Suggested add-ons at checkout",
      "Special instructions and dietary notes per order",
    ],
  },
  {
    label: "After you order",
    icon: Notification01Icon,
    items: [
      "Live status, pushed as the kitchen changes it",
      "Pickup token as a code and a scannable QR",
      "Share your token straight to WhatsApp",
      "Cancel while still pending or confirmed",
      "Printable and downloadable bill",
      "Rate the order and add photos once collected",
    ],
  },
  {
    label: "Money and habits",
    icon: Wallet01Icon,
    items: [
      "Offers applied automatically when they win",
      "Loyalty points per canteen, bronze to platinum",
      "One-tap reorder of your last order",
      "Save a cart as a named usual",
      "Favourites for dishes and canteens",
      "Lifetime spend and order count on your profile",
    ],
  },
  {
    label: "Your account",
    icon: ShieldKeyIcon,
    items: [
      "Email or Google sign-in",
      "Allergies and dietary preferences saved once",
      "Warnings when an order clashes with them",
      "Light, dark and system themes",
      "Installs to your home screen as an app",
      "Shows your saved token even offline",
    ],
  },
]

const canteenFeatures = [
  {
    icon: Rocket01Icon,
    title: "A live queue",
    body: "Orders appear the second they are placed, oldest first, on any phone or tablet. One tap moves an order to the next state.",
  },
  {
    icon: QrCode01Icon,
    title: "Token scanning",
    body: "Scan the student's QR or type the six-character code to pull up the order, take payment and calculate change.",
  },
  {
    icon: InvoiceIcon,
    title: "Sales analytics",
    body: "Revenue, average ticket, best sellers and busiest hours over 7, 14 or 30 days. Export orders or item sales to CSV.",
  },
  {
    icon: Store01Icon,
    title: "Menu control",
    body: "Add dishes with photos, set per-day opening hours, and select several items to hide or delete at once.",
  },
  {
    icon: Coupon01Icon,
    title: "Offers",
    body: "Percentage or flat discounts, with minimum spend and a cap. Pause and resume without deleting.",
  },
  {
    icon: StarIcon,
    title: "Reviews",
    body: "Reply publicly to feedback. Filter to the ones unanswered or rated two stars and below.",
  },
]

const comparison = [
  { row: "Time spent waiting", queue: "The whole break", delivery: "30–45 minutes", hub: "Walk up and collect" },
  { row: "Extra fees", queue: "None", delivery: "Delivery, platform, surge", hub: "None" },
  { row: "Pay online", queue: "No", delivery: "Required", hub: "No — at the counter" },
  { row: "Know what is sold out", queue: "Only at the front", delivery: "Sometimes", hub: "Before you order" },
  { row: "Order between lectures", queue: "No", delivery: "Yes", hub: "Yes" },
  { row: "Money goes to", queue: "The canteen", delivery: "Split with the platform", hub: "The canteen" },
]

const faqs = [
  {
    q: "Does it cost more than ordering at the counter?",
    a: "No. You pay exactly what is on the menu board. There is no service fee, no convenience fee and no delivery charge, because there is no delivery.",
  },
  {
    q: "Do I have to pay online?",
    a: "No. You pay the canteen when you collect, the same way you already do. FoodieHub does not process payments and never holds your money.",
  },
  {
    q: "What if I do not turn up?",
    a: "Nothing is charged, because nothing was paid. It does waste food, so canteens can see your order history.",
  },
  {
    q: "Can I cancel an order?",
    a: "Yes, while it is still pending or confirmed. Once it moves to preparing the ingredients are committed, so cancellation closes. Call the canteen instead.",
  },
  {
    q: "How far ahead can I schedule?",
    a: "Up to a week. Pick a date and time, or use the quick options for one, two or three hours from now.",
  },
  {
    q: "What if the canteen closes while I am ordering?",
    a: "A closed canteen still shows its menu, but checkout is disabled. Individual dishes disappear as soon as they are marked unavailable.",
  },
  {
    q: "Which canteens are on it?",
    a: "The ones listed above. Any canteen on campus can register and publish a menu, and an administrator approves it before students see it.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. It runs in the browser. You can add it to your home screen if you want it to open like an app.",
  },
]

const trustPoints = [
  "No service or convenience fee",
  "No commission from canteens",
  "No online payment, ever",
  "Prices set by the canteen",
]

/**
 * Numbered section eyebrow. On a page this long the numbering is doing real
 * work — it tells a reader how far through they are, and it gives the extra
 * whitespace between sections a reason to be there.
 */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
      <span className="h-px w-7 bg-primary/40" />
      {children}
    </p>
  )
}

export function LandingPage({
  canteens,
  popularItems,
  offers,
  stats,
}: LandingPageProps) {
  const liveOffer = offers[0]
  const photographed = popularItems.filter((item) => item.image_url)

  return (
    <div className="min-h-screen bg-background">
      {/* ---------------------------------------------------------------- */}
      {/* Navigation                                                        */}
      {/* ---------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 pt-safe backdrop-blur-md">
        <div className="app-container-wide flex h-16 items-center justify-between">
          <Logo markClassName="h-8 w-8" wordClassName="text-[0.95rem]" className="gap-2.5" />

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Sections">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block sm:px-3"
            >
              Sign in
            </Link>
            <Button size="sm" asChild>
              <Link href="/login">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="main">
        {/* -------------------------------------------------------------- */}
        {/* Hero                                                            */}
        {/* -------------------------------------------------------------- */}
        <section className="app-container-wide pt-20 pb-24 sm:pt-28 sm:pb-36">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
                {stats.openNow > 0
                  ? `${stats.openNow} of ${stats.canteens} canteens serving right now`
                  : `${stats.canteens} canteens on campus`}
              </p>
            </Reveal>

            <Reveal delay={70}>
              <h1 className="mt-6 font-display text-[2.5rem] font-extrabold leading-[1.05] tracking-[-0.035em] text-foreground sm:text-6xl">
                Order campus food ahead,
                <br className="hidden sm:block" />{" "}
                <span className="text-primary">skip the queue</span>
              </h1>
              <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Aditya University · Surampalem
              </p>
            </Reveal>

            <Reveal delay={140}>
              <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                FoodieHub is the ordering system for the canteens at Aditya
                University, Surampalem. Order between lectures, collect with a
                token, and pay at the counter exactly as you do today.
              </p>
            </Reveal>

            <Reveal delay={210}>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" asChild className="w-full sm:w-auto sm:px-7">
                  <Link href="/login">
                    Start ordering
                    <HugeiconsIcon icon={ArrowRight01Icon} size={18} strokeWidth={2.2} />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto sm:px-7">
                  <a href="#how">See how it works</a>
                </Button>
              </div>
            </Reveal>

            {/* Trust, stated immediately rather than buried in pricing */}
            <Reveal delay={280}>
              {/* Grid rather than a wrapping flex row: four items of unequal
                  width wrap 3-then-1 and look accidental. */}
              <ul className="mx-auto mt-10 grid max-w-[17rem] gap-y-2.5 text-left sm:max-w-2xl sm:grid-cols-2 lg:flex lg:max-w-none lg:justify-center lg:gap-x-8">
                {trustPoints.map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground lg:whitespace-nowrap"
                  >
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      size={14}
                      strokeWidth={2.5}
                      className="text-primary"
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Numbers                                                         */}
        {/* -------------------------------------------------------------- */}
        <section className="border-y border-border bg-surface-muted">
          <div className="app-container-wide">
            <dl className="grid grid-cols-3 divide-x divide-border">
              {[
                { label: "Dishes listed", value: stats.dishes },
                { label: "Canteens", value: stats.canteens },
                { label: "Serving now", value: stats.openNow },
              ].map((stat, index) => (
                <Reveal key={stat.label} delay={index * 70} className="px-4 py-8 text-center">
                  <dd className="font-display text-3xl font-extrabold tabular-nums text-foreground sm:text-4xl">
                    {stat.value}
                  </dd>
                  <dt className="mt-1 text-xs text-muted-foreground sm:text-sm">
                    {stat.label}
                  </dt>
                </Reveal>
              ))}
            </dl>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Problem                                                         */}
        {/* -------------------------------------------------------------- */}
        <section className="app-container-wide py-24 sm:py-36">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-20">
            <Reveal>
              <SectionLabel>01 · The problem</SectionLabel>
              <h2 className="font-display text-3xl font-bold tracking-[-0.025em] text-foreground sm:text-4xl">
                The break is short. The queue is not.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                Everybody on campus is free at the same time, so everybody
                arrives at the counter at the same time. The kitchen can cook
                far more food than it can take orders for — the bottleneck is
                the counter, not the stove.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Ordering ahead moves the decision off the counter and spreads
                the kitchen&apos;s work across the morning instead of fifteen
                frantic minutes.
              </p>
            </Reveal>

            <Reveal delay={100}>
              <div className="rounded-xl border border-border bg-surface-muted p-8">
                <p className="text-sm font-semibold text-foreground">
                  Worth doing the arithmetic
                </p>
                <ul className="mt-6 space-y-5">
                  {[
                    { n: "12 min", t: "a realistic queue at peak" },
                    { n: "× 2", t: "meals on a normal campus day" },
                    { n: "× 5", t: "days a week" },
                    { n: "≈ 2 hrs", t: "every week, spent standing in line" },
                  ].map((row) => (
                    <li key={row.n} className="flex items-baseline gap-5">
                      <span className="w-16 shrink-0 font-display text-lg font-bold tabular-nums text-primary">
                        {row.n}
                      </span>
                      <span className="text-sm text-muted-foreground">{row.t}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
                  Your numbers will differ, and that is the point — multiply
                  your own queue by your own week.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* How it works                                                    */}
        {/* -------------------------------------------------------------- */}
        <section id="how" className="scroll-mt-20 border-y border-border bg-surface-muted py-24 sm:py-36">
          <div className="app-container-wide">
            <Reveal className="max-w-2xl">
              <SectionLabel>02 · The flow</SectionLabel>
              <h2 className="font-display text-3xl font-bold tracking-[-0.025em] text-foreground sm:text-4xl">
                How it works
              </h2>
              <p className="mt-4 text-base text-muted-foreground">
                Four steps for you, and what happens on the kitchen side of
                each one.
              </p>
            </Reveal>

            <ol className="mt-14 sm:mt-16 overflow-hidden rounded-xl border border-border bg-background">
              {steps.map((step, index) => (
                <Reveal
                  as="li"
                  key={step.title}
                  delay={index * 60}
                  className={index > 0 ? "border-t border-border" : ""}
                >
                  <div className="grid gap-6 p-6 sm:grid-cols-[3rem_1fr_1fr] sm:gap-8 sm:p-8">
                    <div className="flex items-center gap-4 sm:block">
                      <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-surface-muted text-primary">
                        <HugeiconsIcon icon={step.icon} size={20} strokeWidth={2} />
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-muted-foreground sm:mt-3 sm:block">
                        0{index + 1}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {step.body}
                      </p>
                    </div>

                    <div className="border-t border-border pt-5 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
                      <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <HugeiconsIcon icon={ChefHatIcon} size={14} strokeWidth={2.2} />
                        In the kitchen
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {step.kitchen}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Features                                                        */}
        {/* -------------------------------------------------------------- */}
        <section id="features" className="scroll-mt-20 app-container-wide py-24 sm:py-36">
          <Reveal className="max-w-2xl">
            <SectionLabel>03 · Features</SectionLabel>
            <h2 className="font-display text-3xl font-bold tracking-[-0.025em] text-foreground sm:text-4xl">
              What the app does today
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              No roadmap items and no coming-soon. Everything listed here is
              built and working.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-x-12 gap-y-12 sm:grid-cols-2 sm:mt-16">
            {featureGroups.map((group, index) => (
              <Reveal key={group.label} delay={index * 70}>
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <HugeiconsIcon
                    icon={group.icon}
                    size={18}
                    strokeWidth={2}
                    className="text-primary"
                  />
                  <h3 className="font-display text-base font-bold tracking-tight text-foreground">
                    {group.label}
                  </h3>
                </div>

                <ul className="mt-5 space-y-3">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"
                    >
                      <HugeiconsIcon
                        icon={Tick02Icon}
                        size={16}
                        strokeWidth={2.4}
                        className="mt-0.5 shrink-0 text-primary"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Comparison                                                      */}
        {/* -------------------------------------------------------------- */}
        <section className="border-y border-border bg-surface-muted py-24 sm:py-36">
          <div className="app-container-wide">
            <Reveal className="max-w-2xl">
              <SectionLabel>04 · Compared</SectionLabel>
              <h2 className="font-display text-3xl font-bold tracking-[-0.025em] text-foreground sm:text-4xl">
                Compared with the alternatives
              </h2>
            </Reveal>

            {/* Phone: stacked cards. A horizontally scrolling table pushes the
                FoodieHub column — the whole point of the comparison — off the
                right edge, with no affordance that says to swipe. */}
            <ul className="mt-12 space-y-4 md:hidden">
              {comparison.map((row, index) => (
                <Reveal
                  as="li"
                  key={row.row}
                  delay={index * 40}
                  className="rounded-xl border border-border bg-background p-5"
                >
                  <p className="text-sm font-semibold text-foreground">{row.row}</p>
                  <dl className="mt-4 space-y-2.5 text-sm">
                    {[
                      { k: "Queuing", v: row.queue, own: false },
                      { k: "Delivery apps", v: row.delivery, own: false },
                      { k: "FoodieHub", v: row.hub, own: true },
                    ].map((cell) => (
                      <div
                        key={cell.k}
                        className={
                          cell.own
                            ? "flex justify-between gap-4 rounded-lg bg-primary-soft px-3 py-2"
                            : "flex justify-between gap-4 px-3"
                        }
                      >
                        <dt
                          className={
                            cell.own
                              ? "font-semibold text-primary"
                              : "text-muted-foreground"
                          }
                        >
                          {cell.k}
                        </dt>
                        <dd
                          className={
                            cell.own
                              ? "text-right font-medium text-foreground"
                              : "text-right text-muted-foreground"
                          }
                        >
                          {cell.v}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>
              ))}
            </ul>

            <Reveal delay={80} className="hidden md:block">
              <div className="mt-14 overflow-x-auto rounded-xl border border-border bg-background">
                <table className="w-full min-w-[40rem] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        &nbsp;
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Queuing
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Delivery apps
                      </th>
                      <th className="bg-primary-soft px-6 py-4 text-xs font-bold uppercase tracking-wider text-primary">
                        FoodieHub
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.map((row, index) => (
                      <tr
                        key={row.row}
                        className={index > 0 ? "border-t border-border" : ""}
                      >
                        <th
                          scope="row"
                          className="px-6 py-4 text-sm font-medium text-foreground"
                        >
                          {row.row}
                        </th>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {row.queue}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {row.delivery}
                        </td>
                        <td className="bg-primary-soft/60 px-6 py-4 text-sm font-medium text-foreground">
                          {row.hub}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Reveal>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Live menu                                                       */}
        {/* -------------------------------------------------------------- */}
        {popularItems.length > 0 ? (
          <section className="app-container-wide py-24 sm:py-36">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="max-w-xl">
                  <SectionLabel>05 · Live today</SectionLabel>
                  <h2 className="font-display text-3xl font-bold tracking-[-0.025em] text-foreground sm:text-4xl">
                    On the menu today
                  </h2>
                  <p className="mt-3 text-base text-muted-foreground">
                    Read live from campus kitchens each time this page loads.
                  </p>
                </div>
                {liveOffer ? (
                  <p className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-muted px-3.5 py-2 text-sm text-foreground">
                    <HugeiconsIcon
                      icon={Coupon01Icon}
                      size={16}
                      strokeWidth={2.2}
                      className="text-primary"
                    />
                    <span className="font-semibold">
                      {liveOffer.discount_type === "percentage"
                        ? `${liveOffer.discount_value}% off`
                        : `₹${liveOffer.discount_value} off`}
                    </span>
                    at {liveOffer.canteens?.name}
                  </p>
                ) : null}
              </div>
            </Reveal>

            {/* Every seeded dish now carries a photo, but a canteen that has
                not uploaded one yet still has to render — hence the
                per-item fallback rather than an all-or-nothing grid. */}
            <ul className="mt-14 grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
              {popularItems.slice(0, 8).map((item, index) => (
                <Reveal as="li" key={item.id} delay={index * 50} className="group">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-border bg-surface-muted">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 240px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <ImagePlaceholder label={item.name} size="lg" />
                    )}

                    <span className="absolute left-2.5 top-2.5 rounded-md bg-background/90 p-1 shadow-xs backdrop-blur-sm">
                      <VegMark vegetarian={item.is_vegetarian} />
                    </span>

                    {item.total_reviews > 0 ? (
                      <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-md bg-background/90 px-1.5 py-1 text-xs font-semibold text-foreground shadow-xs backdrop-blur-sm">
                        <HugeiconsIcon
                          icon={StarIcon}
                          size={12}
                          strokeWidth={2.6}
                          className="text-warning"
                        />
                        {item.rating.toFixed(1)}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-foreground">
                      {item.name}
                    </p>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      ₹{Number(item.price)}
                    </p>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {item.canteens?.name}
                  </p>
                </Reveal>
              ))}
            </ul>
          </section>
        ) : null}

        {/* -------------------------------------------------------------- */}
        {/* For canteens                                                    */}
        {/* -------------------------------------------------------------- */}
        <section id="canteens" className="scroll-mt-20 border-y border-border bg-surface-muted py-24 sm:py-36">
          <div className="app-container-wide">
            <Reveal className="max-w-2xl">
              <SectionLabel>06 · For canteens</SectionLabel>
              <h2 className="font-display text-3xl font-bold tracking-[-0.025em] text-foreground sm:text-4xl">
                For canteens
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                Orders arrive before the crowd does, so prep starts earlier and
                the counter stops being the bottleneck. You keep taking payment
                exactly as you do now, and FoodieHub takes no commission.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
              {canteenFeatures.map((feature, index) => (
                <Reveal key={feature.title} delay={index * 50}>
                  <div className="h-full rounded-xl border border-border bg-background p-6">
                    <HugeiconsIcon
                      icon={feature.icon}
                      size={20}
                      strokeWidth={2}
                      className="text-primary"
                    />
                    <h3 className="mt-4 font-display text-base font-bold tracking-tight text-foreground">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {feature.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={180}>
              <div className="mt-12 flex flex-wrap items-center gap-4">
                <Button size="lg" asChild>
                  <Link href="/login">Register a canteen</Link>
                </Button>
                <p className="text-sm text-muted-foreground">
                  An administrator approves new canteens before students see them.
                </p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Canteens on the platform                                        */}
        {/* -------------------------------------------------------------- */}
        {canteens.length > 0 ? (
          <section className="app-container-wide py-24 sm:py-32">
            <Reveal>
              <h2 className="font-display text-2xl font-bold tracking-[-0.02em] text-foreground sm:text-3xl">
                Already on FoodieHub
              </h2>
            </Reveal>

            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {canteens.map((canteen, index) => (
                <Reveal as="li" key={canteen.id} delay={index * 60}>
                  <div className="group h-full overflow-hidden rounded-xl border border-border bg-surface">
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-muted">
                      {canteen.banner_url || canteen.logo_url ? (
                        <Image
                          src={(canteen.banner_url ?? canteen.logo_url)!}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 380px"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      ) : (
                        <ImagePlaceholder label={canteen.name} size="lg" />
                      )}

                      <span
                        className={
                          canteen.is_open
                            ? "absolute right-3 top-3 rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-success-foreground shadow-xs"
                            : "absolute right-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-muted-foreground shadow-xs backdrop-blur-sm"
                        }
                      >
                        {canteen.is_open ? "Open now" : "Closed"}
                      </span>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="min-w-0 truncate font-display text-base font-bold tracking-tight text-foreground">
                          {canteen.name}
                        </h3>
                        {canteen.total_reviews > 0 ? (
                          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-foreground">
                            <HugeiconsIcon
                              icon={StarIcon}
                              size={13}
                              strokeWidth={2.6}
                              className="text-warning"
                            />
                            {Number(canteen.rating).toFixed(1)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {canteen.description || canteen.address || "Campus canteen"}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </ul>
          </section>
        ) : null}

        {/* -------------------------------------------------------------- */}
        {/* Pricing and data                                                */}
        {/* -------------------------------------------------------------- */}
        <section id="pricing" className="scroll-mt-20 border-y border-border bg-surface-muted py-24 sm:py-36">
          <div className="app-container-wide grid gap-12 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <SectionLabel>07 · Pricing</SectionLabel>
              <h2 className="font-display text-3xl font-bold tracking-[-0.025em] text-foreground sm:text-4xl">
                Free on both sides
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                There is no student fee and no canteen commission. FoodieHub is
                run for the campus, so the only money that moves is the money
                that already moved — from a student to a canteen, at a counter.
              </p>

              <ul className="mt-8 space-y-4">
                {trustPoints.map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-3 border-b border-border pb-4 text-sm text-foreground"
                  >
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      size={16}
                      strokeWidth={2.4}
                      className="mt-0.5 shrink-0 text-primary"
                    />
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={100}>
              <div className="rounded-xl border border-border bg-background p-8">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <HugeiconsIcon
                    icon={ShieldKeyIcon}
                    size={16}
                    strokeWidth={2.2}
                    className="text-primary"
                  />
                  Your data
                </p>

                <dl className="mt-6 space-y-6 text-sm">
                  <div>
                    <dt className="font-semibold text-foreground">We store</dt>
                    <dd className="mt-1.5 leading-relaxed text-muted-foreground">
                      Your name, email, phone number, your orders, and any
                      allergies you choose to save. Your phone number reaches a
                      canteen only while you have an active order with them.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground">We never store</dt>
                    <dd className="mt-1.5 leading-relaxed text-muted-foreground">
                      Card details, UPI IDs or bank information. There is
                      nothing to store, because payment happens at the counter.
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-foreground">Who sees what</dt>
                    <dd className="mt-1.5 leading-relaxed text-muted-foreground">
                      Access rules are enforced in the database itself, not only
                      in the app. A canteen sees its own orders; you see yours.
                    </dd>
                  </div>
                </dl>
              </div>
            </Reveal>
          </div>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* FAQ                                                             */}
        {/* -------------------------------------------------------------- */}
        <section id="faq" className="scroll-mt-20 app-container-wide py-24 sm:py-36">
          <Reveal className="max-w-2xl">
            <SectionLabel>08 · Questions</SectionLabel>
            <h2 className="font-display text-3xl font-bold tracking-[-0.025em] text-foreground sm:text-4xl">
              Frequently asked questions
            </h2>
          </Reveal>

          <dl className="mt-14 grid gap-x-16 sm:grid-cols-2">
            {faqs.map((faq, index) => (
              <Reveal
                key={faq.q}
                delay={index * 40}
                className="border-t border-border py-6"
              >
                <dt className="text-sm font-semibold text-foreground">{faq.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {faq.a}
                </dd>
              </Reveal>
            ))}
          </dl>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* Close                                                           */}
        {/* -------------------------------------------------------------- */}
        <section className="border-t border-border bg-surface-muted py-24 sm:py-32">
          <Reveal className="app-container-wide text-center">
            <h2 className="font-display text-3xl font-bold tracking-[-0.025em] text-foreground sm:text-4xl">
              Your next lunch, without the queue
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
              Free to use, and you pay the canteen exactly what you would have
              paid at the counter.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild className="w-full sm:w-auto sm:px-7">
                <Link href="/login">Create your account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto sm:px-7">
                <Link href="/login">Register a canteen</Link>
              </Button>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-border py-16">
        <div className="app-container-wide grid gap-10 sm:grid-cols-3">
          <div>
            <Logo markClassName="h-7 w-7" wordClassName="text-sm" className="gap-2.5" />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Canteen ordering for Aditya University, Surampalem. Pay at the
              counter, collect with a token.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Product</p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="transition-colors hover:text-foreground">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Get started</p>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li>
                <Link href="/login" className="transition-colors hover:text-foreground">
                  Student sign-in
                </Link>
              </li>
              <li>
                <Link href="/login" className="transition-colors hover:text-foreground">
                  Register a canteen
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="app-container-wide mt-10 border-t border-border pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              No service fee · No commission · No online payment
            </p>
            <Link
              href="/credits"
              className="text-xs text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
            >
              Photo credits
            </Link>
          </div>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Built and developed with{" "}
            <span aria-label="love" className="text-primary">
              &hearts;
            </span>{" "}
            by{" "}
            <a
              href="https://vijayaapardhu.dev"
              target="_blank"
              rel="noopener noreferrer author"
              className="font-semibold text-foreground underline underline-offset-4 transition-colors hover:text-primary"
            >
              Vijaya Pardhu
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}
