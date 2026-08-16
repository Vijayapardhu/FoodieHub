import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  itemId: string
  name: string
  price: number
  imageUrl: string | null
  quantity: number
  canteenId: string
  canteenName: string
  /**
   * Public handles for links out of the cart. Optional because carts persisted
   * in localStorage before slugs existed have to keep working — the link
   * helpers fall back to the id, which still resolves.
   */
  itemSlug?: string | null
  canteenSlug?: string | null
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "quantity">) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
  getItemsByCanteen: (canteenId: string) => CartItem[]
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existingItem = get().items.find((i) => i.itemId === item.itemId)
        if (existingItem) {
          set((state) => ({
            items: state.items.map((i) =>
              i.itemId === item.itemId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          }))
        } else {
          set((state) => ({
            items: [...state.items, { ...item, quantity: 1 }],
          }))
        }
      },
      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((i) => i.itemId !== itemId),
        }))
      },
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.itemId === itemId ? { ...i, quantity } : i
          ),
        }))
      },
      clearCart: () => {
        set({ items: [] })
      },
      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
      getItemsByCanteen: (canteenId) => {
        return get().items.filter((item) => item.canteenId === canteenId)
      },
    }),
    {
      name: "foodiehub-cart",
    }
  )
)

