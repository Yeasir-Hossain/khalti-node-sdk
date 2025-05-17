import { KhaltiClient } from "../src/client"
import { SANDBOX_URL } from "../src/constants"

// This is an integration test file that would run against the actual Khalti API
// In a real-world scenario, you would run these tests in a controlled environment
// with a test API key and sandbox environment

// Skip these tests by default since they require actual API credentials
// Remove the .skip to run these tests with valid credentials
describe.skip("Khalti Integration Tests", () => {
  let client: KhaltiClient

  // Replace with a valid test API key
  const TEST_API_KEY = "test-api-key"

  beforeAll(() => {
    // Use the sandbox URL for testing
    client = new KhaltiClient({
      apiKey: TEST_API_KEY,
      baseUrl: SANDBOX_URL,
      debug: true,
    })
  })

  it("should successfully initiate a payment", async () => {
    const response = await client.initiatePayment({
      purchase_order_id: `test-order-${Date.now()}`,
      amount: 1000, // 10 NPR
      return_url: "https://example.com/return",
      website_url: "https://example.com",
      purchase_order_name: "Test Product",
    })

    expect(response).toBeDefined()
    expect(response.payment_url).toBeDefined()
    expect(response.pidx).toBeDefined()
  }, 10000) // Increase timeout for API call

  it("should handle payment verification", async () => {
    // First initiate a payment
    const initResponse = await client.initiatePayment({
      purchase_order_id: `test-order-${Date.now()}`,
      amount: 1000,
      return_url: "https://example.com/return",
      website_url: "https://example.com",
    })

    // Then try to verify it (it will likely be in "Initiated" state)
    const verifyResponse = await client.verifyPayment({
      pidx: initResponse.pidx,
    })

    expect(verifyResponse).toBeDefined()
    // The payment won't be completed since we didn't actually go through the payment flow
    expect(verifyResponse.status).toBe("Initiated")
  }, 15000)

  it("should check payment status", async () => {
    // First initiate a payment
    const initResponse = await client.initiatePayment({
      purchase_order_id: `test-order-${Date.now()}`,
      amount: 1000,
      return_url: "https://example.com/return",
      website_url: "https://example.com",
    })

    // Then check its status
    const statusResponse = await client.checkPaymentStatus(initResponse.pidx)

    expect(statusResponse).toBeDefined()
    expect(statusResponse.status).toBeDefined()
    expect(statusResponse.pidx).toBe(initResponse.pidx)
  }, 15000)
})
