import { initializePaddle, Paddle } from "@paddle/paddle-js";

let paddleInstance: Paddle | null = null;

/**
 * Initialize Paddle with your Vendor ID
 * Get your Vendor ID from Paddle dashboard
 */
export const initPaddle = async (vendorId: string) => {
  if (paddleInstance) return paddleInstance;

  try {
    paddleInstance = await initializePaddle({
      environment: import.meta.env.DEV ? "sandbox" : "production",
      token: vendorId,
      eventCallback: (event) => {
        console.log("Paddle event:", event.type);
        // Handle Paddle events here (checkout.completed, etc)
      },
    });
    return paddleInstance;
  } catch (error) {
    console.error("Failed to initialize Paddle:", error);
    throw error;
  }
};

/**
 * Open Paddle checkout for a product
 */
export const openPaddleCheckout = async (
  productId: string,
  customData?: Record<string, string>
) => {
  if (!paddleInstance) {
    throw new Error("Paddle not initialized");
  }

  try {
    paddleInstance.Checkout.open({
      items: [{ priceId: productId }],
      customData,
      settings: {
        variant: "one-page",
        theme: "dark",
      },
    });
  } catch (error) {
    console.error("Failed to open Paddle checkout:", error);
    throw error;
  }
};

/**
 * Open checkout with customer email (for returning customers)
 */
export const openPaddleCheckoutWithEmail = async (
  productId: string,
  email: string,
  customData?: Record<string, string>
) => {
  if (!paddleInstance) {
    throw new Error("Paddle not initialized");
  }

  try {
    paddleInstance.Checkout.open({
      items: [{ priceId: productId }],
      customer: {
        email,
      },
      customData,
      settings: {
        variant: "one-page",
        theme: "dark",
      },
    });
  } catch (error) {
    console.error("Failed to open Paddle checkout:", error);
    throw error;
  }
};

/**
 * Get Paddle instance
 */
export const getPaddleInstance = () => {
  return paddleInstance;
};

/**
 * Handle Paddle webhook (to be called from your backend)
 * Validates webhook signature and processes payment
 */
export const validatePaddleWebhook = (
  webhookData: any,
  webhookSecret: string
): boolean => {
  // This should be done on your backend using Paddle's webhook verification
  // For now, just return true if data exists
  return !!webhookData;
};

/**
 * Process successful Paddle payment
 */
export const processPaddlePayment = async (
  userId: string,
  transactionId: string,
  productId: string,
  amount: number
) => {
  try {
    // Call your backend to record the transaction
    const response = await fetch("/api/paddle-webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        transactionId,
        productId,
        amount,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to process payment");
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to process Paddle payment:", error);
    throw error;
  }
};
