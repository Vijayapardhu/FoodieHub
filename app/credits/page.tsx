import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import credits from "@/public/seed/credits.json"
import { Logo } from "@/components/brand/logo"

export const metadata: Metadata = {
  title: "Photo credits",
  description:
    "Attribution for the demo photographs used on FoodieHub's menu listings.",
  // Not something to index — it exists to satisfy a licence, not to rank.
  robots: { index: false, follow: true },
}

type Credit = {
  slug: string
  file: string
  page: string
  artist: string
  licence: string
  needsCredit?: boolean
}

const ALL = credits as Credit[]

export default function CreditsPage() {
  // CC-BY and CC-BY-SA oblige us to name the author; CC0 and public-domain
  // files don't, so they're listed separately rather than padding the table.
  const attributed = ALL.filter((c) => c.needsCredit)
  const free = ALL.filter((c) => !c.needsCredit)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/85 pt-safe backdrop-blur-md">
        <div className="app-container flex h-16 items-center justify-between">
          <Link href="/" aria-label="FoodieHub home">
            <Logo markClassName="h-8 w-8" wordClassName="text-[0.95rem]" />
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to site
          </Link>
        </div>
      </header>

      <main id="main" className="app-container py-16 sm:py-24">
        <h1 className="font-display text-3xl font-bold tracking-[-0.025em] text-foreground sm:text-4xl">
          Photo credits
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground">
          The dish and canteen photographs on FoodieHub are placeholders from{" "}
          <a
            href="https://commons.wikimedia.org"
            className="font-medium text-primary underline underline-offset-4"
            rel="noreferrer"
          >
            Wikimedia Commons
          </a>
          , used while the canteens photograph their own menus. The ones below
          are licensed on condition that their author is credited, so they are
          credited here.
        </p>

        <section className="mt-14">
          <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
            Attribution required
          </h2>
          <ul className="mt-6 divide-y divide-border border-y border-border">
            {attributed.map((credit) => (
              <li key={credit.slug} className="flex items-center gap-4 py-4">
                <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted">
                  <Image
                    src={`/seed/${credit.file}`}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {credit.artist}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {credit.licence}
                  </span>
                </span>
                <a
                  href={credit.page}
                  rel="noreferrer"
                  className="shrink-0 text-sm font-medium text-primary underline underline-offset-4"
                >
                  Source
                </a>
              </li>
            ))}
          </ul>
        </section>

        {free.length > 0 ? (
          <section className="mt-14">
            <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
              No attribution required
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {free.length} of the {ALL.length} photographs are public domain or
              CC0. Their source pages are listed for completeness.
            </p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
              {free.map((credit) => (
                <li key={credit.slug} className="text-sm">
                  <a
                    href={credit.page}
                    rel="noreferrer"
                    className="text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
                  >
                    {credit.slug}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  )
}
