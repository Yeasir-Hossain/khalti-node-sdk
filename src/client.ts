import axios from "axios"
import type {
  KhaltiConfig,
  InitiatePaymentParams,
  InitiatePaymentResponse,
  VerifyPaymentParams,
  VerifyPaymentResponse,
  RefundParams,
  RefundResponse,
  BanksResponse,
  PaymentType,
} from "./types"
import { KhaltiError, ErrorCode } from "./errors"
import { BASE_URL, ENDPOINTS, SANDBOX_URL, SANDBOX_REFUND_ENDPOINT, REFUND_ENDPOINT } from "./constants"

/**
 * Main client for interacting with the Khalti Payment Gateway
 */
export class KhaltiClient {
  private apiKey: string
  private baseUrl: string
  private debug: boolean

  /**
   * Create a new Khalti client instance
   *
   * @param config Configuration options for the Khalti client
   */
  constructor(config: KhaltiConfig) {
    this.apiKey = config.apiKey
    this.debug = config.debug || false

    if (config.baseUrl) {
      this.baseUrl = config.baseUrl
    } else if (config.isLive) {
      this.baseUrl = BASE_URL
    } else {
      this.baseUrl = SANDBOX_URL
    }
  }

  /**
   * Get list of banks for a specific payment type
   *
   * @param paymentType Type of payment (ebanking or mobilecheckout)
   * @returns Promise with the banks response
   */
  public async getBanks(paymentType: PaymentType): Promise<BanksResponse> {
    this.logDebug("Getting banks for payment type", { paymentType })

    try {
      const response = await axios.get(`${this.baseUrl}${ENDPOINTS.BANKS}`, {
        params: { payment_type: paymentType },
        headers: this.getHeaders(),
      })

      this.logDebug("Banks retrieved successfully", response.data)
      return response.data
    } catch (error) {
      if (error instanceof KhaltiError) {
        throw error
      }

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500
        const errorData = error.response?.data || {}

        throw new KhaltiError(
          errorData.error_key || ErrorCode.UNKNOWN_ERROR,
          errorData.error || "Unknown error occurred",
          statusCode,
        )
      }

      throw new KhaltiError(
        ErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : "Network error occurred",
        500,
      )
    }
  }

  /**
   * Initiate a payment request to Khalti
   *
   * @param params Payment initialization parameters
   * @returns Promise with the payment initiation response
   */
  public async initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResponse> {
    this.logDebug("Initiating payment", params)

    try {
      const validatedParams = this.validateInitiatePaymentParams(params)

      const response = await axios.post(`${this.baseUrl}${ENDPOINTS.INITIATE_PAYMENT}`, validatedParams, {
        headers: this.getHeaders(),
      })

      this.logDebug("Payment initiated successfully", response.data)
      return response.data
    } catch (error) {
      if (error instanceof KhaltiError) {
        throw error
      }
      console.log(error)
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500
        const errorData = error.response?.data || {}

        throw new KhaltiError(
          errorData.error_key || ErrorCode.UNKNOWN_ERROR,
          errorData.error || "Unknown error occurred",
          statusCode,
        )
      }

      throw new KhaltiError(
        ErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : "Network error occurred",
        500,
      )
    }
  }

  /**
   * Verify or lookup a payment
   *
   * @param params Payment verification parameters
   * @returns Promise with the verification response
   */
  public async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResponse> {
    this.logDebug("Verifying payment", params)

    try {
      const response = await axios.post(`${this.baseUrl}${ENDPOINTS.VERIFY_PAYMENT}`, params, {
        headers: this.getHeaders(),
      })

      this.logDebug("Payment verified successfully", response.data)
      return response.data
    } catch (error) {
      if (error instanceof KhaltiError) {
        throw error
      }

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500
        const errorData = error.response?.data || {}

        throw new KhaltiError(
          errorData.error_key || ErrorCode.UNKNOWN_ERROR,
          errorData.error || "Unknown error occurred",
          statusCode,
        )
      }

      throw new KhaltiError(
        ErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : "Network error occurred",
        500,
      )
    }
  }

  /**
   * Check the status of a payment
   *
   * @param pidx Payment transaction ID
   * @returns Promise with the payment status
   */
  public async checkPaymentStatus(pidx: string): Promise<any> {
    this.logDebug("Checking payment status", { pidx })

    try {
      const response = await axios.post(
        `${this.baseUrl}${ENDPOINTS.PAYMENT_STATUS}`,
        { pidx },
        { headers: this.getHeaders() },
      )

      this.logDebug("Payment status retrieved successfully", response.data)
      return response.data
    } catch (error) {
      if (error instanceof KhaltiError) {
        throw error
      }

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500
        const errorData = error.response?.data || {}

        throw new KhaltiError(
          errorData.error_key || ErrorCode.UNKNOWN_ERROR,
          errorData.error || "Unknown error occurred",
          statusCode,
        )
      }

      throw new KhaltiError(
        ErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : "Network error occurred",
        500,
      )
    }
  }

  /**
   * Refund a payment (full or partial)
   *
   * @param params Refund parameters
   * @returns Promise with the refund response
   */
  public async refundPayment(params: RefundParams): Promise<RefundResponse> {
    this.logDebug("Refunding payment", params)

    if (!params.mobile) {
      throw new KhaltiError(ErrorCode.VALIDATION_ERROR, "Mobile number is required", 400)
    }

    try {
      // Determine if this is a full or partial refund
      const isPartialRefund = typeof params.amount === "number" && params.amount > 0

      // Prepare the request body
      const requestBody = isPartialRefund ? { mobile: params.mobile, amount: params.amount } : { mobile: params.mobile }

      // Get the appropriate refund endpoint
      const refundEndpoint = this.getRefundEndpoint()

      const response = await axios.post(refundEndpoint, requestBody, {
        headers: this.getHeaders(),
      })

      this.logDebug("Payment refunded successfully", response.data)
      return response.data
    } catch (error) {
      if (error instanceof KhaltiError) {
        throw error
      }

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500
        const errorData = error.response?.data || {}

        throw new KhaltiError(
          errorData.error_key || ErrorCode.UNKNOWN_ERROR,
          errorData.error || "Unknown error occurred",
          statusCode,
        )
      }

      throw new KhaltiError(
        ErrorCode.NETWORK_ERROR,
        error instanceof Error ? error.message : "Network error occurred",
        500,
      )
    }
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Key ${this.apiKey}`,
      "Content-Type": "application/json",
    }
  }

  /**
   * Validate and prepare payment initiation parameters
   */
  private validateInitiatePaymentParams(params: InitiatePaymentParams): InitiatePaymentParams {
    if (!params.purchase_order_id) {
      throw new KhaltiError(ErrorCode.VALIDATION_ERROR, "Purchase order ID is required", 400)
    }

    if (!params.amount) {
      throw new KhaltiError(ErrorCode.VALIDATION_ERROR, "Amount is required", 400)
    }

    if (!params.return_url) {
      throw new KhaltiError(ErrorCode.VALIDATION_ERROR, "Return URL is required", 400)
    }

    if (!params.website_url) {
      throw new KhaltiError(ErrorCode.VALIDATION_ERROR, "Website URL is required", 400)
    }

    // Amount should be in paisa (lowest denomination)
    if (typeof params.amount === "number" && params.amount < 1000) {
      this.logDebug("Warning: Amount seems low, make sure it is in paisa (1000 paisa = 10 NPR)")
    }

    return params
  }

  /**
   * Get the refund endpoint URL
   */
  private getRefundEndpoint(): string {
    // Determine if we're using sandbox or production
    return this.baseUrl === SANDBOX_URL ? SANDBOX_REFUND_ENDPOINT : REFUND_ENDPOINT
  }

  /**
   * Log debug messages if debug mode is enabled
   */
  private logDebug(message: string, data?: any): void {
    if (this.debug) {
      console.log(`[Khalti SDK] ${message}`, data || "")
    }
  }
}
