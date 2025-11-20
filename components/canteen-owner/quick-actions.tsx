import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Utensils, Gift } from "lucide-react"

interface QuickActionsProps {
  canteenId: string
}

export function QuickActions({ canteenId }: QuickActionsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Link href="/canteen/menu/new">
          <Button className="w-full justify-start" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add New Item
          </Button>
        </Link>
        <Link href="/canteen/menu">
          <Button className="w-full justify-start" variant="outline">
            <Utensils className="mr-2 h-4 w-4" />
            Manage Menu
          </Button>
        </Link>
        <Link href="/canteen/offers/new">
          <Button className="w-full justify-start" variant="outline">
            <Gift className="mr-2 h-4 w-4" />
            Create Offer
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

