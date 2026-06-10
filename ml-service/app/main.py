from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from rapidfuzz import fuzz

app = FastAPI(title="Rubick ML Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ml-service"}

@app.get("/")
async def root():
    return {"service": "Rubick ML Service", "version": "1.0.0"}

class DedupRequest(BaseModel):
    title1: str
    title2: str
    brand1: Optional[str] = None
    brand2: Optional[str] = None

class DedupResponse(BaseModel):
    is_match: bool
    confidence: float
    method: str
    score: float

@app.post("/dedup/check", response_model=DedupResponse)
async def check_duplicate(request: DedupRequest):
    score = fuzz.token_sort_ratio(request.title1.lower(), request.title2.lower())
    is_match = score > 85
    method = "fuzzy" if is_match else "none"
    
    return DedupResponse(
        is_match=is_match,
        confidence=score / 100,
        method=method,
        score=score
    )

@app.post("/enrich")
async def enrich_product(product_data: dict):
    return {"status": "placeholder", "enriched": product_data}