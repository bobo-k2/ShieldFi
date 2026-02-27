#!/usr/bin/env node
// Usage: node tweet.js "tweet text"
// Or for threads: node tweet.js --thread "tweet1" "tweet2" "tweet3"
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { TwitterApi } = require('twitter-api-v2');

const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
}).readWrite;

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--thread') {
    const texts = args.slice(1);
    let lastId;
    for (const text of texts) {
      const opts = lastId ? { reply: { in_reply_to_tweet_id: lastId } } : {};
      const r = await client.v2.tweet(text, opts);
      lastId = r.data.id;
      console.log(`✅ ${lastId}: ${text.slice(0, 60)}...`);
    }
  } else {
    const text = args.join(' ');
    const r = await client.v2.tweet(text);
    console.log(`✅ ${r.data.id}: ${text.slice(0, 80)}`);
  }
}

main().catch(e => { console.error('❌', e.data || e.message); process.exit(1); });
