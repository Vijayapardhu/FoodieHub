import Link from "next/link"
import { Compass } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Compass className="h-7 w-7" />
      </span>

      <div className="space-y-2">
        <p className="text-sm font-bold uppercase tracking-wider text-primary">
          404
        </p>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          We can&apos;t find that page
        </h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground text-balance">
          The dish, canteen or order you were after may have been removed.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2">
        <Button size="lg" block asChild>
          <Link href="/home">Browse canteens</Link>
        </Button>
        <Button size="lg" variant="outline" block asChild>
          <Link href="/orders">Your orders</Link>
        </Button>
      </div>
    </main>
  )
}
