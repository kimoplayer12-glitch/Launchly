import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import FooterLinks from "@/components/FooterLinks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/firebase-auth";

type ConnectResp = { url: string; demoMode?: boolean; message?: string; error?: string };

export default function Integrations() {
  const user = useMemo(() => getCurrentUser(), []);
  const [shop, setShop] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      // Let the app's route protection handle redirects, but keep UX clean.
      toast("Please sign in to connect integrations.");
    }
  }, [user]);

  async function getJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    const data = (await res.json()) as T;
    if (!res.ok) throw data;
    return data;
  }

  const connectStripe = async () => {
    setBusy("stripe");
    try {
      const data = await getJson<ConnectResp>("/api/integrations/stripe/connect-url");
      if (data.demoMode) toast(data.message || "Stripe Connect demo mode");
      window.location.href = data.url;
    } catch (e: any) {
      toast(e?.error || "Failed to start Stripe Connect");
    } finally {
      setBusy(null);
    }
  };

  const connectShopify = async () => {
    if (!shop.trim()) {
      toast("Enter your shop domain, e.g. mystore.myshopify.com");
      return;
    }
    setBusy("shopify");
    try {
      const url = `/api/integrations/shopify/install-url?shop=${encodeURIComponent(shop.trim())}`;
      const data = await getJson<ConnectResp>(url);
      if (data.demoMode) toast(data.message || "Shopify demo mode");
      window.location.href = data.url;
    } catch (e: any) {
      toast(e?.error || "Failed to start Shopify install");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">Integrations</h1>
      <p className="text-muted-foreground mb-6">
        Connect Stripe and Shopify so Launchly can monetize your website and sync your store.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="backdrop-blur">
          <CardHeader>
            <CardTitle>Stripe Connect (your business payments)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Lets your users connect their Stripe account to receive payments. In demo mode, this just simulates a connection.
            </p>
            <Button onClick={connectStripe} disabled={busy === "stripe"}>
              {busy === "stripe" ? "Opening..." : "Connect Stripe"}
            </Button>
          </CardContent>
        </Card>

        <Card className="backdrop-blur">
          <CardHeader>
            <CardTitle>Shopify (connect your store)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Install your Shopify app on a store to sync products and power automations.
            </p>
            <div className="flex gap-2">
              <Input
                value={shop}
                onChange={(e) => setShop(e.target.value)}
                placeholder="mystore.myshopify.com"
              />
              <Button onClick={connectShopify} disabled={busy === "shopify"}>
                {busy === "shopify" ? "Opening..." : "Connect"}
              </Button>
            </div>
          </CardContent>
        </Card>
        <FooterLinks />
      </div>
    </div>
  );
}

