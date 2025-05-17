import axios from "axios"
import { KhaltiClient } from "../src/client"
import { KhaltiError, ErrorCode } from "../src/errors"
import { BASE_URL, ENDPOINTS } from "../src/constants"
import jest from "jest" // Import jest to declare it

// Mock axios
jest.mock("axios")
const mockedAxios = axios as jest.Mocked<typeof axios>

describe("KhaltiClient Banks", () => {
  let client: KhaltiClient
  const mockApiKey = "test-api-key"

  beforeEach(() => {
    client = new KhaltiClient({ apiKey: mockApiKey })
    jest.clearAllMocks()
  })

  describe("getBanks", () => {
    const mockBanksResponse = {
      data: {
        total_pages: 1,
        total_records: 2,
        next: null,
        previous: null,
        record_range: [1, 2],
        current_page: 1,
        records: [
          {
            idx: "bank1",
            name: "Test Bank 1",
            short_name: "TB1",
            logo: "https://example.com/logo1.png",
            swift_code: "TB1CODE",
            has_cardpayment: false,
            address: "Test Address 1",
            ebanking_url: "https://ebanking.testbank1.com",
            has_ebanking: true,
            has_mobile_checkout: true,
            has_direct_withdraw: true,
            has_nchl: false,
            has_mobile_banking: true,
            play_store: "https://play.google.com/store/apps/testbank1",
            app_store: "https://apps.apple.com/app/testbank1",
            branches: [],
          },
          {
            idx: "bank2",
            name: "Test Bank 2",
            short_name: "TB2",
            logo: "https://example.com/logo2.png",
            swift_code: "TB2CODE",
            has_cardpayment: true,
            address: "Test Address 2",
            ebanking_url: "https://ebanking.testbank2.com",
            has_ebanking: true,
            has_mobile_checkout: false,
            has_direct_withdraw: true,
            has_nchl: true,
            has_mobile_banking: false,
            play_store: "",
            app_store: "",
            branches: [],
          },
        ],
      },
    }

    it("should successfully get ebanking banks", async () => {
      mockedAxios.get.mockResolvedValueOnce(mockBanksResponse)

      const result = await client.getBanks("ebanking")

      expect(mockedAxios.get).toHaveBeenCalledWith(`${BASE_URL}${ENDPOINTS.BANKS}`, {
        params: { payment_type: "ebanking" },
        headers: {
          Authorization: `Key ${mockApiKey}`,
          "Content-Type": "application/json",
        },
      })

      expect(result).toEqual(mockBanksResponse.data)
      expect(result.records.length).toBe(2)
      expect(result.records[0].name).toBe("Test Bank 1")
    })

    it("should successfully get mobilecheckout banks", async () => {
      mockedAxios.get.mockResolvedValueOnce(mockBanksResponse)

      const result = await client.getBanks("mobilecheckout")

      expect(mockedAxios.get).toHaveBeenCalledWith(`${BASE_URL}${ENDPOINTS.BANKS}`, {
        params: { payment_type: "mobilecheckout" },
        headers: {
          Authorization: `Key ${mockApiKey}`,
          "Content-Type": "application/json",
        },
      })

      expect(result).toEqual(mockBanksResponse.data)
    })

    it("should handle API error responses", async () => {
      const errorResponse = {
        response: {
          status: 401,
          data: {
            error_key: "authentication_error",
            error: "Invalid API key",
          },
        },
      }

      mockedAxios.get.mockRejectedValueOnce(errorResponse)

      await expect(client.getBanks("ebanking")).rejects.toThrow(KhaltiError)
      await expect(client.getBanks("ebanking")).rejects.toMatchObject({
        code: "authentication_error",
        message: "Invalid API key",
        statusCode: 401,
      })
    })

    it("should handle network errors", async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error("Network error"))

      await expect(client.getBanks("ebanking")).rejects.toThrow(KhaltiError)
      await expect(client.getBanks("ebanking")).rejects.toMatchObject({
        code: ErrorCode.NETWORK_ERROR,
        message: "Network error",
        statusCode: 500,
      })
    })
  })
})
