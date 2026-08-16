import Link from "next/link"
import { ArrowLeft } from "@/components/ui/icons"
import { Logo } from "@/components/brand/logo"

/**
 * Shared chrome for the pages nobody reads until something goes wrong, at
 * which point they matter enormously. Deliberately plain: no marketing, no
 * illustrations, generous line height, and a stated date so a reader can tell
 * whether they are looking at the version they agreed to.
 */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string
  updated: string
  intro?: string
  children: React.ReactNode
}) {
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

      <main id="main" className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.025em] text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated {updated}
        </p>

        {intro ? (
          <p className="mt-6 text-base leading-relaxed text-foreground">
            {intro}
          </p>
        ) : null}

        <div className="mt-10 space-y-8">{children}</div>

        <footer className="mt-16 border-t border-border pt-6">
          <p className="text-xs text-muted-foreground">
            Questions about this page? Contact the FoodieHub team through your
            canteen or at the address listed above.
          </p>
        </footer>
      </main>
    </div>
  )
}

/** One section of a legal document. */
export function LegalSection({
  heading,
  children,
}: {
  heading: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-lg font-bold tracking-tight text-foreground">
        {heading}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-4 [&_li]:list-disc [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  )
}
