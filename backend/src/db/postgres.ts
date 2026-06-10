import  {Pool}  from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://rubick:rubick123@localhost:5432/catalog_db',
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export const getClient = () => pool.connect();