import type { ProviderKey } from "./types";

const PROVIDERS: ProviderKey[] = [
  "stripe",
  "paypal",
  "shopify",
  "instagram",
  "tiktok",
];

export function getProviderConfigKey(provider: ProviderKey) {
  const envKey = `NANGO_INTEGRATION_${provider.toUpperCase()}`;
  return process.env[envKey] || provider;
}

export function getProviderFromConfigKey(integrationKey: string) {
  return PROVIDERS.find((provider) => getProviderConfigKey(provider) === integrationKey) || null;
}
