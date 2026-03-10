#!/usr/bin/env node
// Usage: node scripts/tweet.js "Your tweet text here"
// Posts a single tweet via the X/Twitter API using credentials from .env

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import { TwitterApi } from 'twitter-api-v2';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});

async function main() {
  const text = process.argv[2];
  if (!text) {
    console.error('Usage: node scripts/tweet.js "tweet text"');
    process.exit(1);
  }

  try {
    const result = await client.v2.tweet(text);
    console.log(JSON.stringify({ id: result.data.id, text: result.data.text }));
  } catch (err) {
    console.error('Tweet failed:', err.message);
    if (err.data) console.error('API response:', JSON.stringify(err.data));
    process.exit(1);
  }
}

main();
