"use client"

import { useEffect, useState } from "react"
import { Check, List } from "@/components/ui/icons"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils/cn"

export interface MenuSection {
  id: string
  name: string
  count: number
}

/**
 * Jumping between menu sections without leaving the menu.
 *
 * A long canteen menu is the one screen where scrolling genuinely fails: the
 * dish you want is four categories down and you have no idea how far. The
 * usual fix is a filter that hides everything else, which answers "show me
 * only snacks" — a different question from "take me to snacks".
 *
 * A sheet rather than a dropdown because it is reachable by thumb on a phone,
 * and it can afford to show how many dishes are in each section.
 */
export function MenuCategorySheet({ sections }: { sections: MenuSection[] }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<string | null>(null)

  // Track which section is on screen so the sheet opens on where you already
  // are, rather than at the top of a list you have scrolled past.
  useEffect(() => {
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActive(visible.target.id.replace("section-", ""))
      },
      // Bias towards the top of the viewport: the heading you are reading
      // under is the section you are in.
      { rootMargin: "-40% 0px -55% 0px" }
    )

    for (const section of sections) {
      const node = document.getElementById(`section-${section.id}`)
      if (node) observer.observe(node)
    }
    return () => observer.disconnect()
  }, [sections])

  if (sections.length < 2) return null

  const activeName =
    sections.find((section) => section.id === active)?.name ?? "Menu"

  const jump = (id: string) => {
    setOpen(false)
    // Let the sheet's close animation start before scrolling, or the two
    // movements fight each other.
    window.setTimeout(() => {
      document
        .getElementById(`section-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 120)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex min-h-touch shrink-0 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground"
        aria-haspopup="dialog"
      >
        <List className="h-4 w-4" />
        <span className="max-w-24 truncate">{activeName}</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[70dvh]">
          <SheetHeader className="pr-12">
            <SheetTitle>Jump to</SheetTitle>
          </SheetHeader>

          <SheetBody className="pb-6">
            <ul className="space-y-1">
              {sections.map((section) => {
                const current = section.id === active
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => jump(section.id)}
                      className={cn(
                        "flex min-h-touch w-full items-center gap-3 rounded-xl px-3 text-left transition-colors",
                        current
                          ? "bg-primary-soft text-primary"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                        {section.name}
                      </span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {section.count}
                      </span>
                      {current ? (
                        <Check className="h-4 w-4 shrink-0" />
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </>
  )
}
