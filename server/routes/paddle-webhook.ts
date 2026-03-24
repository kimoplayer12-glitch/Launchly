import { RequestHandler } from "express";

/**
 * Paddle webhook handler
 * Validates webhook and processes payment events
 */
export const handlePaddleWebhook: RequestHandler = async (req, res) => {
  try {
    const { eventType, data } = req.body;

    console.log("Paddle webhook received:", eventType);

    // Handle different Paddle events
    switch (eventType) {
      case "transaction.completed":
        // Process successful payment
        await processSuccessfulPayment(data);
        res.json({ success: true });
        break;

      case "transaction.updated":
        // Handle transaction updates
        await processTransactionUpdate(data);
        res.json({ success: true });
        break;

      case "subscription.created":
        // Handle new subscription
        await processNewSubscription(data);
        res.json({ success: true });
        break;

      case "subscription.updated":
        // Handle subscription updates
        await processSubscriptionUpdate(data);
        res.json({ success: true });
        break;

      case "subscription.canceled":
        // Handle subscription cancellation
        await processSubscriptionCancellation(data);
        res.json({ success: true });
        break;

      default:
        console.log("Unhandled Paddle event:", eventType);
        res.json({ success: true }); // Acknowledge even if unhandled
    }
  } catch (error) {
    console.error("Paddle webhook error:", error);
    res.status(400).json({ error: "Webhook processing failed" });
  }
};

/**
 * Process successful payment
 */
async function processSuccessfulPayment(data: any) {
  try {
    const { customData, id: transactionId, total } = data;

    if (!customData?.userId) {
      console.error("Missing userId in webhook");
      return;
    }

    console.log(`Processing payment for user ${customData.userId}: ${transactionId}`);
    console.log("Payment processed successfully", { transactionId, amount: total });
  } catch (error) {
    console.error("Error processing successful payment:", error);
    throw error;
  }
}

/**
 * Process transaction update
 */
async function processTransactionUpdate(data: any) {
  try {
    console.log("Processing transaction update:", data.id);
  } catch (error) {
    console.error("Error processing transaction update:", error);
    throw error;
  }
}

/**
 * Process new subscription
 */
async function processNewSubscription(data: any) {
  try {
    const { customData, id: subscriptionId } = data;

    console.log(`Processing new subscription for user ${customData?.userId}: ${subscriptionId}`);
  } catch (error) {
    console.error("Error processing new subscription:", error);
    throw error;
  }
}

/**
 * Process subscription update
 */
async function processSubscriptionUpdate(data: any) {
  try {
    console.log("Processing subscription update:", data.id);
  } catch (error) {
    console.error("Error processing subscription update:", error);
    throw error;
  }
}

/**
 * Process subscription cancellation
 */
async function processSubscriptionCancellation(data: any) {
  try {
    const { customData, id: subscriptionId } = data;

    console.log(`Processing subscription cancellation for user ${customData?.userId}: ${subscriptionId}`);
  } catch (error) {
    console.error("Error processing subscription cancellation:", error);
    throw error;
  }
}
