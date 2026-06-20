# Rubick AI - Multi-Platform Catalog Intelligence Engine

## Overview
A retail SaaS system that crawls e-commerce platforms (Amazon, Flipkart, Myntra), normalizes product data, detects duplicates, and provides real-time price tracking.

## Tech Stack
- **Backend**: Node.js + Fastify + PostgreSQL + Redis
- **ML Service**: Python + FastAPI + rapidfuzz
- **Frontend**: React + Vite + Tailwind CSS + Recharts
- **Infrastructure**: Docker Compose

## Features
- Product catalog with fuzzy search
- Real-time price updates via SSE
- Cross-platform duplicate detection (6-stage pipeline)
- Price history charts (90 days)
- Product comparison board

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local dev)
- Python 3.11+ (for ML service)

### Run with Docker (recommended)
```bash
docker-compose up --build

```


Then open:

Frontend: http://localhost:5173

Backend API: http://localhost:3000

ML Service: http://localhost:8000

--- Local Development ---

Backend:

cd backend
npm install
npm run dev


ML Service:

cd ml-service
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

Frontend:

cd frontend
npm install
npm run dev

API Endpoints:

Method	   Endpoint	                                      Description
GET	       /products	                          List products (cursor pagination + search)
GET	       /products/:id	                      Get single product
GET	       /price-history/:id	                  Price history (90 days default)
GET	       /compare?ids=id1,id2	                Compare multiple products
GET	       /sse/prices	                        Server-Sent Events for price updates
POST	     /dedup/check	                        Check if two products are duplicates
POST	     /enrich	                            Enrich product with normalized attributes

Architecture Decisions (V1 → V2)
Search: PostgreSQL pg_trgm (V1) → Elasticsearch (V2 when >1M products)

Cache: Redis single (V1) → Redis Cluster (V2 when >9 shards)

Enrichment: Rule-based (V1) → Local LLM (V2 when partial enrichment >15%)

SSE: Direct (V1) → Kafka-backed (V2 when >10K concurrent connections)

Project Structure
├── backend/          # Node.js + Fastify API
├── ml-service/       # Python + FastAPI enrichment/dedup
├── frontend/         # React + Vite dashboard
├── docker/           # Dockerfiles
├── scripts/          # SQL migration + seed data
└── docker-compose.yml

Demo:

Product search with pagination
Real-time price SSE stream (simulated every 15 seconds)
Duplicate detection (Nike Air Max example)
