import { chromium } from "playwright";
import { mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "docs");

const iconBase64 = readFileSync(join(__dirname, "..", "assets", "digivice_icon.png"), "base64");

const html = `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px;
    height: 630px;
    background: #e7dccb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    overflow: hidden;
    position: relative;
  }
  body::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  body::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
    pointer-events: none;
  }
  .container {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .logo-icon {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .logo-icon img {
    width: 100%;
    height: 100%;
  }
  .logo-text {
    font-size: 80px;
    font-weight: 800;
    color: #3b82f6;
    letter-spacing: -3px;
  }
  .tagline {
    font-size: 26px;
    color: #64748b;
    font-weight: 400;
    letter-spacing: 0.5px;
  }
  .tech {
    display: flex;
    gap: 24px;
    margin-top: 12px;
  }
  .tech span {
    font-size: 15px;
    color: #64748b;
    font-weight: 500;
    padding: 6px 16px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
  }
</style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <div class="logo-icon"><img src="data:image/png;base64,${iconBase64}" /></div>
      <div class="logo-text">Digi-Shaker</div>
    </div>
    <div class="tagline">Automated Digivice D3 shaker for farming Digi Points</div>
    <div class="tech">
      <span>ESP32</span>
      <span>SolidJS</span>
      <span>PlatformIO</span>
    </div>
  </div>
</body>
</html>`;

async function generate() {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 2,
  });

  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({
    path: join(outDir, "og-image.png"),
    fullPage: false,
  });

  await browser.close();
  console.log("OG image saved to docs/og-image.png");
}

generate().catch((err) => {
  console.error("OG image generation failed:", err);
  process.exit(1);
});
