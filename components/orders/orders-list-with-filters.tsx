"use client"

import { useMemo, useState } from "react"
import { Receipt, Search, X } from "@/components/ui/icons"
import { Database } from "@/types/database.types"
import { Input } from "@/components/ui/input"
import { Chip, ChipRail } from "@/components/ui/chip"
import { EmptyState } from "@/components/ui/empty-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OrderCard } from "./order-card"
import { ORDER_STATUS_META, type OrderStatus } from "@/lib/utils/order-status"
import { useDebounce } from "@/lib/hooks/use-debounce"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  canteens: { name: string } | null
}

interface OrdersListWithFiltersProps {
  activeOrders: Order[]
  pastOrders: Order[]
}

const activeStatuses: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
]
const pastStatuses: OrderStatus[] = ["completed", "cancelled"]

export function OrdersListWithFilters({
  activeOrders,
  pastOrders,
}: OrdersListWithFiltersProps) {
  const [rawQuery, setRawQuery] = useState("")
  const [canteen, setCanteen] = useState<string | null>(null)
  const [status, setStatus] = useState<OrderStatus | null>(null)
  const [tab, setTab] = useState<"active" | "past">(
    activeOrders.length > 0 ? "active" : "past"
  )

  const query = useDebounce(rawQuery, 180).trim().toLowerCase()

  const canteens = useMemo(() => {
    const names = new Set<string>()
    for (const order of [...activeOrders, ...pastOrders]) {
      if (order.canteens?.name) names.add(order.canteens.name)
    }
    return Array.from(names).sort()
  }, [activeOrders, pastOrders])

  const apply = (orders: Order[]) =>
    orders.filter((order) => {
      if (canteen && order.canteens?.name !== canteen) return false
      if (status && order.status !== status) return false
      if (
        query &&
        !order.token.toLowerCase().includes(query) &&
        !order.canteens?.name?.toLowerCase().includes(query)
      )
        return false
      return true
    })

  const filteredActive = useMemo(
    () => apply(activeOrders),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeOrders, query, canteen, status]
  )
  const filteredPast = useMemo(
    () => apply(pastOrders),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pastOrders, query, canteen, status]
  )

  const filtering = Boolean(query || canteen || status)
  const statusChoices = tab === "active" ? activeStatuses : pastStatuses

  const clear = () => {
    setRawQuery("")
    setCanteen(null)
    setStatus(null)
  }

  if (activeOrders.length === 0 && pastOrders.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="No orders yet"
        description="Order from a campus canteen and your pickup token will show up here."
        action={{ label: "Browse canteens", href: "/home" }}
      />
    )
  }

  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        setTab(value as "active" | "past")
        // Status choices differ per tab, so a stale one would hide everything.
        setStatus(null)
      }}
      className="space-y-4"
    >
      <TabsList>
        <TabsTrigger value="active">
          Active
          {activeOrders.length > 0 ? (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-2xs font-bold text-primary-foreground">
              {activeOrders.length}
            </span>
          ) : null}
        </TabsTrigger>
        <TabsTrigger value="past">Past ({pastOrders.length})</TabsTrigger>
      </TabsList>

      <div className="space-y-3">
        <Input
          type="search"
          inputMode="search"
          placeholder="Search token or canteen"
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
          aria-label="Search orders"
          startAdornment={<Search />}
          endAdornment={
            rawQuery ? (
              <button
                type="button"
                onClick={() => setRawQuery("")}
                aria-label="Clear search"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
              >
                <X />
              </button>
            ) : undefined
          }
        />

        <ChipRail>
          {filtering ? (
            <Chip active onClick={clear} icon={<X />}>
              Clear
            </Chip>
          ) : null}
          {statusChoices.map((value) => (
            <Chip
              key={value}
              active={status === value}
              onClick={() => setStatus(status === value ? null : value)}
            >
              {ORDER_STATUS_META[value].label}
            </Chip>
          ))}
          {canteens.map((name) => (
            <Chip
              key={name}
              active={canteen === name}
              onClick={() => setCanteen(canteen === name ? null : name)}
            >
              {name}
            </Chip>
          ))}
        </ChipRail>
      </div>

      <TabsContent value="active" className="space-y-3">
        {filteredActive.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={filtering ? "No matching orders" : "Nothing cooking"}
            description={
              filtering
                ? "Try clearing the filters or searching a different token."
                : "When you place an order, track its token here in real time."
            }
            action={
              filtering
                ? { label: "Clear filters", onClick: clear }
                : { label: "Browse canteens", href: "/home" }
            }
            compact
          />
        ) : (
          filteredActive.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </TabsContent>

      <TabsContent value="past" className="space-y-3">
        {filteredPast.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={filtering ? "No matching orders" : "No past orders"}
            description={
              filtering
                ? "Try clearing the filters or searching a different token."
                : "Completed and cancelled orders will be listed here."
            }
            action={
              filtering ? { label: "Clear filters", onClick: clear } : undefined
            }
            compact
          />
        ) : (
          filteredPast.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </TabsContent>
    </Tabs>
  )
}
