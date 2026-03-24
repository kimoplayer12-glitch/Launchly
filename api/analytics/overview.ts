import admin from "firebase-admin";

type DailyMetric = {
  date: string;
  revenue?: { total?: number };
  payouts?: { total?: number };
  sales?: { orders?: number };
  socials?: {
    byProvider?: Record<
      string,
      { followersDelta?: number; views?: number; engagement?: number }
    >;
  };
};

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

async function getUserId(req: any, res: any) {
  const token = readBearerToken(req);
  if (!token) {
    res.status(401).json({ error: "Missing authorization token" });
    return null;
  }

  try {
    initializeFirebase();
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded.uid;
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const userId = await getUserId(req, res);
  if (!userId) return;

  try {
    const rangeParam = typeof req.query.range === "string" ? req.query.range : "30d";
    const days = rangeParam === "7d" ? 7 : 30;
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    const start = toDateKey(startDate);
    const end = toDateKey(endDate);

    const [daily, connections] = await Promise.all([
      listMetricsByRange(userId, start, end),
      listConnections(userId),
    ]);

    const { totals, engagementRate } = aggregateMetrics(daily);
    const context = {
      range: { start, end, days },
      totals: {
        revenue: totals.revenue,
        payouts: totals.payouts,
        orders: totals.orders,
        followersDelta: totals.followersDelta,
        views: totals.views,
        engagementRate,
      },
    };

    return res.status(200).json({ context, daily, connections });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load analytics";
    return res.status(500).json({ error: message });
  }
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function listMetricsByRange(uid: string, start: string, end: string) {
  const snapshot = await getDb()
    .collection("users")
    .doc(uid)
    .collection("metricsDaily")
    .where("date", ">=", start)
    .where("date", "<=", end)
    .orderBy("date", "asc")
    .get();

  return snapshot.docs.map((doc) => doc.data() as DailyMetric);
}

async function listConnections(uid: string) {
  const snapshot = await getDb()
    .collection("users")
    .doc(uid)
    .collection("connections")
    .get();

  return snapshot.docs.map((doc) => ({
    provider: doc.id,
    ...(doc.data() || {}),
  }));
}

function aggregateMetrics(daily: DailyMetric[]) {
  const totals = daily.reduce(
    (acc, item) => {
      acc.revenue += item.revenue?.total || 0;
      acc.payouts += item.payouts?.total || 0;
      acc.orders += item.sales?.orders || 0;
      acc.followersDelta += sumSocialMetric(item, "followersDelta");
      acc.views += sumSocialMetric(item, "views");
      acc.engagement += sumSocialMetric(item, "engagement");
      return acc;
    },
    { revenue: 0, payouts: 0, orders: 0, followersDelta: 0, views: 0, engagement: 0 }
  );

  const engagementRate =
    totals.views > 0 ? Number((totals.engagement / totals.views).toFixed(4)) : 0;

  return { totals, engagementRate };
}

function sumSocialMetric(
  item: DailyMetric,
  key: "followersDelta" | "views" | "engagement"
) {
  const providerData = item.socials?.byProvider;
  if (!providerData) return 0;
  return Object.values(providerData).reduce((sum, value) => sum + (value[key] || 0), 0);
}
