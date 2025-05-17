import axios from "axios"
import { KhaltiClient } from "../src/client"
import { KhaltiError, ErrorCode } from "../src/errors"
import { BASE_URL, ENDPOINTS } from "../src/constants"

// Mock axios
jest.mock("axios")
const mockedAxios = axios as jest.Mocked<typeof axios>

describe("KhaltiClient", () => {
  let client: KhaltiClient
  const mockApiKey = "test-api-key"

  beforeEach(() => {
    client = new KhaltiClient({ apiKey: mockApiKey })
    jest.clearAllMocks()
  })

  describe("constructor", () => {
    it("should initialize with default values", () => {
      expect(client).toBeInstanceOf(KhaltiClient)
    })

    it("should initialize with custom base URL", () => {
      const customClient = new KhaltiClient({
        apiKey: mockApiKey,
        baseUrl: "https://custom-url.com",
      })
      expect(customClient).toBeInstanceOf(KhaltiClient)
    })

    it("should initialize with debug mode", () => {
      const debugClient = new KhaltiClient({
        apiKey: mockApiKey,
        debug: true,
      })
      expect(debugClient).toBeInstanceOf(KhaltiClient)
    })
  })

  describe("initiatePayment", () => {
    const validParams = {
      purchase_order_id: "order-123",
      amount: 10000,
      return_url: "https://example.com/return",
      website_url: "https://example.com",
    }

    const mockResponse = {
      data: {
        payment_url: "https://khalti.com/payment/123",
        pidx: "pidx-123",
        purchaseOrderId: "order-123",
        expires_at: "2023-12-31T23:59:59Z",
        expires_in: 3600,
      },
    }

    it("should successfully initiate a payment", async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse)

      const result = await client.initiatePayment(validParams)

      expect(mockedAxios.post).toHaveBeenCalledWith(`${BASE_URL}${ENDPOINTS.INITIATE_PAYMENT}`, validParams, {
        headers: {
          Authorization: `Key ${mockApiKey}`,
          "Content-Type": "application/json",
        },
      })

      expect(result).toEqual(mockResponse.data)
    })

    it("should throw validation error for missing purchase_order_id", async () => {
      const invalidParams = { ...validParams, purchase_order_id: "" }

      await expect(client.initiatePayment(invalidParams)).rejects.toThrow(KhaltiError)
      await expect(client.initiatePayment(invalidParams)).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Purchase order ID is required",
      })
    })

    it("should throw validation error for missing amount", async () => {
      const invalidParams = { ...validParams, amount: 0 }

      await expect(client.initiatePayment(invalidParams)).rejects.toThrow(KhaltiError)
      await expect(client.initiatePayment(invalidParams)).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Amount is required",
      })
    })

    it("should throw validation error for missing return_url", async () => {
      const invalidParams = { ...validParams, return_url: "" }

      await expect(client.initiatePayment(invalidParams)).rejects.toThrow(KhaltiError)
      await expect(client.initiatePayment(invalidParams)).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Return URL is required",
      })
    })

    it("should throw validation error for missing website_url", async () => {
      const invalidParams = { ...validParams, website_url: "" }

      await expect(client.initiatePayment(invalidParams)).rejects.toThrow(KhaltiError)
      await expect(client.initiatePayment(invalidParams)).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Website URL is required",
      })
    })

    it("should handle API error responses", async () => {
      const errorResponse = {
        response: {
          status: 400,
          data: {
            error_key: "validation_error",
            error: "Invalid parameters",
          },
        },
      }

      mockedAxios.post.mockRejectedValueOnce(errorResponse)

      await expect(client.initiatePayment(validParams)).rejects.toThrow(KhaltiError)
      await expect(client.initiatePayment(validParams)).rejects.toMatchObject({
        code: "validation_error",
        message: "Invalid parameters",
        statusCode: 400,
      })
    })

    it("should handle network errors", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("Network error"))

      await expect(client.initiatePayment(validParams)).rejects.toThrow(KhaltiError)
      await expect(client.initiatePayment(validParams)).rejects.toMatchObject({
        code: ErrorCode.NETWORK_ERROR,
        message: "Network error",
        statusCode: 500,
      })
    })
  })

  describe("verifyPayment", () => {
    const validParams = {
      pidx: "pidx-123",
    }

    const mockResponse = {
      data: {
        status: "Completed",
        total_amount: 10000,
        transactionId: "txn-123",
        fee: 100,
        refunded: false,
      },
    }

    it("should successfully verify a payment", async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse)

      const result = await client.verifyPayment(validParams)

      expect(mockedAxios.post).toHaveBeenCalledWith(`${BASE_URL}${ENDPOINTS.VERIFY_PAYMENT}`, validParams, {
        headers: {
          Authorization: `Key ${mockApiKey}`,
          "Content-Type": "application/json",
        },
      })

      expect(result).toEqual(mockResponse.data)
    })

    it("should handle API error responses", async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: {
            error_key: "resource_not_found",
            error: "Payment not found",
          },
        },
      }

      mockedAxios.post.mockRejectedValueOnce(errorResponse)

      await expect(client.verifyPayment(validParams)).rejects.toThrow(KhaltiError)
      await expect(client.verifyPayment(validParams)).rejects.toMatchObject({
        code: "resource_not_found",
        message: "Payment not found",
        statusCode: 404,
      })
    })
  })

  describe("checkPaymentStatus", () => {
    const pidx = "pidx-123"

    const mockResponse = {
      data: {
        status: "Completed",
        purchaseOrderId: "order-123",
        pidx: "pidx-123",
        amount: 10000,
        createdAt: "2023-01-01T12:00:00Z",
        updatedAt: "2023-01-01T12:05:00Z",
      },
    }

    it("should successfully check payment status", async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse)

      const result = await client.checkPaymentStatus(pidx)

      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${BASE_URL}${ENDPOINTS.PAYMENT_STATUS}`,
        { pidx },
        {
          headers: {
            Authorization: `Key ${mockApiKey}`,
            "Content-Type": "application/json",
          },
        },
      )

      expect(result).toEqual(mockResponse.data)
    })

    it("should handle API error responses", async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: {
            error_key: "resource_not_found",
            error: "Payment not found",
          },
        },
      }

      mockedAxios.post.mockRejectedValueOnce(errorResponse)

      await expect(client.checkPaymentStatus(pidx)).rejects.toThrow(KhaltiError)
      await expect(client.checkPaymentStatus(pidx)).rejects.toMatchObject({
        code: "resource_not_found",
        message: "Payment not found",
        statusCode: 404,
      })
    })
  })
})
