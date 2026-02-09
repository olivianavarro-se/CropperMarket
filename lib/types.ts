export type AccountType = "grower" | "broker" | "buyer"
export type SupplierType = "broker" | "grower"
export type StockUnit = "tons" | "large_bales" | "small_bales"
export type SellingUnit = "tons" | "large_bales" | "small_bales"

export interface PricingOption {
  unit: SellingUnit
  price: number
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  account_type: AccountType
  created_at: string
  updated_at: string
}

export type PaymentMethod = "cash" | "credit" | "debit" | "zelle" | "venmo" | "check" | "apple_pay"

export interface Supplier {
  id: string
  user_id: string
  business_name: string
  supplier_type: SupplierType
  description: string | null
  phone: string | null
  email: string | null
  visible_to_buyers: boolean
  visible_to_brokers: boolean
  delivery_available: boolean
  payment_methods: PaymentMethod[]
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  supplier_id: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string | null
  latitude: number | null
  longitude: number | null
  delivery_available: boolean
  created_at: string
  updated_at: string
}

export interface Inventory {
  id: string
  supplier_id: string
  location_id: string | null
  product_name: string
  quantity: number
  stock_unit: StockUnit
  selling_unit: SellingUnit
  price_per_unit: number
  pricing_options: PricingOption[]
  description: string | null
  created_at: string
  updated_at: string
}

export interface LocationWithInventory extends Location {
  inventory: Inventory[]
}

export interface SupplierWithInventory extends Supplier {
  inventory: Inventory[]
  locations: LocationWithInventory[]
}

export interface LocationWithSupplier extends Location {
  supplier: Supplier
  inventory: Inventory[]
}
