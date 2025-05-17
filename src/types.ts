/**
 * Configuration options for the Khalti client
 */
export interface KhaltiConfig {
  /** API key for authentication with Khalti */
  apiKey: string
  /** Base URL for the Khalti API (optional, defaults to production) */
  baseUrl?: string
  /** Enable debug logging (optional) */
  debug?: boolean
  /**This detects for live mode */
  isLive?: boolean
}

export interface AmountBreakdown {
  label: string
  amount: number
}
[]

export interface ProductDetails {
  identity: string
  name: string
  total_price: number
  quantity: number
  unit_price: number
}
[]

/**
 * Parameters for initiating a payment
 */
export interface InitiatePaymentParams {
  /** Unique identifier for the purchase order */
  purchase_order_id: string
  /** Amount in paisa (100 paisa = 1 NPR) */
  amount: number
  /** URL to redirect after payment completion */
  return_url: string
  /** URL for webhook notifications (optional) */
  website_url: string
  /** Purchase details (optional) */
  purchase_order_name: string
  /** Customer information (optional) */
  customer_info?: {
    name?: string
    email?: string
    phone?: string
  }
  /** Additional metadata (optional) */
  amount_breakdown?: AmountBreakdown[]
  /** Product details (optional) */
  product_details?: ProductDetails[]
  /** Merchant name (optional) */
  merchant_username?: string
  /** Merchant extra (optional). This is an extra data if you need to send anything and again get this back */
  merchant_extra?: string
  /** Time to live in seconds (optional) */
  ttl?: number
  /** Bank identifier (optional) */
  bank?: string
  /** Payment modes (optional) */
  modes?: PaymentMode[]
}

/**
 * Payment modes supported by Khalti
 */
export type PaymentMode = "MOBILE_BANKING" | "CONNECT_IPS" | "SCT" | "KHALTI" | "E_BANKING"

/**
 * Response from initiating a payment
 */
export interface InitiatePaymentResponse {
  /** Payment URL to redirect the user to */
  payment_url: string
  /** Unique identifier for the payment */
  pidx: string
  /** Purchase order ID */
  purchase_order_id: string
  /** Expiration timestamp */
  expires_at: string
  expires_in: number
}

/**
 * Parameters for verifying a payment
 */
export interface VerifyPaymentParams {
  /** Payment transaction ID */
  pidx: string
}

/**
 * Response from verifying a payment
 */
export interface VerifyPaymentResponse {
  status: PaymentStatusType
  total_amount: number
  transaction_id: string
  fee: number
  refunded: boolean
}

/**
 * Payment status response
 */
export interface PaymentStatus {
  /** Status of the payment */
  status: PaymentStatusType
  /** Purchase order ID */
  purchase_order_id: string
  /** Payment transaction ID */
  pidx: string
  /** Amount in paisa */
  amount: number
  /** Created at timestamp */
  createdAt: string
  /** Updated at timestamp */
  updatedAt: string
}

/**
 * Possible payment status types
 */
export type PaymentStatusType =
  | "Initiated"
  | "Pending"
  | "Completed"
  | "Failed"
  | "Refunded"
  | "Expired"
  | "User canceled"
  | "Partially Refunded"

/**
 * Parameters for refunding a payment
 */
export interface RefundParams {
  /** Mobile number associated with the Khalti account */
  mobile: string
  /** Amount to refund (only required for partial refunds) */
  amount?: number
}

/**
 * Response from refunding a payment
 */
export interface RefundResponse {
  /** Status of the refund */
  status: string
  /** Transaction ID */
  transactionId: string
  /** Total amount refunded */
  refunded_amount: number
  /** Remaining amount (for partial refunds) */
  remaining_amount?: number
  /** Refund timestamp */
  refunded_at: string
}

/**
 * Bank information
 */
export interface Bank {
  /** Unique identifier for the bank */
  idx: string
  /** Full name of the bank */
  name: string
  /** Short name or abbreviation of the bank */
  short_name: string
  /** URL to the bank's logo */
  logo: string
  /** SWIFT code of the bank */
  swift_code: string
  /** Whether the bank supports card payment */
  has_cardpayment: boolean
  /** Address of the bank */
  address: string
  /** URL for e-banking */
  ebanking_url: string
  /** Whether the bank supports e-banking */
  has_ebanking: boolean
  /** Whether the bank supports mobile checkout */
  has_mobile_checkout: boolean
  /** Whether the bank supports direct withdrawal */
  has_direct_withdraw: boolean
  /** Whether the bank supports NCHL */
  has_nchl: boolean
  /** Whether the bank supports mobile banking */
  has_mobile_banking: boolean
  /** URL to the bank's app on Play Store */
  play_store: string
  /** URL to the bank's app on App Store */
  app_store: string
  /** List of bank branches */
  branches: any[]
}

/**
 * Response from getting banks
 */
export interface BanksResponse {
  /** Total number of pages */
  total_pages: number
  /** Total number of records */
  total_records: number
  /** URL to the next page */
  next: string | null
  /** URL to the previous page */
  previous: string | null
  /** Range of records in the current page */
  record_range: [number, number]
  /** Current page number */
  current_page: number
  /** List of banks */
  records: Bank[]
}

/**
 * Payment type for bank listing
 */
export type PaymentType = "ebanking" | "mobilecheckout"
