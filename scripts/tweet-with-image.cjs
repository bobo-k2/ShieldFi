#!/usr/bin/env node
// Usage: node tweet-with-image.cjs "tweet text" [wallet_address]
// If wallet_address provided, screenshots the scan result and attaches it
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { TwitterApi } = require('twitter-api-v2');
const { execSync } = require('child_process');
const path = require('path');

const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
}).readWrite;

async function main() {
  const args = process.argv.slice(2);
  const text = args[0];
  const wallet = args[1];
  const imagePath = args[2]; // optional: custom image path

  if (!text) { console.error('Usage: tweet-with-image.cjs "text" [wallet|--image path]'); process.exit(1); }

  let mediaId;
  const imgFile = imagePath || '/tmp/tweet-scan.png';

  if (wallet && wallet !== '--image') {
    // Screenshot the wallet scan
    console.log(`📸 Screenshotting scan for ${wallet.slice(0,8)}...`);
    execSync(`chromium --headless --no-sandbox --screenshot=${imgFile} --window-size=1200,630 --virtual-time-budget=12000 "https://shieldfi.app/wallet/${wallet}" 2>/dev/null`);
  } else if (args[1] === '--image' && args[2]) {
    // Use provided image path directly
  }

  if (require('fs').existsSync(imgFile)) {
    console.log('📤 Uploading image...');
    mediaId = await client.v1.uploadMedia(imgFile);
    console.log(`✅ Media: ${mediaId}`);
  }

  const opts = mediaId ? { media: { media_ids: [mediaId] } } : {};
  const r = await client.v2.tweet(text, opts);
  console.log(`✅ Tweet: ${r.data.id}`);
  console.log(`🔗 https://x.com/ShieldFiApp/status/${r.data.id}`);
}

main().catch(e => { console.error('❌', e.data || e.message); process.exit(1); });
