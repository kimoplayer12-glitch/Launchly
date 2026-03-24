export type ProviderKey =
  | "stripe"
  | "paypal"
  | "shopify"
  | "instagram"
  | "tiktok";

export type ConnectionStatus = "connected" | "disconnected" | "error";

export type SyncStatus = "ok" | "error";

export type ConnectionMetadata = {
  accountName?: string;
  accountId?: string;
  currency?: string;
  shopDomain?: string;
  igUserId?: string;
  tiktokUserId?: string;
};

export type ConnectionDoc = {
  provider: ProviderKey;
  status: ConnectionStatus;
  nangoConnectionId: string;
  connectedAt: string;
  updatedAt: string;
  lastSyncAt?: string | null;
  lastSyncStatus?: SyncStatus | null;
  lastError?: { message: string; code?: string; at: string } | null;
  metadata?: ConnectionMetadata;
};

export type DailyRevenue = {
  total: number;
  currency?: string;
  byProvider: Record<string, number>;
};

export type DailyPayouts = {
  total: number;
  currency?: string;
  byProvider: Record<string, number>;
};

export type DailySales = {
  orders: number;
  gross: number;
  net?: number;
  currency?: string;
  byProvider: Record<string, { orders: number; gross: number; net?: number }>;
};

export type DailySocials = {
  byProvider: Record<
    string,
    { followers: number; followersDelta?: number; views?: number; engagement?: number }
  >;
};

export type DailyMetricsDoc = {
  date: string;
  revenue?: DailyRevenue;
  payouts?: DailyPayouts;
  sales?: DailySales;
  socials?: DailySocials;
  computed?: {
    engagementRate?: number;
    aov?: number;
  };
  createdAt?: string;
  updatedAt?: string;
};

export type ProviderDailyMetrics = {
  date: string;
  revenue?: { total: number; currency?: string };
  payouts?: { total: number; currency?: string };
  sales?: { orders: number; gross: number; net?: number; currency?: string };
  socials?: { followers: number; followersDelta?: number; views?: number; engagement?: number };
};

export type ProviderFetchResult = {
  metrics: ProviderDailyMetrics[];
  metadata?: ConnectionMetadata;
};

export type DateRange = { start: Date; end: Date };
