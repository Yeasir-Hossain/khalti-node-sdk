"use client"

// This example shows how to integrate Khalti with Next.js
// File: app/api/payment/initiate/route.ts
import { NextResponse } from "next/server"

// Initialize the Khalti client
const khaltiClient = new KhaltiClient({
  apiKey: process.env.KHALTI_API_KEY || "",
  debug: process.env.NODE_ENV === "development",
  isLive: process.env.NODE_ENV === "production",
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, orderId, productName, customerInfo, bankId, paymentModes } = body

    // Validate request
    if (!amount || !orderId) {
      return NextResponse.json({ error: "Amount and orderId are required" }, { status: 400 })
    }

    // Convert amount to paisa if needed (assuming amount is in NPR)
    const amountInPaisa = amount * 100

    const paymentResponse = await khaltiClient.initiatePayment({
      purchase_order_id: orderId,
      amount: amountInPaisa,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/verify`,
      website_url: process.env.NEXT_PUBLIC_APP_URL || "",
      purchase_order_name: productName || "Product Purchase",
      customer_info: customerInfo || undefined,
      bank: bankId,
      modes: paymentModes,
    })

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResponse.payment_url,
      pidx: paymentResponse.pidx,
    })
  } catch (error: any) {
    console.error("Payment initiation error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred",
      },
      { status: error.statusCode || 500 },
    )
  }
}

// File: app/api/payment/verify/route.ts
import type { NextRequest } from "next/server"

const khaltiVerifyClient = new KhaltiClient({
  apiKey: process.env.KHALTI_API_KEY || "",
  isLive: process.env.NODE_ENV === "production",
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const pidx = searchParams.get("pidx")

    if (!pidx) {
      return NextResponse.json({ error: "Invalid payment reference" }, { status: 400 })
    }

    // Verify the payment
    const verificationResponse = await khaltiVerifyClient.verifyPayment({ pidx })

    // Return the verification result
    return NextResponse.json({
      success: true,
      status: verificationResponse.status,
      transactionId: verificationResponse.transaction_id,
      amount: verificationResponse.total_amount,
    })
  } catch (error: any) {
    console.error("Payment verification error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Payment verification failed",
      },
      { status: error.statusCode || 500 },
    )
  }
}

// File: app/api/banks/[type]/route.ts
import { type NextRequest, NextResponse } from "next/server"
import KhaltiClient from "khalti-node-sdk"

const khaltiBankClient = new KhaltiClient({
  apiKey: process.env.KHALTI_API_KEY || "",
  isLive: process.env.NODE_ENV === "production",
})

export async function getBankTypes(request: NextRequest, { params }: { params: { type: string } }) {
  try {
    const type = params.type

    if (type !== "ebanking" && type !== "mobilecheckout") {
      return NextResponse.json({ error: "Invalid bank type" }, { status: 400 })
    }

    const banks = await khaltiBankClient.getBanks(type as "ebanking" | "mobilecheckout")

    return NextResponse.json({
      success: true,
      banks: banks.records,
    })
  } catch (error: any) {
    console.error("Bank listing error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch banks",
      },
      { status: error.statusCode || 500 },
    )
  }
}
// File: app/checkout/page.tsx
;("use client")

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface Bank {
  idx: string
  name: string
  short_name: string
  logo: string
}

export default function Checkout() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [banks, setBanks] = useState<Bank[]>([])
  const [selectedBank, setSelectedBank] = useState<string>("")
  const [paymentMode, setPaymentMode] = useState<string>("E_BANKING")

  useEffect(() => {
    // Fetch banks when component mounts
    const fetchBanks = async () => {
      try {
        const response = await fetch("/api/banks/ebanking")
        const data = await response.json()

        if (data.success) {
          setBanks(data.banks)
        } else {
          setError(data.error || "Failed to fetch banks")
        }
      } catch (err) {
        setError("An unexpected error occurred while fetching banks")
        console.error(err)
      }
    }

    fetchBanks()
  }, [])

  const handlePayment = async () => {
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: 100, // 100 NPR
          orderId: `order-${Date.now()}`,
          productName: "Premium Subscription",
          customerInfo: {
            name: "John Doe",
            email: "john@example.com",
            phone: "9841123456",
          },
          bankId: selectedBank,
          paymentModes: [paymentMode],
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to Khalti payment page
        window.location.href = data.paymentUrl
      } else {
        setError(data.error || "Payment initiation failed")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>

      <div className="border p-4 rounded mb-4">
        <h2 className="text-xl mb-2">Order Summary</h2>
        <p>Product: Premium Subscription</p>
        <p>Price: NPR 100</p>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="mb-4">
        <label className="block mb-2">Payment Mode</label>
        <select
          value={paymentMode}
          onChange={(e) => setPaymentMode(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="E_BANKING">E-Banking</option>
          <option value="MOBILE_BANKING">Mobile Banking</option>
          <option value="KHALTI">Khalti Wallet</option>
          <option value="CONNECT_IPS">Connect IPS</option>
          <option value="SCT">SCT</option>
        </select>
      </div>

      {(paymentMode === "E_BANKING" || paymentMode === "MOBILE_BANKING") && (
        <div className="mb-4">
          <label className="block mb-2">Select Bank</label>
          <select
            value={selectedBank}
            onChange={(e) => setSelectedBank(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">-- Select a bank --</option>
            {banks.map((bank) => (
              <option key={bank.idx} value={bank.idx}>
                {bank.name} ({bank.short_name})
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={handlePayment}
        disabled={loading || ((paymentMode === "E_BANKING" || paymentMode === "MOBILE_BANKING") && !selectedBank)}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay with Khalti"}
      </button>
    </div>
  )
}
// File: app/payment/verify/page.tsx
;("use client")

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"

export default function VerifyPayment() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pidx = searchParams.get("pidx")
  
  const [status, setStatus] = useState("Verifying payment...")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [paymentDetails, setPaymentDetails] = useState<any>(null)
  
  useEffect(() => {
    if (!pidx) return
    
    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/payment/verify?pidx=${pidx}`)
        const data = await response.json()
        
        if (data.success) {
          setStatus(`Payment ${data.status}`)
          setPaymentDetails(data)
        } else {
          setError(data.error || "Payment verification failed")
        }
      } catch (err) {
        setError("An unexpected error occurred")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    
    verifyPayment()
  }, [pidx])
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Payment Verification</h1>
      
      {loading ? (
        <p>Verifying your payment...</p>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : (
        <div className="border p-4 rounded">
          <h2 className="text-xl mb-2">{status}</h2>
          
          {paymentDetails && (
            <div>
              <p>Transaction ID: {paymentDetails.transactionId}</p>
              <p>Amount: NPR {paymentDetails.amount / 100}</p>
              <p>Status: {paymentDetails.status}</p>
            </div>
          )}
          
          <button
            onClick={() => router.push("/")}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-4 hover:bg-blue-600"
          >
            Return to Home
          </button>
        </div>
      )}
    </div>
  )
}
