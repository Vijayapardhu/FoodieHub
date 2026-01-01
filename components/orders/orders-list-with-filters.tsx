"use client"

import { OrderCard } from "./order-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Database } from "@/types/database.types"
import { useMemo, useState } from "react"
import { Search, Filter, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  canteens: { name: string } | null
}

interface OrdersListWithFiltersProps {
  activeOrders: Order[]
  pastOrders: Order[]
  showGlobalPlaceholder: boolean
}

export function OrdersListWithFilters({
  activeOrders,
  pastOrders,
  showGlobalPlaceholder,
}: OrdersListWithFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCanteen, setSelectedCanteen] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  const uniqueCanteens = useMemo(() => {
    const canteens = new Set<string>()
    activeOrders.forEach((o) => o.canteens?.name && canteens.add(o.canteens.name))
    pastOrders.forEach((o) => o.canteens?.name && canteens.add(o.canteens.name))
    return Array.from(canteens)
  }, [activeOrders, pastOrders])

  const filteredActiveOrders = useMemo(() => {
    let filtered = activeOrders

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.token.toLowerCase().includes(query) ||
          order.canteens?.name?.toLowerCase().includes(query)
      )
    }

    if (selectedCanteen) {
      filtered = filtered.filter((order) => order.canteens?.name === selectedCanteen)
    }

    if (selectedStatus) {
      filtered = filtered.filter((order) => order.status === selectedStatus)
    }

    return filtered
  }, [activeOrders, searchQuery, selectedCanteen, selectedStatus])

  const filteredPastOrders = useMemo(() => {
    let filtered = pastOrders

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.token.toLowerCase().includes(query) ||
          order.canteens?.name?.toLowerCase().includes(query)
      )
    }

    if (selectedCanteen) {
      filtered = filtered.filter((order) => order.canteens?.name === selectedCanteen)
    }

    if (selectedStatus) {
      filtered = filtered.filter((order) => order.status === selectedStatus)
    }

    return filtered
  }, [pastOrders, searchQuery, selectedCanteen, selectedStatus])

  const hasActiveFilters = searchQuery.trim() || selectedCanteen || selectedStatus

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCanteen(null)
    setSelectedStatus(null)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {(activeOrders.length > 0 || pastOrders.length > 0) && (
        <div className="space-y-3 rounded-2xl border bg-white/80 p-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters</span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by token or canteen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-full border-2 border-gray-200 pl-10 pr-4 focus:border-primary"
              />
            </div>
            <select
              value={selectedCanteen || ""}
              onChange={(e) => setSelectedCanteen(e.target.value || null)}
              className="h-10 rounded-full border-2 border-gray-200 bg-white px-4 text-sm font-medium focus:border-primary focus:outline-none"
              aria-label="Filter by canteen"
              title="Filter by canteen"
            >
              <option value="">All Canteens</option>
              {uniqueCanteens.map((canteen) => (
                <option key={canteen} value={canteen}>
                  {canteen}
                </option>
              ))}
            </select>
            <select
              value={selectedStatus || ""}
              onChange={(e) => setSelectedStatus(e.target.value || null)}
              className="h-10 rounded-full border-2 border-gray-200 bg-white px-4 text-sm font-medium focus:border-primary focus:outline-none"
              aria-label="Filter by status"
              title="Filter by status"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="h-10 rounded-full gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      <Tabs defaultValue="active" className="space-y-5">
        <TabsList className="grid w-full grid-cols-2 rounded-full bg-white p-1 shadow-sm">
          <TabsTrigger
            value="active"
            className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            Active ({filteredActiveOrders.length})
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white"
          >
            Past ({filteredPastOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {filteredActiveOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
          {!showGlobalPlaceholder && filteredActiveOrders.length === 0 && hasActiveFilters && (
            <div className="rounded-2xl border border-dashed border-orange-200 bg-white/80 p-6 text-center">
              <p className="text-lg font-semibold text-foreground">No orders found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters to see more results.
              </p>
            </div>
          )}
          {!showGlobalPlaceholder && filteredActiveOrders.length === 0 && !hasActiveFilters && (
            <div className="rounded-2xl border border-dashed border-orange-200 bg-white/80 p-6 text-center">
              <p className="text-lg font-semibold text-foreground">Nothing cooking yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Place an order to track your token in real-time.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {filteredPastOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
          {filteredPastOrders.length === 0 && hasActiveFilters && (
            <div className="rounded-2xl border border-dashed border-orange-200 bg-white/80 p-6 text-center">
              <p className="text-lg font-semibold text-foreground">No orders found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try adjusting your filters to see more results.
              </p>
            </div>
          )}
          {filteredPastOrders.length === 0 && !hasActiveFilters && (
            <div className="rounded-2xl border border-dashed border-orange-200 bg-white/80 p-6 text-center">
              <p className="text-lg font-semibold text-foreground">No past orders</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Finish a meal and share your feedback to help canteens improve.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}


