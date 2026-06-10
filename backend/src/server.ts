import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { query } from './db/postgres';
import redis from './db/redis';
import { getProducts, getProductByIdWithCache, getPriceHistory, compareProducts } from './services/productService';

const fastify = Fastify({ logger: true });

// Register plugins
const start = async () => {
  await fastify.register(cors);
  await fastify.register(helmet);
  await fastify.register(rateLimit, { max: 100, timeWindow: 60000 });

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // DB test
  fastify.get('/db-test', async () => {
    const result = await query('SELECT COUNT(*) FROM products');
    return { productCount: parseInt(result.rows[0].count, 10) };
  });

  // Redis test
  fastify.get('/redis-test', async () => {
    await redis.set('test-key', 'hello');
    const value = await redis.get('test-key');
    return { redisValue: value };
  });

  // GET /products - list with pagination and search
  fastify.get('/products', async (request, reply) => {
    const { cursor, limit, search } = request.query as { cursor?: string; limit?: string; search?: string };
    
    // Add the two safety validation lines here:
    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const limitNum = isNaN(parsedLimit) ? 20 : parsedLimit;
    
    const result = await getProducts(cursor || null, limitNum, search);
    return {
      products: result.rows,
      nextCursor: result.nextCursor,
      hasMore: result.nextCursor !== null
    };
  });


  // GET /products/:productId - single product
  fastify.get('/products/:productId', async (request, reply) => {
    const { productId } = request.params as { productId: string };
    const product = await getProductByIdWithCache(productId);
    if (!product) {
      return reply.status(404).send({ error: 'Product not found' });
    }
    return product;
  });

  // GET /price-history/:productId
  fastify.get('/price-history/:productId', async (request, reply) => {
    const { productId } = request.params as { productId: string };
    const { days } = request.query as { days?: string };
    const daysNum = days ? parseInt(days, 10) : 90;
    const history = await getPriceHistory(productId, daysNum);
    return { productId, history };
  });

  // GET /compare?ids=id1,id2,id3
  fastify.get('/compare', async (request, reply) => {
    const { ids } = request.query as { ids: string };
    if (!ids) {
      return reply.status(400).send({ error: 'ids parameter required' });
    }
    const productIds = ids.split(',');
    if (productIds.length > 5) {
      return reply.status(400).send({ error: 'Maximum 5 products to compare' });
    }
    const products = await compareProducts(productIds);
    return { products };
  });

  // SSE endpoint (simulated price updates)
  fastify.get('/sse/prices', async (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const sendPriceUpdate = () => {
      const mockUpdate = {
        productId: 'nike_airmax_01',
        platform: 'Amazon',
        newPrice: 5499 + Math.floor(Math.random() * 500),
        timestamp: new Date().toISOString()
      };
      reply.raw.write(`data: ${JSON.stringify(mockUpdate)}\n\n`);
    };

    const interval = setInterval(sendPriceUpdate, 15000);
    sendPriceUpdate();

    request.raw.on('close', () => {
      clearInterval(interval);
    });
  });

  await fastify.listen({ port: 3000, host: '0.0.0.0' });
  console.log('Server ready on http://localhost:3000');
};

start();