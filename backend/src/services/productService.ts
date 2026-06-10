import { query } from '../db/postgres';

export const getProducts = async (cursor: string | null, limit: number = 20) => {
  let sql = `
    SELECT product_id, title, brand, category, platforms, enrichment_status, created_at
    FROM products
    ORDER BY id
  `;
  const params: any[] = [];
  
  if (cursor) {
    const decoded = Buffer.from(cursor, 'base64').toString();
    const lastId = parseInt(decoded, 10);
    sql = `SELECT * FROM (${sql}) AS sub WHERE id > $1 ORDER BY id LIMIT $2`;
    params.push(lastId, limit);
  } else {
    sql += ` LIMIT $1`;
    params.push(limit);
  }
  
  const res = await query(sql, params);
  const nextCursor = res.rows.length === limit 
    ? Buffer.from(res.rows[res.rows.length - 1].id.toString()).toString('base64')
    : null;
  
  return { rows: res.rows, nextCursor };
};

export const getProductById = async (productId: string) => {
  const res = await query('SELECT * FROM products WHERE product_id = $1', [productId]);
  return res.rows[0];
};