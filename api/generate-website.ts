import fs from "fs";
import path from "path";

function makeIndexHtml({ brandName, tagline, primaryColor, accentColor, style }: any) {
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${brandName}</title>
  <link rel="stylesheet" href="/preview/${"SITE_ID"}/styles.css" />
</head>
<body>
  <header class="site-hero">
    <div class="container">
      <h1>${brandName}</h1>
      <p class="tagline">${tagline}</p>
      <a class="cta" href="#contact">Get Started</a>
    </div>
  </header>
  <main class="container">
    <section class="features">
      <div class="card">Fast</div>
      <div class="card">AI-Powered</div>
      <div class="card">Beautiful</div>
    </section>
    <section id="contact" class="contact">
      <h2>Contact Us</h2>
      <p>Reach out to learn more.</p>
    </section>
  </main>
  <script src="/preview/${"SITE_ID"}/main.js"></script>
</body>
</html>`;
}

function makeStyles({ primaryColor, accentColor }: any) {
  return `:root{--primary:${primaryColor};--accent:${accentColor};}
body{font-family:Inter,system-ui,Segoe UI,Roboto,-apple-system;margin:0;background:radial-gradient(circle at 10% 20%, rgba(0,0,0,0.6), rgba(10,10,10,1));color:#e6eef6}
.container{max-width:960px;margin:0 auto;padding:40px}
.site-hero{padding:80px 0;text-align:center;background:var(--primary);color:#001}
.site-hero h1{font-size:48px;margin:0}
.tagline{opacity:0.9}
.cta{display:inline-block;margin-top:18px;padding:12px 22px;border-radius:10px;background:var(--accent);color:#fff;text-decoration:none}
.features{display:flex;gap:12px;margin-top:28px}
.card{flex:1;padding:20px;border-radius:12px;background:rgba(255,255,255,0.03);text-align:center}
.contact{margin-top:36px;padding:24px;background:rgba(255,255,255,0.02);border-radius:10px}`;
}

function makeMainJs() {
  return `document.addEventListener('DOMContentLoaded',()=>{const ctas=document.querySelectorAll('.cta');ctas.forEach(c=>c.addEventListener('click',(e)=>{e.preventDefault();alert('Thanks for trying the demo!')});});`;
}

export default async (req: any, res: any) => {
  try {
    const { brandName = 'My Site', tagline = '', primaryColor = '#00D9FF', accentColor = '#D946EF', style = 'Modern', prompt = '' } = req.body || {};

    // If an AI API key is provided attempt to ask the model to generate site files
    let aiFiles: { index?: string; styles?: string; mainjs?: string } | null = null;
    try {
      const apiKey = process.env.AI_API_KEY;
      const apiUrl = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';
      if (apiKey) {
        const system = `You are a website generator. Given a short prompt, return a JSON object with keys: index, styles, mainjs. Keep HTML/CSS/JS minimal and self-contained.`;
        const user = `Prompt: ${prompt}\nBrand: ${brandName}\nTagline: ${tagline}\nStyle: ${style}`;

        const body = {
          model: process.env.AI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          max_tokens: 2000,
          temperature: 0.7,
        };

        const r = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        });

        const jr = await r.json();
        // Try to extract JSON from model content
        const content = jr?.choices?.[0]?.message?.content || jr?.choices?.[0]?.text || '';
        try {
          const parsed = JSON.parse(content);
          aiFiles = { index: parsed.index, styles: parsed.styles, mainjs: parsed.mainjs };
        } catch (e) {
          // If model returned code block with JSON, try to extract
          const match = content.match(/```(?:json)?([\s\S]*?)```/);
          if (match) {
            try {
              const parsed2 = JSON.parse(match[1].trim());
              aiFiles = { index: parsed2.index, styles: parsed2.styles, mainjs: parsed2.mainjs };
            } catch (ee) {
              // ignore
            }
          }
        }
      }
    } catch (aiErr) {
      console.warn('AI generation failed, falling back to template', aiErr);
    }

    const siteId = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const previewDir = path.join(process.cwd(), 'public', 'preview', siteId);
    fs.mkdirSync(previewDir, { recursive: true });

    const index = makeIndexHtml({ brandName, tagline, primaryColor, accentColor, style }).replace(/SITE_ID/g, siteId);
    const styles = makeStyles({ primaryColor, accentColor });
    const mainjs = makeMainJs();

    fs.writeFileSync(path.join(previewDir, 'index.html'), index, 'utf8');
    fs.writeFileSync(path.join(previewDir, 'styles.css'), styles, 'utf8');
    fs.writeFileSync(path.join(previewDir, 'main.js'), mainjs, 'utf8');

    const files = [
      { path: 'index.html', content: index },
      { path: 'styles.css', content: styles },
      { path: 'main.js', content: mainjs },
    ];

    return res.status(200).json({ success: true, siteId, previewUrl: `/preview/${siteId}/index.html`, files });
  } catch (err: any) {
    console.error('generate error', err);
    return res.status(500).json({ success: false, error: err?.message || 'failed' });
  }
};
