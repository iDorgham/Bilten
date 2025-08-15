// Simple Redis stub for development
// In production, this should be replaced with actual Redis client

class RedisStub {
  constructor() {
    this.cache = new Map();
  }

  async get(key) {
    return this.cache.get(key) || null;
  }

  async setex(key, expiry, value) {
    this.cache.set(key, value);
    // Simple expiry simulation
    setTimeout(() => {
      this.cache.delete(key);
    }, expiry * 1000);
  }

  async del(key) {
    this.cache.delete(key);
  }

  async flushall() {
    this.cache.clear();
  }
}

module.exports = new RedisStub();
