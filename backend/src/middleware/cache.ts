import redis from '../db/redis';

const DEFAULT_TTL = 60; // seconds

export const cacheGet = async (key: string) => {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
};

export const cacheSet = async (key: string, data: any, ttl: number = DEFAULT_TTL) => {
  // Add jitter (±10%) to prevent thundering herd
  const jitter = Math.floor(ttl * 0.1 * (Math.random() * 2 - 1));
  const finalTtl = Math.max(1, ttl + jitter);
  await redis.set(key, JSON.stringify(data), 'EX', finalTtl);
};

export const cacheInvalidate = async (pattern: string) => {
  const keys = await redis.keys(pattern);
  if (keys.length) await redis.del(...keys);
};