export type UserType = "public" | "supplier"
export type SupplierType = "broker" | "grower"
export type Unit = "tons" | "bales"

export interface Profile {
  id: string
  email: string
  full_name: string | null
  user_type: UserType
  created_at: string
  updated_at: string
}

export interface Supplier {
  id: string
  user_id: string
  business_name: string
  supplier_type: SupplierType
  description: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string
}

export interface Inventory {
  id: string
  supplier_id: string
  product_name: string
  quantity: number
  unit: Unit
  price_per_unit: number
  delivery_available: boolean
  created_at: string
  updated_at: string
}

export interface SupplierWithInventory extends Supplier {
  inventory: Inventory[]
}
