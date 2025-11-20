import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AttentionItemsCardProps {
  items: { id: string; name: string; imageUrl: string | null; price: number | null }[]
}

export function AttentionItemsCard({ items }: AttentionItemsCardProps) {
  return (
    <Card className="border-destructive/10 bg-white">
      <CardHeader className="flex items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold text-destructive">
          Needs attention
        </CardTitle>
        <AlertTriangle className="h-4 w-4 text-destructive" />
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-orange-100 bg-orange-50/40 p-4 text-center text-sm text-muted-foreground">
            All items are live. Great job keeping the shelf stocked.
          </div>
        ) : (
          <>
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-orange-50 bg-orange-50/40 p-3"
              >
                <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-white">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xl">
                      🍽️
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Hidden from students · update availability
                  </p>
                </div>
                <Link href={`/canteen/menu/${item.id}/edit`}>
                  <Button size="sm" variant="outline" className="rounded-full">
                    Fix now
                  </Button>
                </Link>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  )
}


