import { RequestHandler } from "express";

type GenerateStoreBody = {
  storeName?: string;
  niche?: string;
};

function safe(s: string | undefined, fallback: string) {
  const v = (s || "").trim();
  return v || fallback;
}

/**
 * Generates a simple "storefront" template + Shopify integration instructions.
 * This is an MVP helper: the actual Shopify OAuth + product sync should be done
 * through your Shopify app.
 */
export const handleGenerateStore: RequestHandler = async (req, res) => {
  const body = (req.body || {}) as GenerateStoreBody;
  const storeName = safe(body.storeName, "Your Store");
  const niche = safe(body.niche, "Premium products");

  const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${storeName}</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="nav">
    <div class="container nav-inner">
      <div class="brand">${storeName}</div>
      <div class="muted">${niche}</div>
      <a class="btn" href="#products">Shop</a>
    </div>
  </header>

  <main class="container">
    <section class="hero">
      <h1>${storeName}</h1>
      <p class="muted">A fast storefront starter. Connect Shopify to sync products and checkout.</p>
      <div class="hero-actions">
        <a class="btn" href="#products">Browse products</a>
        <a class="btn ghost" href="#connect">Connect Shopify</a>
      </div>
    </section>

    <section id="products" class="grid">
      <article class="card">
        <h3>Product 1</h3>
        <p class="muted">Replace with real Shopify product data.</p>
        <button class="btn" onclick="alert('Connect Shopify to enable cart/checkout');">Add to cart</button>
      </article>
      <article class="card">
        <h3>Product 2</h3>
        <p class="muted">Replace with real Shopify product data.</p>
        <button class="btn" onclick="alert('Connect Shopify to enable cart/checkout');">Add to cart</button>
      </article>
      <article class="card">
        <h3>Product 3</h3>
        <p class="muted">Replace with real Shopify product data.</p>
        <button class="btn" onclick="alert('Connect Shopify to enable cart/checkout');">Add to cart</button>
      </article>
    </section>

    <section id="connect" class="section">
      <div class="callout">
        <h2>Connect Shopify</h2>
        <p class="muted">To sync products and enable checkout, install your Shopify app and use the Admin API.</p>
        <ol class="muted">
          <li>Create a Shopify app in your Partner dashboard.</li>
          <li>Set the app URL + redirect URLs (OAuth).</li>
          <li>Install it on the store and store the access token server-side.</li>
          <li>Use Storefront API or embedded app + Checkout to complete purchases.</li>
        </ol>
      </div>
    </section>
  </main>

  <footer class="footer"><div class="container">© ${new Date().getFullYear()} ${storeName}</div></footer>
</body>
</html>`;

  const stylesCss = `:root{--bg:#050914;--text:#e7eefc;--muted:#9fb0d0;--card:rgba(255,255,255,.05);--border:rgba(255,255,255,.08)}
*{box-sizing:border-box}body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Inter,Arial;background:radial-gradient(1000px 700px at 20% -10%,rgba(124,58,237,.28),transparent 55%),radial-gradient(900px 600px at 90% 10%,rgba(110,231,183,.16),transparent 50%),var(--bg);color:var(--text)}
.container{width:min(1100px,92%);margin:0 auto}
.muted{color:var(--muted)}
.nav{position:sticky;top:0;background:rgba(0,0,0,.25);backdrop-filter:blur(10px);border-bottom:1px solid var(--border)}
.nav-inner{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 0}
.brand{font-weight:800}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:10px 14px;border-radius:12px;border:1px solid var(--border);background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,.03));color:inherit;cursor:pointer}
.btn.ghost{background:transparent}
.hero{padding:54px 0 20px}
.hero h1{font-size:clamp(34px,5vw,56px);margin:0 0 12px}
.hero-actions{display:flex;gap:10px;flex-wrap:wrap}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:18px 0 0}
.card{padding:18px;border-radius:16px;background:var(--card);border:1px solid var(--border)}
.section{padding:38px 0}
.callout{padding:18px;border-radius:16px;background:rgba(124,58,237,.08);border:1px solid rgba(124,58,237,.35)}
.footer{padding:26px 0;border-top:1px solid var(--border);color:var(--muted);margin-top:40px}
@media (max-width:860px){.grid{grid-template-columns:1fr}}
`;

  res.json({
    success: true,
    template: "static-storefront",
    files: [
      { path: "index.html", content: indexHtml },
      { path: "styles.css", content: stylesCss },
      {
        path: "README.txt",
        content:
          "This is a starter storefront template. To make it a real Shopify store, build a Shopify app and sync products via Admin API or Storefront API.",
      },
    ],
  });
};
