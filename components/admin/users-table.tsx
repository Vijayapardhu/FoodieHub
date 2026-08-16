"use client"

import { useMemo, useState } from "react"
import { format } from "date-fns"
import { Download, Search, Users, X } from "lucide-react"
import toast from "react-hot-toast"
import { Database } from "@/types/database.types"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Chip, ChipRail } from "@/components/ui/chip"
import { EmptyState } from "@/components/ui/empty-state"
import { useDebounce } from "@/lib/hooks/use-debounce"
import { datedFilename, downloadCsv } from "@/lib/utils/csv"

type User = Database["public"]["Tables"]["users"]["Row"]
type Role = Database["public"]["Enums"]["user_role"]

const roleMeta: Record<Role, { label: string; variant: "info" | "success" | "soft" }> =
  {
    user: { label: "Student", variant: "info" },
    canteen_owner: { label: "Owner", variant: "success" },
    admin: { label: "Admin", variant: "soft" },
  }

const roles: Role[] = ["user", "canteen_owner", "admin"]

export function UsersTable({ users: initialUsers }: { users: User[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [rawQuery, setRawQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<Role | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)

  const query = useDebounce(rawQuery, 180).trim().toLowerCase()

  const counts = useMemo(() => {
    const map = new Map<Role, number>()
    for (const user of users) {
      map.set(user.role, (map.get(user.role) ?? 0) + 1)
    }
    return map
  }, [users])

  const visible = useMemo(
    () =>
      users.filter((user) => {
        if (roleFilter && user.role !== roleFilter) return false
        if (!query) return true
        return (
          user.email.toLowerCase().includes(query) ||
          user.full_name?.toLowerCase().includes(query) ||
          user.phone_number?.includes(query)
        )
      }),
    [users, roleFilter, query]
  )

  const updateRole = async (user: User, role: Role) => {
    if (role === user.role) return

    const previous = users
    setUsers((list) =>
      list.map((entry) => (entry.id === user.id ? { ...entry, role } : entry))
    )
    setPendingId(user.id)

    try {
      const response = await fetch(`/api/users/${user.id}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Could not change role")

      toast.success(
        `${user.full_name || user.email} is now ${roleMeta[role].label.toLowerCase()}`
      )
    } catch (error: any) {
      setUsers(previous)
      toast.error(error?.message || "Could not change that role")
    } finally {
      setPendingId(null)
    }
  }

  const exportUsers = () => {
    downloadCsv(datedFilename("users"), visible, [
      { header: "Name", value: (u) => u.full_name ?? "" },
      { header: "Email", value: (u) => u.email },
      { header: "Phone", value: (u) => u.phone_number ?? "" },
      { header: "Role", value: (u) => roleMeta[u.role].label },
      {
        header: "Joined",
        value: (u) => format(new Date(u.created_at), "yyyy-MM-dd"),
      },
    ])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input
          type="search"
          inputMode="search"
          placeholder="Search name, email or phone"
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
          aria-label="Search users"
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
        <Button
          variant="outline"
          size="icon-lg"
          onClick={exportUsers}
          disabled={visible.length === 0}
          aria-label="Export users as CSV"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <ChipRail>
        <Chip
          active={roleFilter === null}
          onClick={() => setRoleFilter(null)}
          count={users.length}
        >
          All
        </Chip>
        {roles.map((role) => (
          <Chip
            key={role}
            active={roleFilter === role}
            onClick={() => setRoleFilter(roleFilter === role ? null : role)}
            count={counts.get(role) ?? 0}
          >
            {roleMeta[role].label}
          </Chip>
        ))}
      </ChipRail>

      {visible.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users match"
          description="Try a different search term or clear the role filter."
          action={{
            label: "Clear filters",
            onClick: () => {
              setRawQuery("")
              setRoleFilter(null)
            },
          }}
          compact
        />
      ) : (
        <ul className="grid gap-2 lg:grid-cols-2 2xl:grid-cols-3">
          {visible.map((user) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3.5"
            >
              <Avatar
                src={user.avatar_url}
                name={user.full_name ?? user.email}
                size="md"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {user.full_name || "No name set"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-2xs text-muted-foreground">
                  <Badge variant={roleMeta[user.role].variant} size="sm">
                    {roleMeta[user.role].label}
                  </Badge>
                  Joined {format(new Date(user.created_at), "d MMM yyyy")}
                </p>
              </div>

              <label className="w-full sm:w-auto">
                <span className="sr-only">
                  Change role for {user.full_name || user.email}
                </span>
                <select
                  value={user.role}
                  disabled={pendingId === user.id}
                  onChange={(e) => updateRole(user, e.target.value as Role)}
                  className="h-11 w-full rounded-xl border border-input bg-surface px-3 text-sm font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15 disabled:opacity-60 sm:w-40"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {roleMeta[role].label}
                    </option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
