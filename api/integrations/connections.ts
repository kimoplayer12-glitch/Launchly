import admin from "firebase-admin";

function initializeFirebase() {
  try {
    return admin.app();
  } catch {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
      });
    }
    return admin.initializeApp({
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
}

function getDb() {
  initializeFirebase();
  return admin.firestore();
}

function readBearerToken(req: any) {
  const header = req.headers.authorization ?? "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

function readUserIdHeader(req: any) {
  const value = req.headers["x-user-id"];
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return null;
}

async function getUserId(req: any) {
  const userIdFromHeader = readUserIdHeader(req);
  if (userIdFromHeader) {
    return userIdFromHeader;
  }
  const token = readBearerToken(req);
  if (!token) return null;
  try {
    initializeFirebase();
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = await getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const snapshot = await getDb()
      .collection("users")
      .doc(userId)
      .collection("connections")
      .get();

    const connections = snapshot.docs.map((doc) => ({
      provider: doc.id,
      ...(doc.data() || {}),
    }));

    return res.status(200).json({ connections });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load connections";
    return res.status(500).json({ error: message });
  }
}
