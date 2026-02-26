/**
 * Global RPC Rate Limiter — Token bucket algorithm
 * Max 8 req/s (Helius free tier = 10/s, leaving headroom)
 */

const MAX_TOKENS = 8;
const REFILL_RATE = 8; // tokens per second
const DAILY_BUDGET = 33000; // ~1M credits/month ÷ 30
const CREDITS_PER_CALL = 5;
const WARN_THRESHOLD = 0.8;

class RateLimiter {
  private tokens = MAX_TOKENS;
  private lastRefill = Date.now();
  private dailyCredits = 0;
  private dailyResetDate = new Date().toDateString();
  private warned = false;

  private refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(MAX_TOKENS, this.tokens + elapsed * REFILL_RATE);
    this.lastRefill = now;

    // Reset daily counter at midnight
    const today = new Date().toDateString();
    if (today !== this.dailyResetDate) {
      this.dailyCredits = 0;
      this.dailyResetDate = today;
      this.warned = false;
    }
  }

  async acquire(): Promise<void> {
    this.refill();

    while (this.tokens < 1) {
      const waitMs = Math.ceil((1 - this.tokens) / REFILL_RATE * 1000);
      await new Promise(resolve => setTimeout(resolve, waitMs));
      this.refill();
    }

    this.tokens -= 1;
    this.dailyCredits += CREDITS_PER_CALL;

    if (!this.warned && this.dailyCredits >= DAILY_BUDGET * WARN_THRESHOLD) {
      console.warn(`[RateLimiter] ⚠️ Daily credit usage at ${this.dailyCredits}/${DAILY_BUDGET} (${Math.round(this.dailyCredits / DAILY_BUDGET * 100)}%)`);
      this.warned = true;
    }
  }

  getStats() {
    return {
      availableTokens: Math.floor(this.tokens),
      dailyCreditsUsed: this.dailyCredits,
      dailyBudget: DAILY_BUDGET,
    };
  }
}

export const rateLimiter = new RateLimiter();
