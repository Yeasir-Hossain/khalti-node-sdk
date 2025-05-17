/**
 * Example demonstrating e-commerce integration with refund functionality
 */
import { KhaltiClient, KhaltiError } from "../src"
import { v4 as uuidv4 } from "uuid"

// Simulated database
interface Order {
  id: string
  customerId: string
  items: Array<{
    productId: string
    name: string
    quantity: number
    unitPrice: number
  }>
  totalAmount: number
  status: "pending" | "paid" | "failed" | "refunded" | "partially_refunded"
  paymentId?: string
  transactionId?: string
  refundedAmount?: number
  createdAt: Date
  updatedAt: Date
}

// Mock database operations
class OrderDatabase {
  private orders: Record<string, Order> = {}

  createOrder(order: Omit<Order, "id" | "createdAt" | "updatedAt">): Order {
    const id = uuidv4()
    const now = new Date()
    const newOrder = {
      ...order,
      id,
      createdAt: now,
      updatedAt: now,
    }

    this.orders[id] = newOrder
    return newOrder
  }

  getOrder(id: string): Order | null {
    return this.orders[id] || null
  }

  updateOrder(id: string, updates: Partial<Order>): Order | null {
    const order = this.getOrder(id)
    if (!order) return null

    const updatedOrder = {
      ...order,
      ...updates,
      updatedAt: new Date(),
    }

    this.orders[id] = updatedOrder
    return updatedOrder
  }
}

// E-commerce payment service
class PaymentService {
  private khaltiClient: KhaltiClient
  private orderDb: OrderDatabase
  private baseUrl: string

  constructor(apiKey: string, baseUrl: string) {
    this.khaltiClient = new KhaltiClient({
      apiKey,
      debug: true,
      isLive: false, // Use sandbox environment for this example
    })
    this.orderDb = new OrderDatabase()
    this.baseUrl = baseUrl
  }

  /**
   * Create a new order
   */
  createOrder(
    customerId: string,
    items: Array<{ productId: string; name: string; quantity: number; unitPrice: number }>,
  ): Order {
    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

    // Create order in database
    return this.orderDb.createOrder({
      customerId,
      items,
      totalAmount,
      status: "pending",
    })
  }

  /**
   * Initiate payment for an order
   */
  async initiatePayment(
    orderId: string,
    customerInfo?: { name?: string; email?: string; phone?: string },
  ): Promise<{ paymentUrl: string; pidx: string }> {
    // Get order from database
    const order = this.orderDb.getOrder(orderId)
    if (!order) {
      throw new Error(`Order not found: ${orderId}`)
    }

    // Prepare product details
    const productDetails = order.items.map((item) => ({
      identity: item.productId,
      name: item.name,
      total_price: item.quantity * item.unitPrice,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }))

    // Initiate payment with Khalti
    try {
      const response = await this.khaltiClient.initiatePayment({
        purchase_order_id: order.id,
        amount: order.totalAmount,
        return_url: `${this.baseUrl}/payment/verify?orderId=${order.id}`,
        website_url: this.baseUrl,
        purchase_order_name: `Order #${order.id}`,
        customer_info: customerInfo,
        product_details: productDetails,
      })

      // Update order with payment ID
      this.orderDb.updateOrder(order.id, {
        paymentId: response.pidx,
      })

      return {
        paymentUrl: response.payment_url,
        pidx: response.pidx,
      }
    } catch (error) {
      // Update order status on failure
      this.orderDb.updateOrder(order.id, {
        status: "failed",
      })

      throw error
    }
  }

  /**
   * Verify payment for an order
   */
  async verifyPayment(orderId: string, pidx: string): Promise<Order> {
    // Get order from database
    const order = this.orderDb.getOrder(orderId)
    if (!order) {
      throw new Error(`Order not found: ${orderId}`)
    }

    // Verify payment with Khalti
    try {
      const response = await this.khaltiClient.verifyPayment({ pidx })

      // Update order status based on payment status
      let status: "pending" | "paid" | "failed" | "refunded" | "partially_refunded"

      switch (response.status) {
        case "Completed":
          status = "paid"
          break
        case "Refunded":
          status = "refunded"
          break
        case "Partially Refunded":
          status = "partially_refunded"
          break
        case "Failed":
        case "Expired":
        case "User canceled":
          status = "failed"
          break
        default:
          status = "pending"
      }

      // Update order in database with transaction ID for future refunds
      const updatedOrder = this.orderDb.updateOrder(order.id, {
        status,
        transactionId: response.transaction_id,
      })

      if (!updatedOrder) {
        throw new Error(`Failed to update order: ${orderId}`)
      }

      return updatedOrder
    } catch (error) {
      // Handle verification errors
      if (error instanceof KhaltiError) {
        // Update order status on failure
        this.orderDb.updateOrder(order.id, {
          status: "failed",
        })
      }

      throw error
    }
  }

