import { KhaltiClient } from "../src"

// Example of basic usage of the Khalti SDK

async function main() {
  // Initialize the Khalti client
  const khalti = new KhaltiClient({
    apiKey: "your-api-key-here",
    debug: true, // Enable debug logging
  })

  try {
    // Initiate a payment
    const paymentResponse = await khalti.initiatePayment({
      purchase_order_id: "order-123",
      amount: 10000, // 100 NPR (in paisa)
      return_url: "https://yourwebsite.com/payment/success",
      website_url: "https://yourwebsite.com",
      purchase_order_name: "Premium Subscription",
      customerInfo: {
        name: "John Doe",
        email: "john@example.com",
        phone: "9841123456",
      },
    })

    console.log("Payment initiated:", paymentResponse)
    console.log("Redirect user to:", paymentResponse.payment_url)

    // In a real application, you would redirect the user to paymentResponse.payment_url
    // After payment completion, Khalti will redirect to your return_url with a pidx parameter

    // Simulate receiving a pidx after payment
    const pidx = paymentResponse.pidx

    // Verify the payment
    const verificationResponse = await khalti.verifyPayment({
      pidx: pidx,
    })

    console.log("Payment verification:", verificationResponse)

    // Check payment status
    const statusResponse = await khalti.checkPaymentStatus(pidx)
    console.log("Payment status:", statusResponse)
  } catch (error) {
    console.error("Error:", error)
  }
}

main()
