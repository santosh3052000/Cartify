from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, Tuple
from rapidfuzz import fuzz

app = FastAPI(title="Rubick ML Service", version="1.0.0")

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

# ---------- Dedup Request/Response Models ----------
class DedupRequest(BaseModel):
    title1: str
    title2: str
    brand1: Optional[str] = None
    brand2: Optional[str] = None
    category1: Optional[str] = None
    category2: Optional[str] = None
    size1: Optional[str] = None
    size2: Optional[str] = None

class DedupResponse(BaseModel):
    is_match: bool
    confidence: float
    method: str
    score: float

# ---------- Size Normalization ----------
def normalize_size(size_text: str, category: str = "Footwear") -> Optional[float]:
    import re
    if not size_text:
        return None
    size_text = str(size_text).upper().strip()
    category = category.lower()
    match = re.search(r'(\d+(?:\.\d+)?)', size_text)
    if not match:
        return None
    numeric_value = float(match.group(1))
    # Simple conversion for footwear US to EU
    if category == "footwear" and numeric_value < 13 and numeric_value > 3:
        us_to_eu = {'6':39,'6.5':39.5,'7':40,'7.5':40.5,'8':41,'8.5':42,'9':42.5,'9.5':43,'10':44,'10.5':44.5,'11':45,'12':46}
        return us_to_eu.get(str(int(numeric_value)), numeric_value + 33)
    return numeric_value

def sizes_compatible(size1: Optional[str], size2: Optional[str], category: str = "Footwear") -> bool:
    if not size1 or not size2:
        return True  # No size info, assume compatible (filter later by other fields)
    norm1 = normalize_size(size1, category)
    norm2 = normalize_size(size2, category)
    if norm1 is None or norm2 is None:
        return True
    return abs(norm1 - norm2) <= 0.5

# ---------- Title Cleaning ----------
def clean_title(title: str) -> str:
    import re
    title = title.lower()
    # Remove common stopwords and ecommerce noise
    stopwords = {'shoes', 'shoe', 'buy', 'online', 'india', 'men', 'women', 'kids', 'size', 'black', 'white', 'red', 'blue', 'green', 'grey', 'gray'}
    words = re.findall(r'\b[a-zA-Z0-9]+\b', title)
    cleaned = [w for w in words if w not in stopwords]
    return ' '.join(cleaned)

# ---------- Pre-filter (brand and leaf category) ----------
def pre_filter_match(req: DedupRequest) -> bool:
    # If brands provided and differ significantly
    if req.brand1 and req.brand2 and req.brand1.lower() != req.brand2.lower():
        return False
    # If categories provided and differ (simplified: check l1)
    if req.category1 and req.category2 and req.category1.lower() != req.category2.lower():
        return False
    return True

# ---------- Main Dedup Endpoint with 6 Stages ----------
@app.post("/dedup/check", response_model=DedupResponse)
async def check_duplicate(req: DedupRequest):
    # Stage 1: Pre-filter (brand + category)
    if not pre_filter_match(req):
        return DedupResponse(is_match=False, confidence=0.0, method="prefilter_failed", score=0.0)
    
    # Stage 2: Size normalization check (if sizes provided)
    category = "Footwear"  # could be passed, but for prototype assume footwear
    if req.size1 or req.size2:
        if not sizes_compatible(req.size1, req.size2, category):
            return DedupResponse(is_match=False, confidence=0.2, method="size_mismatch", score=0.0)
    
    # Stage 3: Title cleaning
    cleaned1 = clean_title(req.title1)
    cleaned2 = clean_title(req.title2)
    
    # Stage 4: Fuzzy match (token_sort_ratio)
    fuzzy_score = fuzz.token_sort_ratio(cleaned1, cleaned2)
    
    if fuzzy_score >= 85:
        return DedupResponse(is_match=True, confidence=fuzzy_score/100, method="fuzzy_high", score=fuzzy_score)
    elif fuzzy_score >= 65:
        # Stage 5: Optional embedding similarity (simplified with partial_ratio for now)
        # For prototype, we'll use partial_ratio as embedding substitute
        partial_score = fuzz.partial_ratio(cleaned1, cleaned2)
        if partial_score >= 88:
            return DedupResponse(is_match=True, confidence=partial_score/100, method="semantic", score=partial_score)
        else:
            # Stage 6: Low confidence – still return not match, but could queue for human review
            return DedupResponse(is_match=False, confidence=fuzzy_score/100, method="low_confidence", score=fuzzy_score)
    else:
        return DedupResponse(is_match=False, confidence=fuzzy_score/100, method="fuzzy_low", score=fuzzy_score)

# ---------- Enrichment Endpoint (from Task 11, simplified) ----------
@app.post("/enrich")
async def enrich_product_endpoint(request: dict):
    import re
    COLOR_SYNONYMS = {
        'black': ['blk', 'black', 'charcoal'],
        'white': ['wht', 'white', 'ivory'],
        'red': ['red', 'crimson'],
        'blue': ['blue', 'navy'],
    }
    def normalize_color(color_text: str) -> str:
        color_text = color_text.lower().strip()
        for std, syns in COLOR_SYNONYMS.items():
            for s in syns:
                if s in color_text:
                    return std
        return color_text
    def extract_brand(title: str) -> str:
        known_brands = ['nike', 'adidas', 'puma', 'samsung', 'apple', 'levi', 'zara', 'maybelline', 'boat']
        title_lower = title.lower()
        for brand in known_brands:
            if brand in title_lower:
                return brand.capitalize()
        return 'Unknown'
    def classify_category(title: str):
        title_lower = title.lower()
        if any(w in title_lower for w in ['shoe', 'sneaker', 'boot']):
            return {'l1': 'Footwear', 'l2': 'Sneakers', 'l3': 'General'}
        if any(w in title_lower for w in ['phone', 'smartphone', 'laptop']):
            return {'l1': 'Electronics', 'l2': 'Smartphones', 'l3': 'General'}
        if any(w in title_lower for w in ['jeans', 'shirt', 'dress']):
            return {'l1': 'Clothing', 'l2': 'Apparel', 'l3': 'General'}
        return {'l1': 'Other', 'l2': 'Uncategorized', 'l3': 'General'}
    
    title = request.get('title', '')
    enriched = {
        'normalized_brand': extract_brand(title),
        'normalized_color': None,
        'category': classify_category(title),
    }
    if 'color' in request.get('attributes', {}):
        enriched['normalized_color'] = normalize_color(request['attributes']['color'])
    else:
        enriched['normalized_color'] = normalize_color(title)
    return enriched

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)