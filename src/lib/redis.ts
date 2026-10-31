import type { Redis } from "ioredis";

/**
 * Optional shared Redis connection.
 *
 * Rate limiting and MT5 nonce replay protection use Redis when REDIS_URL is
 * configured. Without it they fall back to process-local memory, which is fine
 * for a single Node process but not for multiple instances.
 */

const globalForRedis = globalThis as unknown as {
  __legnoovaRedis?: Redis | null;
  __legnoovaRedisReady?: boolean;
  __legnoovaRedisInit?: Promise<Redis | null> | null;
};

function redisUrl(): string | null {
  return (
    process.env.REDIS_URL?.trim() ||
    process.env.UPSTASH_REDIS_URL?.trim() ||
    null
  );
}

export async function getRedis(): Promise<Redis | null> {
  if (globalForRedis.__legnoovaRedisReady && globalForRedis.__legnoovaRedis) {
    return globalForRedis.__legnoovaRedis;
  }
  if (globalForRedis.__legnoovaRedisReady) return null;

  const url = redisUrl();
  if (!url) {
    globalForRedis.__legnoovaRedisReady = true;
    globalForRedis.__legnoovaRedis = null;
    return null;
  }

  if (!globalForRedis.__legnoovaRedisInit) {
    globalForRedis.__legnoovaRedisInit = (async () => {
      try {
        const { Redis } = await import("ioredis");
        const client = new Redis(url, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
        });
        client.on("error", () => {
          globalForRedis.__legnoovaRedisReady = false;
        });
        await client.connect();
        globalForRedis.__legnoovaRedis = client;
        globalForRedis.__legnoovaRedisReady = true;
        return client;
      } catch {
        globalForRedis.__legnoovaRedis = null;
        globalForRedis.__legnoovaRedisReady = true;
        return null;
      }
    })();
  }

  return globalForRedis.__legnoovaRedisInit;
}
