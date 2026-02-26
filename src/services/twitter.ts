import { TwitterApi } from 'twitter-api-v2';

const client = new TwitterApi({
  appKey: process.env.X_API_KEY!,
  appSecret: process.env.X_API_SECRET!,
  accessToken: process.env.X_ACCESS_TOKEN!,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET!,
});

const rwClient = client.readWrite;

export async function tweet(text: string): Promise<string> {
  const result = await rwClient.v2.tweet(text);
  return result.data.id;
}

export async function tweetThread(texts: string[]): Promise<string[]> {
  const ids: string[] = [];
  let lastId: string | undefined;
  
  for (const text of texts) {
    const opts: any = {};
    if (lastId) opts.reply = { in_reply_to_tweet_id: lastId };
    const result = await rwClient.v2.tweet(text, opts);
    lastId = result.data.id;
    ids.push(lastId);
  }
  
  return ids;
}

export { rwClient as twitterClient };
