/**
 * Example demonstrating refund functionality with Khalti SDK
 */
import { KhaltiClient, KhaltiError } from "../src"

// Helper function to format currency
const formatNPR = (amount: number): string => {
  return `NPR ${(amount / 100).toFixed(2)}`
}

// Helper function to log steps
const logStep = (step: string): void => {
  console.log("\n" + "=".repeat(50))
  console.log(`STEP: ${step}`)
  console.log("=".repeat(50) + "\n")
}

async function runRefundExample() {
  logStep("Initializing Khalti Client")

  // Initialize the client
  const khalti = new KhaltiClient({
    apiKey: "your-api-key-here",
    debug: true,
    isLive: false, // Use sandbox environment
  })

  // For demonstration purposes, we'll use a mock mobile number
  const mobileNumber = "9801234567"

  logStep("Processing a Full Refund")
  try {
    // Process a full refund
    const fullRefundResponse = await khalti.refundPayment({
      mobile: mobileNumber,
    })

    console.log("Full refund processed successfully:")
    console.log(`- Status: ${fullRefundResponse.status}`)
    console.log(`- Transaction ID: ${fullRefundResponse.transactionId}`)
    console.log(`- Refunded Amount: ${formatNPR(fullRefundResponse.refunded_amount)}`)
    console.log(`- Refunded At: ${fullRefundResponse.refunded_at}`)

    logStep("Processing a Partial Refund")

    // Process a partial refund
    const partialRefundResponse = await khalti.refundPayment({
      mobile: mobileNumber,
      amount: 5000, // 50 NPR
    })

    console.log("Partial refund processed successfully:")
    console.log(`- Status: ${partialRefundResponse.status}`)
    console.log(`- Transaction ID: ${partialRefundResponse.transactionId}`)
    console.log(`- Refunded Amount: ${formatNPR(partialRefundResponse.refunded_amount)}`)
    console.log(`- Remaining Amount: ${formatNPR(partialRefundResponse.remaining_amount || 0)}`)
    console.log(`- Refunded At: ${partialRefundResponse.refunded_at}`)
  } catch (error) {
    if (error instanceof KhaltiError) {
      console.error(`Refund Error: ${error.message}`)
      console.error(`Error Code: ${error.code}`)
      console.error(`Status Code: ${error.statusCode}`)
    } else {
      console.error("Unexpected error:", error)
    }
  }
}

// Run the example
runRefundExample().catch(console.error)
