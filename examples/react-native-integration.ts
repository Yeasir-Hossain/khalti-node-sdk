"use client"

// This example shows how to integrate Khalti with React Native
// Note: This requires a backend server to handle the actual API calls

// File: api.ts
import axios from "axios"

const API_BASE_URL = "https://your-backend-api.com"

export const initiatePayment = async (params: {
  amount: number
  orderId: string
  productName: string
  customerInfo?: {
    name?: string
    email?: string
    phone?: string
  }
}) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/payment/initiate`, params)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || "Payment initiation failed")
    }
    throw new Error("Network error")
  }
}

export const verifyPayment = async (pidx: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/payment/verify?pidx=${pidx}`)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.error || "Payment verification failed")
    }
    throw new Error("Network error")
  }
}

// File: CheckoutScreen.tsx
import { useState } from "react"
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native"
import { WebView } from "react-native-webview"
import { initiatePayment } from "./api"

const CheckoutScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState("")
  const [pidx, setPidx] = useState("")

  const handlePayment = async () => {
    setLoading(true)

    try {
      const response = await initiatePayment({
        amount: 100, // 100 NPR
        orderId: `order-${Date.now()}`,
        productName: "Premium Subscription",
        customerInfo: {
          name: "John Doe",
          email: "john@example.com",
          phone: "9841123456",
        },
      })

      if (response.success) {
        setPaymentUrl(response.paymentUrl)
        setPidx(response.pidx)
      } else {
        Alert.alert("Error", response.error || "Payment initiation failed")
      }
    } catch (error) {
      Alert.alert("Error", error.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleWebViewNavigationStateChange = (newNavState) => {
    // Check if the URL is your return URL
    const { url } = newNavState
    if (url.includes("your-return-url")) {
      // Extract pidx from URL if needed
      // Then navigate to verification screen
      setPaymentUrl("")
      navigation.navigate("PaymentVerification", { pidx })
    }
  }

  if (paymentUrl) {
    return (
      <WebView
        source={{ uri: paymentUrl }}
        onNavigationStateChange={handleWebViewNavigationStateChange}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200ee" />
          </View>
        )}
      />
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Checkout</Text>

      <View style={styles.orderSummary}>
        <Text style={styles.subtitle}>Order Summary</Text>
        <Text>Product: Premium Subscription</Text>
        <Text>Price: NPR 100</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handlePayment} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Pay with Khalti</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  orderSummary: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#5C2D91", // Khalti purple
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
})

export default CheckoutScreen

// File: PaymentVerificationScreen.tsx
import { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity as RNTouchableOpacity,
  ActivityIndicator as RNActivityIndicator,
} from "react-native"
import { verifyPayment } from "./api"

const PaymentVerificationScreen = ({ route, navigation }) => {
  const { pidx } = route.params
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [paymentDetails, setPaymentDetails] = useState(null)

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const response = await verifyPayment(pidx)

        if (response.success) {
          setPaymentDetails(response)
        } else {
          setError(response.error || "Payment verification failed")
        }
      } catch (error) {
        setError(error.message || "An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    checkPaymentStatus()
  }, [pidx])

  return (
    <View style={verificationStyles.container}>
      <Text style={verificationStyles.title}>Payment Verification</Text>

      {loading ? (
        <View style={verificationStyles.loadingContainer}>
          <RNActivityIndicator size="large" color="#6200ee" />
          <Text style={verificationStyles.loadingText}>Verifying your payment...</Text>
        </View>
      ) : error ? (
        <View style={verificationStyles.errorContainer}>
          <Text style={verificationStyles.errorText}>{error}</Text>
        </View>
      ) : (
        <View style={verificationStyles.resultContainer}>
          <Text style={verificationStyles.statusText}>Payment {paymentDetails?.status || "Processed"}</Text>

          {paymentDetails && (
            <View style={verificationStyles.detailsContainer}>
              <Text>Transaction ID: {paymentDetails.transactionId}</Text>
              <Text>Amount: NPR {paymentDetails.amount / 100}</Text>
              <Text>Status: {paymentDetails.status}</Text>
            </View>
          )}

          <RNTouchableOpacity style={verificationStyles.button} onPress={() => navigation.navigate("Home")}>
            <Text style={verificationStyles.buttonText}>Return to Home</Text>
          </RNTouchableOpacity>
        </View>
      )}
    </View>
  )
}

const verificationStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: "#ffebee",
    borderWidth: 1,
    borderColor: "#ef9a9a",
    borderRadius: 8,
  },
  errorText: {
    color: "#c62828",
  },
  resultContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  detailsContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
})
