/**
 * Types partagés entre Server Components, Server Actions et Client Components.
 */

export type PropertyType =
  | "appartement"
  | "maison"
  | "local_commercial"
  | "terrain";

export type ListingType = "rent" | "sale";

export type PropertyStatus = "draft" | "active" | "paused" | "archived" | "sold";

export interface PropertyListItem {
  id: string;
  title: string;
  city: string;
  surface: number;
  price: number;
  rooms: number | null;
  property_type: PropertyType;
  listing_type: ListingType;
  is_premium: boolean;
  is_verified: boolean;
  cover_url: string | null;
}

export interface PropertyFull extends PropertyListItem {
  owner_id: string;
  description: string;
  address: string;
  postal_code: string | null;
  contact_phone_1: string | null;
  contact_phone_2: string | null;
  status: PropertyStatus;
  premium_until: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  photos: { url: string; display_order: number }[];
}

export interface OwnerContact {
  full_name: string;
  phone: string | null;
  email: string;
}

export interface SearchFilters {
  city?: string;
  type?: PropertyType | "";
  listing?: ListingType | "";
  q?: string;
  pmin?: number;
  pmax?: number;
  smin?: number;
  rooms?: number;
  page?: number;
}

// ---- Tokens ----------------------------------------------------------------
export type PurchaseStatus = "pending" | "approved" | "rejected";

export interface TokenPurchase {
  id: string;
  user_id: string;
  pack_size: number;
  amount_ar: number;
  payment_reference: string;
  payment_method: string;
  status: PurchaseStatus;
  admin_note: string | null;
  validated_at: string | null;
  created_at: string;
}

export interface TokenPack {
  size: number;
  price_ar: number;
  label?: string;
  badge?: string;
}

// ---- Messages --------------------------------------------------------------
export interface MessageRow {
  id: string;
  property_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface ConversationPreview {
  property_id: string;
  property_title: string;
  property_cover: string | null;
  other_user_id: string;
  other_user_name: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

// ---- Alerts ----------------------------------------------------------------
export type AlertFrequency = "instant" | "daily" | "weekly";

export interface Alert {
  id: string;
  user_id: string;
  name: string;
  filters: SearchFilters;
  frequency: AlertFrequency;
  is_active: boolean;
  last_sent_at: string | null;
  created_at: string;
}

// ---- Stats -----------------------------------------------------------------
export interface PropertyStats {
  views_total: number;
  views_7d: number;
  views_30d: number;
  unlocks_total: number;
  favorites_total: number;
  messages_total: number;
  conversion_rate: number;
  recent_unlocks: {
    user_name: string;
    user_email_masked: string;
    unlocked_at: string;
  }[];
  views_by_day: { day: string; count: number }[];
}
