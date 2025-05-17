import axios from "axios"
import { KhaltiClient } from "../src/client"
import { KhaltiError, ErrorCode } from "../src/errors"
import { ENDPOINTS } from "../src/constants"
import jest from "jest" // Declaring jest variable

// Mock axios
jest.mock("axios")
const mockedAxios = axios as jest.Mocked<typeof axios>

describe("KhaltiClient Refund", () => {
  let client: KhaltiClient
  const mockApiKey = "test-api-key"

  beforeEach(() => {
    client = new KhaltiClient({ apiKey: mockApiKey })
    jest.clearAllMocks()
  })

  describe("refundPayment", () => {
    const mobileNumber = "9801234567"
    const refundEndpoint = ENDPOINTS.REFUND

    const mockFullRefundResponse = {
      data: {
        status: "Refunded",
        transactionId: "txn-123",
        refunded_amount: 10000,
        refunded_at: "2023-01-01T12:00:00Z",
      },
    }

    const mockPartialRefundResponse = {
      data: {
        status: "Partially Refunded",
        transactionId: "txn-123",
        refunded_amount: 5000,
        remaining_amount: 5000,
        refunded_at: "2023-01-01T12:00:00Z",
      },
    }

    it("should successfully process a full refund", async () => {
      mockedAxios.post.mockResolvedValueOnce(mockFullRefundResponse)

      const result = await client.refundPayment({ mobile: mobileNumber })

      expect(mockedAxios.post).toHaveBeenCalledWith(
        refundEndpoint,
        { mobile: mobileNumber }, // Only mobile for full refund
        {
          headers: {
            Authorization: `Key ${mockApiKey}`,
            "Content-Type": "application/json",
          },
        },
      )

      expect(result).toEqual(mockFullRefundResponse.data)
      expect(result.status).toBe("Refunded")
      expect(result.refunded_amount).toBe(10000)
    })

    it("should successfully process a partial refund", async () => {
      mockedAxios.post.mockResolvedValueOnce(mockPartialRefundResponse)

      const amount = 5000
      const result = await client.refundPayment({ mobile: mobileNumber, amount })

      expect(mockedAxios.post).toHaveBeenCalledWith(
        refundEndpoint,
        { mobile: mobileNumber, amount }, // Include amount for partial refund
        {
          headers: {
            Authorization: `Key ${mockApiKey}`,
            "Content-Type": "application/json",
          },
        },
      )

      expect(result).toEqual(mockPartialRefundResponse.data)
      expect(result.status).toBe("Partially Refunded")
      expect(result.refunded_amount).toBe(5000)
      expect(result.remaining_amount).toBe(5000)
    })

    it("should throw validation error for missing mobile number", async () => {
      await expect(client.refundPayment({ mobile: "" })).rejects.toThrow(KhaltiError)
      await expect(client.refundPayment({ mobile: "" })).rejects.toMatchObject({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Mobile number is required",
      })
    })

    it("should handle API error responses", async () => {
      const errorResponse = {
        response: {
          status: 404,
          data: {
            error_key: "resource_not_found",
            error: "No transaction found for this mobile number",
          },
        },
      }

      mockedAxios.post.mockRejectedValueOnce(errorResponse)

      await expect(client.refundPayment({ mobile: mobileNumber })).rejects.toThrow(KhaltiError)
      await expect(client.refundPayment({ mobile: mobileNumber })).rejects.toMatchObject({
        code: "resource_not_found",
        message: "No transaction found for this mobile number",
        statusCode: 404,
      })
    })

    it("should handle network errors", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("Network error"))

      await expect(client.refundPayment({ mobile: mobileNumber })).rejects.toThrow(KhaltiError)
      await expect(client.refundPayment({ mobile: mobileNumber })).rejects.toMatchObject({
        code: ErrorCode.NETWORK_ERROR,
        message: "Network error",
        statusCode: 500,
      })
    })

    it("should handle zero amount for partial refund", async () => {
      mockedAxios.post.mockResolvedValueOnce(mockFullRefundResponse)

      // Zero amount should be treated as a full refund
      const result = await client.refundPayment({ mobile: mobileNumber, amount: 0 })

      expect(mockedAxios.post).toHaveBeenCalledWith(
        refundEndpoint,
        { mobile: mobileNumber }, // Only mobile for full refund
        expect.anything(),
      )

      expect(result).toEqual(mockFullRefundResponse.data)
    })

    it("should handle negative amount for partial refund", async () => {
      mockedAxios.post.mockResolvedValueOnce(mockFullRefundResponse)

      // Negative amount should be treated as a full refund
      const result = await client.refundPayment({ mobile: mobileNumber, amount: -100 })

      expect(mockedAxios.post).toHaveBeenCalledWith(
        refundEndpoint,
        { mobile: mobileNumber }, // Only mobile for full refund
        expect.anything(),
      )

      expect(result).toEqual(mockFullRefundResponse.data)
    })
  })
})
