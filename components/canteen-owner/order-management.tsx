"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, Inbox, Search, X } from "@/components/ui/icons"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Chip, ChipRail } from "@/components/ui/chip"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ORDER_STATUS_META,
  nextStatus,
  type OrderStatus,
} from "@/lib/utils/order-status"
import { formatRelativeTime } from "@/lib/utils/format"
import { ownerOrderPath } from "@/lib/utils/public-id"

type Order = Database["public"]["Tables"]["orders"]["Row"] & {
  users: { email: string; full_name: string | null } | null
}

const advanceLabel: Partial<Record<OrderStatus, string>> = {
  pending: "Accept",
  confirmed: "Start cooking",
  preparing: "Mark ready",
  ready: "Hand over",
}

const filters: Array<{ key: OrderStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "pending", label: "New" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Cooking" },
  { key: "ready", label: "Ready" },
]

export function OrderManagement({ orders }: { orders: Order[] }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<OrderStatus | "all">("all")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const order of orders) {
      map.set(order.status, (map.get(order.status) ?? 0) + 1)
    }
    return map
  }, [orders])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return orders.filter((order) => {
      if (filter !== "all" && order.status !== filter) return false
      if (!needle) return true
      return (
        order.token.toLowerCase().includes(needle) ||
        order.customer_name?.toLowerCase().includes(needle) ||
        order.users?.full_name?.toLowerCase().includes(needle) ||
        order.customer_phone?.includes(needle)
      )
    })
  }, [orders, filter, query])

  const updateStatus = async (order: Order, status: OrderStatus) => {
    setBusyId(order.id)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", order.id)

      if (error) throw error

      toast.success(`#${order.token} → ${ORDER_STATUS_META[status].label}`)
      // Server component owns the list, so refresh rather than mutating locally.
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not update that order")
    } finally {
      setBusyId(null)
    }
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", cancelTarget.id)

      if (error) throw error

      toast.success(`#${cancelTarget.token} cancelled`)
      setCancelTarget(null)
      router.refresh()
    } catch (error: any) {
      toast.error(error?.message || "Could not cancel that order")
    } finally {
      setCancelling(false)
    }
  }

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No orders here"
        description="New orders appear the moment a student checks out."
      />
    )
  }

  return (
    <>
      <div className="space-y-3">
        <Input
          type="search"
          inputMode="search"
          placeholder="Search token, name or phone"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search orders"
          startAdornment={<Search />}
          endAdornment={
            query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted"
              >
                <X />
              </button>
            ) : undefined
          }
        />

        <ChipRail>
          {filters.map((option) => (
            <Chip
              key={option.key}
              active={filter === option.key}
              onClick={() => setFilter(option.key)}
              count={
                option.key === "all"
                  ? orders.length
                  : (counts.get(option.key) ?? 0)
              }
            >
              {option.label}
            </Chip>
          ))}
        </ChipRail>

        {visible.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Nothing matches"
            description="Try a different token, or clear the status filter."
            action={{
              label: "Show all",
              onClick: () => {
                setFilter("all")
                setQuery("")
              },
            }}
            compact
          />
        ) : (
          <ul className="space-y-3">
            {visible.map((order) => {
              const status = order.status as OrderStatus
              const next = nextStatus(status)
              const label = advanceLabel[status]
              const customer =
                order.customer_name ||
                order.users?.full_name ||
                order.users?.email ||
                "Guest"
              const waiting = status === "pending" || status === "confirmed"

              return (
                <li
                  key={order.id}
                  className="overflow-hidden rounded-2xl border border-border bg-card shadow-card"
                >
                  <Link
                    href={ownerOrderPath(order)}
                    className="flex items-start gap-3 p-4 transition-colors active:bg-muted"
                  >
                    <span className="flex flex-col items-center rounded-xl bg-primary-soft px-2.5 py-1.5">
                      <span className="text-2xs font-medium uppercase tracking-wide text-primary/70">
                        Token
                      </span>
                      <span className="font-mono text-base font-black tracking-wider text-primary">
                        {order.token}
                      </span>
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-foreground">
                          {customer}
                        </span>
                        <StatusBadge status={status} size="sm" showIcon={false} />
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        ₹{Number(order.total_amount).toFixed(2)} ·{" "}
                        {formatRelativeTime(order.created_at)}
                      </span>
                      {order.special_instructions ? (
                        <span className="mt-1.5 block rounded-lg bg-warning-soft px-2 py-1 text-xs text-warning">
                          {order.special_instructions}
                        </span>
                      ) : null}
                    </span>

                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>

                  {next && label ? (
                    <div className="flex gap-2 border-t border-border p-3">
                      {waiting ? (
                        <Button
                          variant="outline"
                          className="border-destructive/40 text-destructive hover:bg-destructive-soft"
                          onClick={() => setCancelTarget(order)}
                          disabled={busyId === order.id}
                        >
                          Reject
                        </Button>
                      ) : null}
                      <Button
                        className="flex-1"
                        loading={busyId === order.id}
                        onClick={() => updateStatus(order, next)}
                      >
                        {label}
                      </Button>
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <Dialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Cancel order #{cancelTarget?.token}?
            </DialogTitle>
            <DialogDescription>
              The customer is notified immediately and the token is released.
              Use this when you can&apos;t fulfil the order.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              block
              onClick={() => setCancelTarget(null)}
              disabled={cancelling}
            >
              Keep it
            </Button>
            <Button
              variant="destructive"
              block
              loading={cancelling}
              onClick={handleCancel}
            >
              Cancel order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
