#!/usr/bin/env node
// Usage: node scripts/tweet.js "Your tweet text here"
// Posts a single tweet via xurl CLI (more reliable than twitter-api-v2 which gives 403)

import { execSync } from 'child_process';

function main() {
  const text = process.argv[2];
  if (!text) {
    console.error('Usage: node scripts/tweet.js "tweet text"');
    process.exit(1);
  }

  try {
    const result = execSync(`xurl post ${JSON.stringify(text)}`, {
      encoding: 'utf8',
      timeout: 30000,
    });
    console.log(result.trim());
  } catch (err) {
    console.error('Tweet failed:', err.message);
    if (err.stderr) console.error('stderr:', err.stderr);
    process.exit(1);
  }
}

main();
