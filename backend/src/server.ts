import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { query } from './db/postgres';
import redis from './db/redis';

const fastify = Fastify({ logger: true });

// Health check
fastify.get('/health', async () => ({ status: 'ok' }));

// DB test endpoint
fastify.get('/db-test', async () => {
  const result = await query('SELECT COUNT(*) FROM products');
  return { productCount: parseInt(result.rows[0].count, 10) };
});

// Redis test endpoint
fastify.get('/redis-test', async () => {
  await redis.set('test-key', 'hello');
  const value = await redis.get('test-key');
  return { redisValue: value };
});

const start = async () => {
  await fastify.register(cors);
  await fastify.register(helmet);
  await fastify.register(rateLimit, { max: 100, timeWindow: 60000 });
  await fastify.listen({ port: 3000, host: '0.0.0.0' });
  console.log('Server ready');
};
start();