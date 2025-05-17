/**
 * Base URL for the Khalti API
 */
export const BASE_URL = "https://khalti.com/api"

/**
 * Sandbox refund endpoint for production
 */
export const REFUND_ENDPOINT = "https://khalti.com/api/merchant-transaction/{{transaction_id}}/refund/"

/**
 * Current API version
 */
export const API_VERSION = "v2"

/**
 * API endpoints
 */
export const ENDPOINTS = {
  INITIATE_PAYMENT: "/v2/epayment/initiate/",
  VERIFY_PAYMENT: "/v2/epayment/lookup/",
  PAYMENT_STATUS: "/v2/epayment/status/",
  BANKS: "/v5/bank/",
}

/**
 * Sandbox base URL for testing
 */
export const SANDBOX_URL = "https://dev.khalti.com/api"

/**
 * Sandbox refund endpoint
 */
export const SANDBOX_REFUND_ENDPOINT = "https://dev.khalti.com/api/merchant-transaction/{{transaction_id}}/refund/"
