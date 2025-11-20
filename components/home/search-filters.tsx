"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Filter, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Database } from "@/types/database.types"

type Category = Database["public"]["Tables"]["categories"]["Row"]

interface SearchFiltersProps {
  categories: Category[]
  onSearch: (query: string, filters: SearchFilters) => void
}

export interface SearchFilters {
  category: string | null
  minPrice: number | null
  maxPrice: number | null
  rating: number | null
  vegetarianOnly: boolean
  openOnly: boolean
}

export function SearchFilters({ categories, onSearch }: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<SearchFilters>({
    category: null,
    minPrice: null,
    maxPrice: null,
    rating: null,
    vegetarianOnly: false,
    openOnly: false,
  })
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = () => {
    onSearch(searchQuery, filters)
  }

  const clearFilters = () => {
    setFilters({
      category: null,
      minPrice: null,
      maxPrice: null,
      rating: null,
      vegetarianOnly: false,
      openOnly: false,
    })
    onSearch(searchQuery, {
      category: null,
      minPrice: null,
      maxPrice: null,
      rating: null,
      vegetarianOnly: false,
      openOnly: false,
    })
  }

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== null && value !== false
  )

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search canteens, items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-12 rounded-full border-2 border-gray-200 pl-10 pr-4 focus:border-primary"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={() => setShowFilters(true)}
        >
          <Filter className="h-5 w-5" />
          {hasActiveFilters && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-white">
              !
            </span>
          )}
        </Button>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={clearFilters}
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Filters Dialog */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-medium">Category</label>
              <select
                value={filters.category || ""}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value || null })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="mb-2 block text-sm font-medium">Price Range</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      minPrice: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ""}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      maxPrice: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                />
              </div>
            </div>

            {/* Rating */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Minimum Rating
              </label>
              <select
                value={filters.rating || ""}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    rating: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Stars</option>
              </select>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.vegetarianOnly}
                  onChange={(e) =>
                    setFilters({ ...filters, vegetarianOnly: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm">Vegetarian Only</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.openOnly}
                  onChange={(e) =>
                    setFilters({ ...filters, openOnly: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <span className="text-sm">Open Only</span>
              </label>
            </div>

            {/* Apply Button */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearFilters}
                className="flex-1"
              >
                Clear
              </Button>
              <Button
                onClick={() => {
                  handleSearch()
                  setShowFilters(false)
                }}
                className="flex-1 bg-primary"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

