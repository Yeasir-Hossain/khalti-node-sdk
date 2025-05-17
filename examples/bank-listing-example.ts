/**
 * Example demonstrating bank listing functionality with Khalti SDK
 */
import { KhaltiClient, KhaltiError } from "../src"

// Helper function to log steps
const logStep = (step: string): void => {
  console.log("\n" + "=".repeat(50))
  console.log(`STEP: ${step}`)
  console.log("=".repeat(50) + "\n")
}

async function runBankListingExample() {
  logStep("Initializing Khalti Client")

  // Initialize the client
  const khalti = new KhaltiClient({
    apiKey: "your-api-key-here",
    debug: true,
    isLive: false, // Use sandbox environment
  })

  logStep("Getting E-Banking Banks")
  try {
    // Get list of banks that support e-banking
    const ebankingBanks = await khalti.getBanks("ebanking")

    console.log("E-Banking Banks:")
    console.log(`Total banks: ${ebankingBanks.total_records}`)
    console.log(`Current page: ${ebankingBanks.current_page} of ${ebankingBanks.total_pages}`)

    // Display first 3 banks (or fewer if less are available)
    const banksToShow = ebankingBanks.records.slice(0, 3)
    banksToShow.forEach((bank, index) => {
      console.log(`\nBank ${index + 1}:`)
      console.log(`- Name: ${bank.name} (${bank.short_name})`)
      console.log(`- ID: ${bank.idx}`)
      console.log(`- Has E-Banking: ${bank.has_ebanking ? "Yes" : "No"}`)
      console.log(`- E-Banking URL: ${bank.ebanking_url || "N/A"}`)
      console.log(`- Logo: ${bank.logo}`)
    })

    if (ebankingBanks.records.length > 3) {
      console.log(`\n... and ${ebankingBanks.records.length - 3} more banks`)
    }

    logStep("Getting Mobile Banking Banks")

    // Get list of banks that support mobile banking
    const mobileBanks = await khalti.getBanks("mobilecheckout")

    console.log("Mobile Banking Banks:")
    console.log(`Total banks: ${mobileBanks.total_records}`)
    console.log(`Current page: ${mobileBanks.current_page} of ${mobileBanks.total_pages}`)

    // Display first 3 banks (or fewer if less are available)
    const mobileBanksToShow = mobileBanks.records.slice(0, 3)
    mobileBanksToShow.forEach((bank, index) => {
      console.log(`\nBank ${index + 1}:`)
      console.log(`- Name: ${bank.name} (${bank.short_name})`)
      console.log(`- ID: ${bank.idx}`)
      console.log(`- Has Mobile Checkout: ${bank.has_mobile_checkout ? "Yes" : "No"}`)
      console.log(`- Has Mobile Banking: ${bank.has_mobile_banking ? "Yes" : "No"}`)
      console.log(`- Play Store: ${bank.play_store || "N/A"}`)
      console.log(`- App Store: ${bank.app_store || "N/A"}`)
    })

    if (mobileBanks.records.length > 3) {
      console.log(`\n... and ${mobileBanks.records.length - 3} more banks`)
    }

    logStep("Using Bank Information for Payment")

    // Example: How to use bank information for payment
    if (ebankingBanks.records.length > 0) {
      const selectedBank = ebankingBanks.records[0]
      console.log(`Selected bank for payment: ${selectedBank.name} (${selectedBank.idx})`)

      console.log("\nPayment initiation example with bank:")
      console.log(`
const paymentResponse = await khalti.initiatePayment({
  purchase_order_id: "order-123",
  amount: 10000, // 100 NPR
  return_url: "https://example.com/return",
  website_url: "https://example.com",
  purchase_order_name: "Test Order",
  bank: "${selectedBank.idx}",
  modes: ["E_BANKING"],
  customer_info: {
    name: "John Doe",
    email: "john@example.com",
    phone: "9801234567"
  }
});
      `)
    }
  } catch (error) {
    if (error instanceof KhaltiError) {
      console.error(`Bank Listing Error: ${error.message}`)
      console.error(`Error Code: ${error.code}`)
      console.error(`Status Code: ${error.statusCode}`)
    } else {
      console.error("Unexpected error:", error)
    }
  }
}

// Run the example
runBankListingExample().catch(console.error)
