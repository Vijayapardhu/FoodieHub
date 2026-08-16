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
          role: 'user' | 'canteen_owner' | 'admin'
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
          is_approved: boolean
          approved_by: string | null
          approved_at: string | null
          rejection_reason: string | null
          slug: string | null
          prep_minutes: number | null
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
          is_approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          slug?: string | null
          prep_minutes?: number | null
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
          is_approved?: boolean
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          slug?: string | null
          prep_minutes?: number | null
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
          slug: string | null
          prep_minutes: number | null
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
          slug?: string | null
          prep_minutes?: number | null
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
          slug?: string | null
          prep_minutes?: number | null
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
          // Added by migration 012_add_booking_features
          scheduled_pickup_time: string | null
          order_type: 'immediate' | 'scheduled' | 'recurring' | null
          preferred_time_slot: string | null
          estimated_preparation_time: number | null
          dietary_notes: string | null
          special_instructions: string | null
          is_group_order: boolean | null
          group_order_code: string | null
          decline_reason: string | null
          subtotal: number
          discount_amount: number
          offer_id: string | null
        }
        Insert: {
          id?: string
          user_id: string
          canteen_id: string
          token: string
          scheduled_pickup_time?: string | null
          order_type?: 'immediate' | 'scheduled' | 'recurring' | null
          preferred_time_slot?: string | null
          estimated_preparation_time?: number | null
          dietary_notes?: string | null
          special_instructions?: string | null
          is_group_order?: boolean | null
          group_order_code?: string | null
          decline_reason?: string | null
          subtotal?: number
          discount_amount?: number
          offer_id?: string | null
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
          scheduled_pickup_time?: string | null
          order_type?: 'immediate' | 'scheduled' | 'recurring' | null
          preferred_time_slot?: string | null
          estimated_preparation_time?: number | null
          dietary_notes?: string | null
          special_instructions?: string | null
          is_group_order?: boolean | null
          group_order_code?: string | null
          decline_reason?: string | null
          subtotal?: number
          discount_amount?: number
          offer_id?: string | null
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
          public_code: string | null
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
          public_code?: string | null
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
          public_code?: string | null
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
      // Added by migration 012_add_booking_features
      order_templates: {
        Row: {
          id: string
          user_id: string
          canteen_id: string
          name: string
          description: string | null
          items: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          canteen_id: string
          name: string
          description?: string | null
          items: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          canteen_id?: string
          name?: string
          description?: string | null
          items?: Json
          created_at?: string
          updated_at?: string
        }
      }
      // Added by migration 019_platform_settings
      platform_settings: {
        Row: {
          id: boolean
          platform_name: string
          support_email: string | null
          support_phone: string | null
          token_length: number
          order_cancellation_window_minutes: number
          default_preparation_minutes: number
          max_scheduled_days_ahead: number
          ordering_enabled: boolean
          scheduled_orders_enabled: boolean
          reviews_enabled: boolean
          new_canteens_require_approval: boolean
          maintenance_message: string | null
          promo_daily_rate: number
          updated_by: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: boolean
          platform_name?: string
          support_email?: string | null
          support_phone?: string | null
          token_length?: number
          order_cancellation_window_minutes?: number
          default_preparation_minutes?: number
          max_scheduled_days_ahead?: number
          ordering_enabled?: boolean
          scheduled_orders_enabled?: boolean
          reviews_enabled?: boolean
          new_canteens_require_approval?: boolean
          maintenance_message?: string | null
          promo_daily_rate?: number
          updated_by?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: boolean
          platform_name?: string
          support_email?: string | null
          support_phone?: string | null
          token_length?: number
          order_cancellation_window_minutes?: number
          default_preparation_minutes?: number
          max_scheduled_days_ahead?: number
          ordering_enabled?: boolean
          scheduled_orders_enabled?: boolean
          reviews_enabled?: boolean
          new_canteens_require_approval?: boolean
          maintenance_message?: string | null
          promo_daily_rate?: number
          updated_by?: string | null
          updated_at?: string
          created_at?: string
        }
      }
      settings_audit_log: {
        Row: {
          id: string
          changed_by: string | null
          changes: Json
          created_at: string
        }
        Insert: {
          id?: string
          changed_by?: string | null
          changes: Json
          created_at?: string
        }
        Update: {
          id?: string
          changed_by?: string | null
          changes?: Json
          created_at?: string
        }
      }
      user_dietary_preferences: {
        Row: {
          id: string
          user_id: string
          allergies: string[]
          dietary_restrictions: string[]
          preferred_cuisines: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          allergies?: string[]
          dietary_restrictions?: string[]
          preferred_cuisines?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          allergies?: string[]
          dietary_restrictions?: string[]
          preferred_cuisines?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      // Added by migration 023_promo_banners
      promo_banners: {
        Row: {
          id: string
          canteen_id: string
          offer_id: string | null
          headline: string
          subtext: string | null
          image_url: string | null
          cta_label: string
          status: 'pending' | 'approved' | 'rejected' | 'paused'
          placement: 'home_hero' | 'home_inline' | 'orders' | 'cart'
          review_note: string | null
          priority: number
          starts_at: string
          ends_at: string
          amount_due: number
          amount_paid: number
          payment_reference: string | null
          impressions: number
          clicks: number
          created_by: string | null
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          canteen_id: string
          offer_id?: string | null
          headline: string
          subtext?: string | null
          image_url?: string | null
          cta_label?: string
          status?: 'pending' | 'approved' | 'rejected' | 'paused'
          placement?: 'home_hero' | 'home_inline' | 'orders' | 'cart'
          review_note?: string | null
          priority?: number
          starts_at?: string
          ends_at: string
          amount_due?: number
          amount_paid?: number
          payment_reference?: string | null
          impressions?: number
          clicks?: number
          created_by?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          canteen_id?: string
          offer_id?: string | null
          headline?: string
          subtext?: string | null
          image_url?: string | null
          cta_label?: string
          status?: 'pending' | 'approved' | 'rejected' | 'paused'
          placement?: 'home_hero' | 'home_inline' | 'orders' | 'cart'
          review_note?: string | null
          priority?: number
          starts_at?: string
          ends_at?: string
          amount_due?: number
          amount_paid?: number
          payment_reference?: string | null
          impressions?: number
          clicks?: number
          created_by?: string | null
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      // Added by migration 023_promo_banners
      track_promo_banner: {
        Args: { banner_id: string; event?: 'impression' | 'click' }
        Returns: undefined
      }
    }
    Enums: {
      user_role: 'user' | 'canteen_owner' | 'admin'
      order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled'
      payment_status: 'pending' | 'completed'
      notification_type: 'order' | 'promotion' | 'system' | 'feedback'
      discount_type: 'percentage' | 'flat'
    }
  }
}

