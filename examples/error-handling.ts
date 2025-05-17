import { KhaltiClient, KhaltiError, ErrorCode } from "../src"

// Example demonstrating error handling with the Khalti SDK

async function main() {
  // Initialize the Khalti client
  const khalti = new KhaltiClient({
    apiKey: "invalid-api-key", // Using an invalid API key to trigger an error
    debug: true,
  })

  try {
    // Try to initiate a payment with invalid parameters
    const paymentResponse = await khalti.initiatePayment({
      purchase_order_id: "", // Empty order ID (invalid)
      amount: 10000,
      return_url: "https://yourwebsite.com/payment/success",
      website_url: "https://yourwebsite.com",
    })

    console.log("Payment initiated:", paymentResponse)
  } catch (error) {
    if (error instanceof KhaltiError) {
      console.error(`Khalti Error: ${error.message}`)
      console.error(`Error Code: ${error.code}`)
      console.error(`Status Code: ${error.statusCode}`)

      // Handle different error types
      switch (error.code) {
        case ErrorCode.VALIDATION_ERROR:
          console.log("Please check your input parameters")
          break
        case ErrorCode.AUTHENTICATION_ERROR:
          console.log("Invalid API key or authentication failed")
          break
        case ErrorCode.NETWORK_ERROR:
          console.log("Network issue, please check your connection")
          break
        default:
          console.log("An unexpected error occurred")
      }
    } else {
      console.error("Unexpected error:", error)
    }
  }

  // Example with invalid pidx for verification
  try {
    const verificationResponse = await khalti.verifyPayment({
      pidx: "invalid-pidx",
    })

    console.log("Payment verification:", verificationResponse)
  } catch (error) {
    if (error instanceof KhaltiError) {
      console.error(`Verification Error: ${error.message}`)
      console.error(`Error Code: ${error.code}`)
      console.error(`Status Code: ${error.statusCode}`)
    } else {
      console.error("Unexpected error:", error)
    }
  }
}

main()
