-- =============================================
-- RUBICK CATALOG INTELLIGENCE ENGINE - V1 SCHEMA
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";  -- for composite GIN indexes

-- 1. products table (JSONB-heavy, main catalog)
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    product_id VARCHAR(32) NOT NULL UNIQUE,
    title TEXT NOT NULL,
    brand VARCHAR(120) NOT NULL,
    category JSONB NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
    variants JSONB DEFAULT '[]'::jsonb,
    images TEXT[] DEFAULT '{}',
    enrichment_status VARCHAR(20) DEFAULT 'pending',
    confidence_scores JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for products
CREATE INDEX idx_products_title_trgm ON products USING GIN (title gin_trgm_ops);
CREATE INDEX idx_products_category ON products USING GIN (category jsonb_path_ops);
CREATE INDEX idx_products_platforms ON products USING GIN (platforms jsonb_path_ops);
CREATE INDEX idx_products_brand ON products (brand);
CREATE INDEX idx_products_enrichment_status ON products (enrichment_status) WHERE enrichment_status != 'complete';

-- 2. price_history table (partitioned by month, range on recorded_at)
CREATE TABLE price_history (
    id BIGSERIAL,
    product_id VARCHAR(32) NOT NULL,
    platform VARCHAR(32),
    price NUMERIC(10,2) NOT NULL,
    original_price NUMERIC(10,2),
    currency CHAR(3) DEFAULT 'INR',
    availability VARCHAR(20),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (recorded_at);

-- Create default partition (for safety) and first 3 months partitions manually
-- In production, use pg_partman, but for V1/prototype we create ahead:
CREATE TABLE price_history_default PARTITION OF price_history DEFAULT;

-- Create partitions for current month and next two months (adjust as needed)
-- Example for June, July, August 2026 (you can change dates)
CREATE TABLE price_history_2026_06 PARTITION OF price_history
    FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE price_history_2026_07 PARTITION OF price_history
    FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE price_history_2026_08 PARTITION OF price_history
    FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');

-- Indexes on partitioned table (created on each partition automatically if done after partitions exist)
CREATE INDEX idx_price_history_product_id ON price_history (product_id);
CREATE INDEX idx_price_history_recorded_at ON price_history (recorded_at DESC);
CREATE INDEX idx_price_history_platform ON price_history (platform);

-- 3. product_mappings table (dedup cross‑platform links)
CREATE TABLE product_mappings (
    id BIGSERIAL PRIMARY KEY,
    master_id VARCHAR(32) NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    platform VARCHAR(32) NOT NULL,
    platform_sku VARCHAR(120) NOT NULL,
    match_method VARCHAR(20) NOT NULL, -- 'exact', 'fuzzy', 'embedding', 'human'
    confidence NUMERIC(4,3) NOT NULL,
    reviewed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(platform, platform_sku)
);

CREATE INDEX idx_product_mappings_master ON product_mappings (master_id);

-- 4. dedup_queue (for human review of low‑confidence pairs, optional V1)
CREATE TABLE dedup_review_queue (
    id BIGSERIAL PRIMARY KEY,
    product_a_id VARCHAR(32) NOT NULL,
    product_b_id VARCHAR(32) NOT NULL,
    raw_score NUMERIC(4,3),
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- 5. crawl_jobs table (for monitoring)
CREATE TABLE crawl_jobs (
    id BIGSERIAL PRIMARY KEY,
    platform VARCHAR(32) NOT NULL,
    job_type VARCHAR(20) NOT NULL, -- 'full', 'price_only', 'single'
    status VARCHAR(20) DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    items_crawled INT DEFAULT 0,
    error_message TEXT
);

CREATE INDEX idx_crawl_jobs_platform_status ON crawl_jobs (platform, status);

-- 6. Quick verification
SELECT COUNT(*) AS tables_created FROM information_schema.tables WHERE table_schema = 'public';