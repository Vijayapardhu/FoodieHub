export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'student' | 'canteen_owner' | 'admin'
          created_at: string
          updated_at: string
          phone_number: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'student' | 'canteen_owner' | 'admin'
          created_at?: string
          updated_at?: string
          phone_number?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'student' | 'canteen_owner' | 'admin'
          created_at?: string
          updated_at?: string
          phone_number?: string | null
        }
      }
      canteens: {
        Row: {
          id: string
          owner_id: string
          name: string
          description: string | null
          logo_url: string | null
          banner_url: string | null
          operating_hours: Json
          is_open: boolean
          rating: number
          total_reviews: number
          created_at: string
          updated_at: string
          contact_phone: string | null
          address: string | null
          address_reference: string | null
          google_maps_url: string | null
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          operating_hours: Json
          is_open?: boolean
          rating?: number
          total_reviews?: number
          created_at?: string
          updated_at?: string
          contact_phone?: string | null
          address?: string | null
          address_reference?: string | null
          google_maps_url?: string | null
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          description?: string | null
          logo_url?: string | null
          banner_url?: string | null
          operating_hours?: Json
          is_open?: boolean
          rating?: number
          total_reviews?: number
          created_at?: string
          updated_at?: string
          contact_phone?: string | null
          address?: string | null
          address_reference?: string | null
          google_maps_url?: string | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      items: {
        Row: {
          id: string
          canteen_id: string
          category_id: string
          name: string
          description: string | null
          price: number
          image_url: string | null
          is_vegetarian: boolean
          is_available: boolean
          nutritional_info: Json | null
          rating: number
          total_reviews: number
          created_at: string
          updated_at: string
          gallery_images: string[] | null
          is_featured: boolean
          featured_image_url: string | null
        }
        Insert: {
          id?: string
          canteen_id: string
          category_id: string
          name: string
          description?: string | null
          price: number
          image_url?: string | null
          is_vegetarian?: boolean
          is_available?: boolean
          nutritional_info?: Json | null
          rating?: number
          total_reviews?: number
          created_at?: string
          updated_at?: string
          gallery_images?: string[] | null
          is_featured?: boolean
          featured_image_url?: string | null
        }
        Update: {
          id?: string
          canteen_id?: string
          category_id?: string
          name?: string
          description?: string | null
          price?: number
          image_url?: string | null
          is_vegetarian?: boolean
          is_available?: boolean
          nutritional_info?: Json | null
          rating?: number
          total_reviews?: number
          created_at?: string
          updated_at?: string
          gallery_images?: string[] | null
          is_featured?: boolean
          featured_image_url?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          canteen_id: string
          token: string
          qr_code_url: string | null
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          total_amount: number
          payment_method: 'on_shop'
          payment_status: 'pending' | 'completed'
          cash_received: number | null
          change_amount: number | null
          customer_name: string | null
          customer_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          canteen_id: string
          token: string
          qr_code_url?: string | null
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          total_amount: number
          payment_method?: 'on_shop'
          payment_status?: 'pending' | 'completed'
          cash_received?: number | null
          change_amount?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          canteen_id?: string
          token?: string
          qr_code_url?: string | null
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          total_amount?: number
          payment_method?: 'on_shop'
          payment_status?: 'pending' | 'completed'
          cash_received?: number | null
          change_amount?: number | null
          customer_name?: string | null
          customer_phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          item_id: string
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          item_id: string
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          item_id?: string
          quantity?: number
          price?: number
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          user_id: string
          canteen_id: string | null
          item_id: string | null
          order_id: string
          rating: number
          comment: string | null
          photos: string[]
          owner_response: string | null
          owner_response_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          canteen_id?: string | null
          item_id?: string | null
          order_id: string
          rating: number
          comment?: string | null
          photos?: string[]
          owner_response?: string | null
          owner_response_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          canteen_id?: string | null
          item_id?: string | null
          order_id?: string
          rating?: number
          comment?: string | null
          photos?: string[]
          owner_response?: string | null
          owner_response_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      offers: {
        Row: {
          id: string
          canteen_id: string
          title: string
          description: string | null
          discount_type: 'percentage' | 'flat'
          discount_value: number
          min_order_amount: number | null
          max_discount: number | null
          valid_from: string
          valid_until: string
          is_active: boolean
          is_approved: boolean
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          canteen_id: string
          title: string
          description?: string | null
          discount_type: 'percentage' | 'flat'
          discount_value: number
          min_order_amount?: number | null
          max_discount?: number | null
          valid_from: string
          valid_until: string
          is_active?: boolean
          is_approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          canteen_id?: string
          title?: string
          description?: string | null
          discount_type?: 'percentage' | 'flat'
          discount_value?: number
          min_order_amount?: number | null
          max_discount?: number | null
          valid_from?: string
          valid_until?: string
          is_active?: boolean
          is_approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'order' | 'promotion' | 'system' | 'feedback'
          is_read: boolean
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: 'order' | 'promotion' | 'system' | 'feedback'
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'order' | 'promotion' | 'system' | 'feedback'
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          item_id: string | null
          canteen_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_id?: string | null
          canteen_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string | null
          canteen_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'student' | 'canteen_owner' | 'admin'
      order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
      payment_status: 'pending' | 'completed'
      notification_type: 'order' | 'promotion' | 'system' | 'feedback'
      discount_type: 'percentage' | 'flat'
    }
  }
}

