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
