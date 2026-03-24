import { RequestHandler } from "express";
import { getDatabase } from "../firebase-init.js";

// In-memory fallback for development when Firebase is unavailable
const inMemoryUsers: Record<string, any> = {};

/**
 * Admin endpoint to add credits to a user
 * Protected by admin secret key
 */
export const handleAdminAddCredits: RequestHandler = async (req, res) => {
  try {
    const { displayName, amount } = req.body;
    const adminKey = req.headers["x-admin-key"];

    console.log("[Admin Add Credits] Request received:", { displayName, amount });

    // Verify admin key
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      console.error("[Admin Add Credits] Invalid admin key");
      return res.status(401).json({
        error: "Unauthorized: Invalid admin key",
      });
    }

    // Validate input
    if (!displayName || !amount || typeof amount !== "number" || amount <= 0) {
      console.error("[Admin Add Credits] Invalid input:", { displayName, amount });
      return res.status(400).json({
        error: "Invalid request: displayName and positive amount required",
      });
    }

    const db: any = getDatabase();
    let foundUid = null;
    let foundUser: Record<string, any> | null = null;
    let previousBalance = 0;

    if (db) {
      // Try Firebase database first
      try {
        console.log("[Admin Add Credits] Searching in Firebase...");
        const usersSnapshot = await db.ref("users").once("value");
        const users = usersSnapshot.val();

        if (!users) {
          console.warn("[Admin Add Credits] No users found in Firebase");
        } else {
          for (const [uid, userData] of Object.entries(users)) {
            const user = userData as Record<string, any>;
            const userDisplayName = user?.displayName || "";
            
            if (
              userDisplayName === displayName ||
              userDisplayName.toLowerCase().includes(displayName.toLowerCase())
            ) {
              foundUid = uid;
              foundUser = user;
              previousBalance = user?.credits?.currentCredits || 0;
              console.log("[Admin Add Credits] Found user in Firebase:", { uid, displayName: userDisplayName });
              break;
            }
          }
        }

        if (foundUid && foundUser) {
          // Update in Firebase
          const newBalance = previousBalance + amount;
          await db.ref(`users/${foundUid}/credits`).update({
            currentCredits: newBalance,
            lastUpdated: new Date().toISOString(),
          });

          console.log("[Admin Add Credits] Success in Firebase:", { uid: foundUid, previousBalance, amount, newBalance });
          return res.json({
            success: true,
            message: `Successfully added ${amount} credits to ${foundUser?.displayName}`,
            user: {
              uid: foundUid,
              displayName: foundUser?.displayName,
              email: foundUser?.email,
            },
            credits: {
              previousBalance,
              added: amount,
              newBalance,
            },
          });
        }
      } catch (dbError) {
        console.warn("[Admin Add Credits] Firebase query failed:", dbError);
        // Fall through to in-memory fallback
      }
    }

    // Fallback to in-memory storage for development
    console.log("[Admin Add Credits] Using in-memory fallback");
    
    // Search in memory
    for (const [uid, user] of Object.entries(inMemoryUsers)) {
      const userDisplayName = user?.displayName || "";
      if (
        userDisplayName === displayName ||
        userDisplayName.toLowerCase().includes(displayName.toLowerCase())
      ) {
        foundUid = uid;
        foundUser = user;
        previousBalance = user?.credits?.currentCredits || 0;
        break;
      }
    }

    // If not found in memory, create a test entry
    if (!foundUid) {
      foundUid = `user_${Date.now()}`;
      foundUser = {
        displayName,
        email: `${displayName.replace(/\s+/g, ".")}@example.com`,
        credits: {
          currentCredits: 0,
          monthlyLimit: 1000,
          dailyLimit: 100,
        },
      };
      inMemoryUsers[foundUid] = foundUser;
      console.log("[Admin Add Credits] Created test user:", { uid: foundUid, displayName });
    }

    // Update in memory
    previousBalance = foundUser.credits?.currentCredits || 0;
    const newBalance = previousBalance + amount;
    foundUser.credits = {
      ...foundUser.credits,
      currentCredits: newBalance,
      lastUpdated: new Date().toISOString(),
    };

    console.log("[Admin Add Credits] Success (in-memory):", { uid: foundUid, previousBalance, amount, newBalance });
    return res.json({
      success: true,
      message: `Successfully added ${amount} credits to ${foundUser?.displayName}`,
      user: {
        uid: foundUid,
        displayName: foundUser?.displayName,
        email: foundUser?.email,
      },
      credits: {
        previousBalance,
        added: amount,
        newBalance,
      },
      note: "⚠️ This data is stored in memory and will be lost on server restart. For production, use Firebase credentials.",
    });
  } catch (error) {
    console.error("[Admin Add Credits] Error:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to add credits",
      debug: process.env.NODE_ENV === "development" ? String(error) : undefined,
    });
  }
};
