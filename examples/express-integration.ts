import express from "express"
import { KhaltiClient, KhaltiError } from "../src"

// Example of integrating Khalti SDK with Express.js

const app = express()
app.use(express.json())

// Initialize the Khalti client
const khalti = new KhaltiClient({
  apiKey: process.env.KHALTI_API_KEY || "your-api-key-here",
  debug: true,
})

// Route to initiate payment
app.post("/api/payment/initiate", async (req, res) => {
  try {
    const { amount, orderId, productName, customerInfo } = req.body

    // Validate request
    if (!amount || !orderId) {
      return res.status(400).json({ error: "Amount and orderId are required" })
    }

    // Convert amount to paisa if needed (assuming amount is in NPR)
    const amountInPaisa = amount * 100

    const paymentResponse = await khalti.initiatePayment({
      purchase_order_id: orderId,
      amount: amountInPaisa,
      return_url: `${process.env.APP_URL || "https://yourwebsite.com"}/payment/verify`,
      website_url: process.env.APP_URL || "https://yourwebsite.com",
      purchase_order_name: productName || "Product Purchase",
      customerInfo: customerInfo || undefined,
    })

    res.json({
      success: true,
      paymentUrl: paymentResponse.payment_url,
      pidx: paymentResponse.pidx,
    })
  } catch (error) {
    console.error("Payment initiation error:", error)

    if (error instanceof KhaltiError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      })
    }

    res.status(500).json({
      success: false,
      error: "An unexpected error occurred",
    })
  }
})

// Route to verify payment (callback from Khalti)
app.get("/payment/verify", async (req, res) => {
  try {
    const { pidx } = req.query

    if (!pidx || typeof pidx !== "string") {
      return res.status(400).send("Invalid payment reference")
    }

    // Verify the payment
    const verificationResponse = await khalti.verifyPayment({ pidx })

    // Check if payment was successful
    if (verificationResponse.status === "Completed") {
      // Update your database, mark order as paid, etc.

      // Redirect to success page
      return res.redirect("/payment/success?orderId=" + verificationResponse.transactionId)
    } else {
      // Payment failed or is pending
      return res.redirect(`/payment/failed?status=${verificationResponse.status}`)
    }
  } catch (error) {
    console.error("Payment verification error:", error)
    res.redirect("/payment/failed?error=verification_failed")
  }
})

// Success and failure routes
app.get("/payment/success", (req, res) => {
  res.send(`Payment successful! Order ID: ${req.query.orderId}`)
})

app.get("/payment/failed", (req, res) => {
  res.send(`Payment failed. Status: ${req.query.status || req.query.error || "Unknown error"}`)
})

// Start the server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