  /**
   * Process a full refund for an order
   */
  async refundOrder(orderId: string, mobileNumber: string): Promise<Order> {
    // Get order from database
    const order = this.orderDb.getOrder(orderId)
    if (!order) {
      throw new Error(`Order not found: ${orderId}`)
    }

    // Check if order can be refunded
    if (order.status !== "paid" && order.status !== "partially_refunded") {
      throw new Error(`Order cannot be refunded. Current status: ${order.status}`)
    }

    // Process refund with Khalti
    try {
      const response = await this.khaltiClient.refundPayment({
        mobile: mobileNumber,
      })

      // Update order in database
      const updatedOrder = this.orderDb.updateOrder(order.id, {
        status: "refunded",
        refundedAmount: response.refunded_amount,
      })

      if (!updatedOrder) {
        throw new Error(`Failed to update order: ${orderId}`)
      }

      return updatedOrder
    } catch (error) {
      throw error
    }
  }

  /**
   * Process a partial refund for an order
   */
  async partialRefundOrder(orderId: string, mobileNumber: string, amount: number): Promise<Order> {
    // Get order from database
    const order = this.orderDb.getOrder(orderId)
    if (!order) {
      throw new Error(`Order not found: ${orderId}`)
    }

    // Check if order can be refunded
    if (order.status !== "paid" && order.status !== "partially_refunded") {
      throw new Error(`Order cannot be refunded. Current status: ${order.status}`)
    }

    // Validate refund amount
    if (amount <= 0) {
      throw new Error("Refund amount must be greater than zero")
    }

    if (amount >= order.totalAmount) {
      throw new Error("For full refunds, use refundOrder() instead")
    }

    // Process partial refund with Khalti
    try {
      const response = await this.khaltiClient.refundPayment({
        mobile: mobileNumber,
        amount,
      })

      // Calculate total refunded amount
      const totalRefunded = (order.refundedAmount || 0) + response.refunded_amount

      // Determine new status
      const newStatus = totalRefunded >= order.totalAmount ? "refunded" : "partially_refunded"

      // Update order in database
      const updatedOrder = this.orderDb.updateOrder(order.id, {
        status: newStatus,
        refundedAmount: totalRefunded,
      })

      if (!updatedOrder) {
        throw new Error(`Failed to update order: ${orderId}`)
      }

      return updatedOrder
    } catch (error) {
      throw error
    }
  }
}

// Example usage
async function runEcommerceRefundExample() {
  console.log("Starting E-commerce Refund Example")

  // Initialize payment service
  const paymentService = new PaymentService("test-api-key", "https://example-store.com")

  try {
    // Create a new order
    console.log("\n1. Creating a new order...")
    const order = paymentService.createOrder("customer-123", [
      {
        productId: "product-1",
        name: "Smartphone",
        quantity: 1,
        unitPrice: 2500000, // 25,000 NPR
      },
      {
        productId: "product-2",
        name: "Phone Case",
        quantity: 2,
        unitPrice: 100000, // 1,000 NPR
      },
    ])

    console.log("Order created:", order)

    // Initiate payment
    console.log("\n2. Initiating payment...")
    const payment = await paymentService.initiatePayment(order.id, {
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "9841234567",
    })

    console.log("Payment initiated:", payment)
    console.log("Payment URL:", payment.paymentUrl)

    // In a real application, the user would be redirected to the payment URL
    // After payment, they would be redirected back to your return_url

    // For demonstration purposes, let's simulate a successful payment verification
    console.log("\n3. Simulating payment verification...")

    // Manually update the order with a mock transaction ID for testing
    const orderDb = (paymentService as any).orderDb
    orderDb.updateOrder(order.id, {
      status: "paid",
      transactionId: "mock-transaction-" + Date.now(),
    })

    const verifiedOrder = orderDb.getOrder(order.id)
    console.log("Payment verified, updated order:", verifiedOrder)

    // Process a partial refund
    console.log("\n4. Processing a partial refund...")
    try {
      const partialRefundAmount = 100000 // 1,000 NPR (refund for the phone case)
      const partiallyRefundedOrder = await paymentService.partialRefundOrder(
        order.id,
        "9841234567",
        partialRefundAmount,
      )
      console.log("Partial refund processed:", partiallyRefundedOrder)
    } catch (error) {
      console.log("Partial refund simulation failed (expected in test):", error.message)

      // For demonstration, manually update the order to simulate a partial refund
      orderDb.updateOrder(order.id, {
        status: "partially_refunded",
        refundedAmount: 100000,
      })

      const partiallyRefundedOrder = orderDb.getOrder(order.id)
      console.log("Simulated partial refund:", partiallyRefundedOrder)
    }

    // Process a full refund
    console.log("\n5. Processing a full refund...")
    try {
      const fullyRefundedOrder = await paymentService.refundOrder(order.id, "9841234567")
      console.log("Full refund processed:", fullyRefundedOrder)
    } catch (error) {
      console.log("Full refund simulation failed (expected in test):", error.message)

      // For demonstration, manually update the order to simulate a full refund
      orderDb.updateOrder(order.id, {
        status: "refunded",
        refundedAmount: 2700000, // Total order amount
      })

      const fullyRefundedOrder = orderDb.getOrder(order.id)
      console.log("Simulated full refund:", fullyRefundedOrder)
    }
  } catch (error) {
    console.error("E-commerce refund example failed:", error)
  }
}

// Run the example
runEcommerceRefundExample().catch(console.error)
