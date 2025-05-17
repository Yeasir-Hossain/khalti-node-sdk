import axios from "axios"
import { KhaltiClient } from "../src/client"
import { KhaltiError } from "../src/errors"
import { BASE_URL, ENDPOINTS } from "../src/constants"
import jest from "jest" // Declaring jest variable

// Mock axios
jest.mock("axios")
const mockedAxios = axios as jest.Mocked<typeof axios>

describe("KhaltiClient Payment with Bank", () => {
  let client: KhaltiClient
  const mockApiKey = "test-api-key"

  beforeEach(() => {
    client = new KhaltiClient({ apiKey: mockApiKey })
    jest.clearAllMocks()
  })

  describe("initiatePayment with bank and modes", () => {
    const validParams = {
      purchase_order_id: "order-123",
      amount: 10000,
      return_url: "https://example.com/return",
      website_url: "https://example.com",
      purchase_order_name: "Test Order",
      bank: "bank-123",
      modes: ["E_BANKING"],
      ttl: 1800,
      customer_info: {
        name: "John Doe",
        email: "john@example.com",
        phone: "9801234567",
      },
    }

    const mockResponse = {
      data: {
        payment_url: "https://khalti.com/payment/123",
        pidx: "pidx-123",
        purchase_order_id: "order-123",
        expires_at: "2023-12-31T23:59:59Z",
        expires_in: 3600,
      },
    }

    it("should successfully initiate a payment with bank and modes", async () => {
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

    it("should handle multiple payment modes", async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse)

      const multiModeParams = {
        ...validParams,
        modes: ["E_BANKING", "MOBILE_BANKING", "KHALTI"],
      }

      const result = await client.initiatePayment(multiModeParams)

      expect(mockedAxios.post).toHaveBeenCalledWith(`${BASE_URL}${ENDPOINTS.INITIATE_PAYMENT}`, multiModeParams, {
        headers: {
          Authorization: `Key ${mockApiKey}`,
          "Content-Type": "application/json",
        },
      })

      expect(result).toEqual(mockResponse.data)
    })

    it("should handle mobile banking mode", async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse)

      const mobileBankingParams = {
        ...validParams,
        modes: ["MOBILE_BANKING"],
      }

      const result = await client.initiatePayment(mobileBankingParams)

      expect(mockedAxios.post).toHaveBeenCalledWith(`${BASE_URL}${ENDPOINTS.INITIATE_PAYMENT}`, mobileBankingParams, {
        headers: {
          Authorization: `Key ${mockApiKey}`,
          "Content-Type": "application/json",
        },
      })

      expect(result).toEqual(mockResponse.data)
    })

    it("should handle payment without specifying modes", async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse)

      const noModesParams = { ...validParams }
      delete noModesParams.modes

      const result = await client.initiatePayment(noModesParams)

      expect(mockedAxios.post).toHaveBeenCalledWith(`${BASE_URL}${ENDPOINTS.INITIATE_PAYMENT}`, noModesParams, {
        headers: {
          Authorization: `Key ${mockApiKey}`,
          "Content-Type": "application/json",
        },
      })

      expect(result).toEqual(mockResponse.data)
    })

    it("should handle payment without specifying bank", async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse)

      const noBankParams = { ...validParams }
      delete noBankParams.bank

      const result = await client.initiatePayment(noBankParams)

      expect(mockedAxios.post).toHaveBeenCalledWith(`${BASE_URL}${ENDPOINTS.INITIATE_PAYMENT}`, noBankParams, {
        headers: {
          Authorization: `Key ${mockApiKey}`,
          "Content-Type": "application/json",
        },
      })

      expect(result).toEqual(mockResponse.data)
    })

    it("should handle payment with ttl parameter", async () => {
      mockedAxios.post.mockResolvedValueOnce(mockResponse)

      const ttlParams = {
        ...validParams,
        ttl: 3600, // 1 hour
      }

      const result = await client.initiatePayment(ttlParams)

      expect(mockedAxios.post).toHaveBeenCalledWith(`${BASE_URL}${ENDPOINTS.INITIATE_PAYMENT}`, ttlParams, {
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
          status: 400,
          data: {
            error_key: "validation_error",
            error: "Invalid bank ID",
          },
        },
      }

      mockedAxios.post.mockRejectedValueOnce(errorResponse)

      await expect(client.initiatePayment(validParams)).rejects.toThrow(KhaltiError)
      await expect(client.initiatePayment(validParams)).rejects.toMatchObject({
        code: "validation_error",
        message: "Invalid bank ID",
        statusCode: 400,
      })
    })
  })
})
