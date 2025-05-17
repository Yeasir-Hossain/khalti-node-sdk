/**
 * Example demonstrating payment with bank selection using Khalti SDK
 */
import { KhaltiClient, KhaltiError, type PaymentMode } from "../src"

// Helper function to log steps
const logStep = (step: string): void => {
  console.log("\n" + "=".repeat(50))
  console.log(`STEP: ${step}`)
  console.log("=".repeat(50) + "\n")
}

async function runPaymentWithBankExample() {
  logStep("Initializing Khalti Client")

  // Initialize the client
  const khalti = new KhaltiClient({
    apiKey: "your-api-key-here",
    debug: true,
    isLive: false, // Use sandbox environment
  })

  logStep("Getting Available Banks")
  try {
    // Get list of banks that support e-banking
    const banks = await khalti.getBanks("ebanking")

    if (banks.records.length === 0) {
      console.log("No banks available for e-banking")
      return
    }

    // Select the first bank for this example
    const selectedBank = banks.records[0]
    console.log(`Selected bank: ${selectedBank.name} (${selectedBank.short_name})`)
    console.log(`Bank ID: ${selectedBank.idx}`)

    logStep("Initiating Payment with Bank Selection")

    // Define payment modes
    const paymentModes: PaymentMode[] = ["E_BANKING"]

    // Initiate payment with bank selection
    const paymentResponse = await khalti.initiatePayment({
      purchase_order_id: `order-${Date.now()}`,
      amount: 10000, // 100 NPR
      return_url: "https://example.com/payment/success",
      website_url: "https://example.com",
      purchase_order_name: "Test Order with Bank Selection",
      bank: selectedBank.idx,
      modes: paymentModes,
      ttl: 1800, // 30 minutes
      customer_info: {
        name: "John Doe",
        email: "john@example.com",
        phone: "9801234567",
      },
      amount_breakdown: [
        {
          label: "Product Price",
          amount: 9000,
        },
        {
          label: "Tax",
          amount: 1000,
        },
      ],
      product_details: [
        {
          identity: "product-1",
          name: "Test Product",
          total_price: 10000,
          quantity: 1,
          unit_price: 10000,
        },
      ],
    })

    console.log("Payment initiated successfully:")
    console.log(`- Payment URL: ${paymentResponse.payment_url}`)
    console.log(`- Payment ID (pidx): ${paymentResponse.pidx}`)
    console.log(`- Order ID: ${paymentResponse.purchase_order_id}`)
    console.log(`- Expires at: ${paymentResponse.expires_at}`)
    console.log(`- Expires in: ${paymentResponse.expires_in} seconds`)

    console.log("\nIn a real application, redirect the user to the payment URL:")
    console.log(`window.location.href = "${paymentResponse.payment_url}";`)

    logStep("Mobile Banking Example")

    // Get list of banks that support mobile banking
    const mobileBanks = await khalti.getBanks("mobilecheckout")

    if (mobileBanks.records.length === 0) {
      console.log("No banks available for mobile banking")
      return
    }

    // Select the first mobile banking bank
    const selectedMobileBank = mobileBanks.records[0]
    console.log(`Selected mobile bank: ${selectedMobileBank.name} (${selectedMobileBank.short_name})`)
    console.log(`Bank ID: ${selectedMobileBank.idx}`)

    // Define mobile payment modes
    const mobilePaymentModes: PaymentMode[] = ["MOBILE_BANKING"]

    console.log("\nMobile banking payment initiation example:")
    console.log(`
const mobilePaymentResponse = await khalti.initiatePayment({
  purchase_order_id: "order-${Date.now() + 1}",
  amount: 10000,
  return_url: "https://example.com/payment/success",
  website_url: "https://example.com",
  purchase_order_name: "Mobile Banking Test",
  bank: "${selectedMobileBank.idx}",
  modes: ${JSON.stringify(mobilePaymentModes)},
  ttl: 1800,
  customer_info: {
    name: "John Doe",
    email: "john@example.com",
    phone: "9801234567"
  }
});
    `)
  } catch (error) {
    if (error instanceof KhaltiError) {
      console.error(`Payment Error: ${error.message}`)
      console.error(`Error Code: ${error.code}`)
      console.error(`Status Code: ${error.statusCode}`)
    } else {
      console.error("Unexpected error:", error)
    }
  }
}

// Run the example
runPaymentWithBankExample().catch(console.error)
