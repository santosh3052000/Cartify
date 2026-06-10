import { query } from '../db/postgres';
import { cacheGet, cacheSet } from '../middleware/cache';

// Get products with cursor pagination and search
export const getProducts = async (cursor: string | null, limit: number = 20, search?: string) => {
  let sql = `
    SELECT id, product_id, title, brand, category, platforms, enrichment_status, created_at
    FROM products
  `;
  const params: any[] = [];
  
  if (search) {
    sql += ` WHERE title ILIKE $1 OR brand ILIKE $1`;
    params.push(`%${search}%`);
  }
  
  sql += ` ORDER BY id`;
  
  if (cursor) {
    const decoded = Buffer.from(cursor, 'base64').toString();
    const lastId = parseInt(decoded, 10);
    sql = `SELECT * FROM (${sql}) AS sub WHERE id > $${params.length + 1} ORDER BY id LIMIT $${params.length + 2}`;
    params.push(lastId, limit);
  } else {
    sql += ` LIMIT $${params.length + 1}`;
    params.push(limit);
  }
  
  const res = await query(sql, params);
  const nextCursor = res.rows.length === limit 
    ? Buffer.from(res.rows[res.rows.length - 1].id.toString()).toString('base64')
    : null;
  
  return { rows: res.rows, nextCursor };
};

// Get single product by product_id
export const getProductById = async (productId: string) => {
  const res = await query('SELECT * FROM products WHERE product_id = $1', [productId]);
  return res.rows[0];
};

// Get product with cache
export const getProductByIdWithCache = async (productId: string) => {
  const cacheKey = `product:${productId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return cached;
  
  const product = await getProductById(productId);
  if (product) {
    await cacheSet(cacheKey, product, 300);
  }
  return product;
};

// Get price history for a product
export const getPriceHistory = async (productId: string, days: number = 90) => {
  const res = await query(
    `SELECT platform, price, original_price, availability, recorded_at 
     FROM price_history 
     WHERE product_id = $1 AND recorded_at >= NOW() - INTERVAL '${days} days'
     ORDER BY recorded_at DESC`,
    [productId]
  );
  return res.rows;
};

// Compare multiple products
export const compareProducts = async (productIds: string[]) => {
  const placeholders = productIds.map((_, i) => `$${i + 1}`).join(',');
  const res = await query(
    `SELECT product_id, title, brand, category, platforms, attributes 
     FROM products 
     WHERE product_id IN (${placeholders})`,
    productIds
  );
  return res.rows;
};