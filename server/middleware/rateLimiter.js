/**
 * In-Memory Sliding Window Rate Limiter
 * Protects AI endpoints from abuse without needing external cache dependencies.
 */

class RateLimiter {
  constructor(windowMs = 60000, maxRequests = 40) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map(); // ip -> [timestamps]

    // Periodic cleanup of expired IP records every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [ip, timestamps] of this.requests.entries()) {
        const valid = timestamps.filter(t => now - t < this.windowMs);
        if (valid.length === 0) {
          this.requests.delete(ip);
        } else {
          this.requests.set(ip, valid);
        }
      }
    }, 300000);
  }

  middleware() {
    return (req, res, next) => {
      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
      const now = Date.now();

      const timestamps = this.requests.get(ip) || [];
      const windowStart = now - this.windowMs;
      const recentRequests = timestamps.filter(t => t > windowStart);

      if (recentRequests.length >= this.maxRequests) {
        const oldest = recentRequests[0];
        const retryAfter = Math.ceil((oldest + this.windowMs - now) / 1000);
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          error: 'Rate limit exceeded. Please wait a moment before sending more study requests.',
          retryAfterSeconds: retryAfter
        });
      }

      recentRequests.push(now);
      this.requests.set(ip, recentRequests);
      next();
    };
  }
}

// 40 requests per minute for chat & explanation
export const chatRateLimiter = new RateLimiter(60000, 40).middleware();

// 25 requests per minute for generators (quizzes, flashcards, exam plans)
export const generatorRateLimiter = new RateLimiter(60000, 25).middleware();
