"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Database } from "@/types/database.types"
import { format } from "date-fns"
import Image from "next/image"
import { useState } from "react"
import toast from "react-hot-toast"

type User = Database["public"]["Tables"]["users"]["Row"]

interface UsersTableProps {
  users: User[]
}

export function UsersTable({ users: initialUsers }: UsersTableProps) {
  const [users, setUsers] = useState(initialUsers)

  const updateRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update role")
      }

      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, role: newRole as any } : user,
        ),
      )
      toast.success("User role updated successfully")
    } catch (error: any) {
      toast.error(error.message || "Failed to update role")
    }
  }

  const roleColors: Record<string, string> = {
    user: "bg-blue-500",
    canteen_owner: "bg-green-500",
    admin: "bg-purple-500",
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px]">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium">User</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Role</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Joined</th>
                <th className="px-6 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} />
                      <span className="font-medium">
                        {user.full_name || "No name"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">{user.email}</td>
                  <td className="px-6 py-4">
                    <Badge className={roleColors[user.role] || "bg-muted"}>
                      {user.role.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {format(new Date(user.created_at), "MMM dd, yyyy")}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => updateRole(user.id, e.target.value)}
                      className="rounded-md border px-2 py-1 text-sm"
                    >
                      <option value="user">User</option>
                      <option value="canteen_owner">Canteen Owner</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-4 md:hidden">
          {users.map((user) => (
            <Card key={user.id} className="border border-slate-100">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <UserAvatar user={user} />
                  <div>
                    <p className="font-semibold">
                      {user.full_name || "No name"}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={roleColors[user.role] || "bg-muted"}>
                    {user.role.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Joined {format(new Date(user.created_at), "MMM dd, yyyy")}
                  </span>
                </div>
                <select
                  value={user.role}
                  onChange={(e) => updateRole(user.id, e.target.value)}
                  className="w-full rounded-md border px-2 py-2 text-sm"
                >
                  <option value="user">User</option>
                  <option value="canteen_owner">Canteen Owner</option>
                  <option value="admin">Admin</option>
                </select>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function UserAvatar({ user }: { user: User }) {
  if (user.avatar_url) {
    return (
      <div className="relative h-10 w-10 overflow-hidden rounded-full">
        <Image
          src={user.avatar_url}
          alt={user.full_name || "User"}
          fill
          className="object-cover"
        />
      </div>
    )
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
      {user.full_name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
    </div>
  )
}

