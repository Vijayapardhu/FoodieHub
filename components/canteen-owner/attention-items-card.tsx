import Image from "next/image"
import Link from "next/link"
import { CheckCircle2, TriangleAlert } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ownerItemEditPath } from "@/lib/utils/public-id"
import { ImagePlaceholder } from "@/components/ui/image-placeholder"

interface AttentionItemsCardProps {
  items: {
    id: string
    name: string
    imageUrl: string | null
    price: number | null
  }[]
}

export function AttentionItemsCard({ items }: AttentionItemsCardProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Hidden from customers</CardTitle>
        {items.length > 0 ? (
          <TriangleAlert className="h-4 w-4 text-warning" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-success" />
        )}
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <p className="rounded-xl bg-success-soft p-3 text-sm text-success">
            Every dish is live right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-border p-2.5"
              >
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    <ImagePlaceholder type="item" size="sm" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-foreground">
                    {item.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Marked unavailable
                  </span>
                </span>

                <Button size="sm" variant="outline" asChild>
                  <Link href={ownerItemEditPath(item)}>Edit</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
