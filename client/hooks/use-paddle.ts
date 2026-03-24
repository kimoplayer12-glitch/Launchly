import { useEffect, useState } from "react";
import { initPaddle, openPaddleCheckoutWithEmail, getPaddleInstance } from "@/lib/paddle";
import { useFirebaseAuth } from "./use-firebase-auth";

const PADDLE_VENDOR_ID = import.meta.env.VITE_PADDLE_VENDOR_ID;

/**
 * Hook to manage Paddle payment integration
 */
export const usePaddle = () => {
  const { user } = useFirebaseAuth();
  const [paddleReady, setPaddleReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Paddle on mount
  useEffect(() => {
    const setupPaddle = async () => {
      try {
        if (!PADDLE_VENDOR_ID) {
          console.warn("Paddle Vendor ID not configured");
          setIsLoading(false);
          return;
        }

        await initPaddle(PADDLE_VENDOR_ID);
        setPaddleReady(true);
      } catch (error) {
        console.error("Failed to initialize Paddle:", error);
      } finally {
        setIsLoading(false);
      }
    };

    setupPaddle();
  }, []);

  /**
   * Open checkout for a specific price
   */
  const checkout = async (priceId: string, metadata?: Record<string, string>) => {
    if (!paddleReady) {
      console.error("Paddle is not ready");
      return;
    }

    try {
      if (user?.email) {
        await openPaddleCheckoutWithEmail(priceId, user.email, {
          userId: user.uid,
          ...metadata,
        });
      } else {
        console.error("User email required for checkout");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      throw error;
    }
  };

  /**
   * Check if Paddle is available (vendor ID configured)
   */
  const isAvailable = !!PADDLE_VENDOR_ID;

  return {
    paddleReady,
    isLoading,
    isAvailable,
    checkout,
    getPaddle: getPaddleInstance,
  };
};
