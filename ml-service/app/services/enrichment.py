import re
from typing import Dict, Any, Optional, Tuple

# Color synonyms mapping (normalize to standard colors)
COLOR_SYNONYMS = {
    'black': ['blk', 'black', 'charcoal', 'pitch black', 'midnight', 'jet black'],
    'white': ['wht', 'white', 'ivory', 'off-white', 'snow white', 'pure white'],
    'red': ['red', 'crimson', 'scarlet', 'ruby', 'cherry', 'brick red', 'rose red'],
    'blue': ['blue', 'navy', 'navy blue', 'royal blue', 'sky blue', 'baby blue', 'cobalt', 'denim'],
    'green': ['green', 'olive', 'mint', 'army green', 'forest green', 'emerald', 'lime'],
    'yellow': ['yellow', 'gold', 'amber', 'lemon', 'sunflower', 'mustard'],
    'purple': ['purple', 'violet', 'lavender', 'plum', 'magenta', 'lilac'],
    'pink': ['pink', 'rose', 'fuchsia', 'blush', 'hot pink', 'baby pink'],
    'orange': ['orange', 'coral', 'tangerine', 'peach', 'burnt orange'],
    'brown': ['brown', 'chocolate', 'coffee', 'tan', 'beige', 'camel', 'khaki', 'taupe'],
    'grey': ['grey', 'gray', 'silver', 'graphite', 'slate', 'charcoal grey', 'metal'],
    'gold': ['gold', 'golden', 'yellow gold'],
    'silver': ['silver', 'argent', 'platinum', 'metallic silver'],
    'multicolor': ['multicolor', 'multi', 'colorful', 'printed', 'floral', 'pattern'],
}

# Size conversion tables
SIZE_FOOTWEAR_US_TO_EU = {
    '6': 39, '6.5': 39.5, '7': 40, '7.5': 40.5, '8': 41, '8.5': 42,
    '9': 42.5, '9.5': 43, '10': 44, '10.5': 44.5, '11': 45, '12': 46
}

SIZE_CLOTHING_US_TO_EU = {
    'XS': 44, 'S': 46, 'M': 48, 'L': 50, 'XL': 52, 'XXL': 54, 'XXXL': 56
}

SIZE_CLOTHING_US_TO_INTERNATIONAL = {
    'XS': 'XS', 'S': 'S', 'M': 'M', 'L': 'L', 'XL': 'XL', 'XXL': 'XXL'
}

def normalize_color(color_text: str) -> str:
    """Extract and normalize color from product title or attributes"""
    color_text = color_text.lower().strip()
    
    for standard_color, synonyms in COLOR_SYNONYMS.items():
        for synonym in synonyms:
            if synonym in color_text:
                return standard_color
    return color_text

def normalize_size(size_text: str, category: str = 'Footwear') -> Optional[float]:
    """Convert size to canonical EU number"""
    size_text = str(size_text).upper().strip()
    category = category.lower()
    
    # Extract numeric value
    match = re.search(r'(\d+(?:\.\d+)?)', size_text)
    if not match:
        return None
    
    numeric_value = float(match.group(1))
    
    if category == 'footwear':
        # If size is US (like 8, 8.5), convert to EU
        if 'US' in size_text or (numeric_value < 13 and numeric_value > 3):
            return SIZE_FOOTWEAR_US_TO_EU.get(str(int(numeric_value)), numeric_value + 33)
        # If already EU (like 42, 43)
        return numeric_value
    elif category == 'clothing':
        # Handle letter sizes
        if size_text in SIZE_CLOTHING_US_TO_EU:
            return float(SIZE_CLOTHING_US_TO_EU[size_text])
        return numeric_value
    else:
        return numeric_value

def extract_brand(title: str) -> str:
    """Extract brand from product title (simple version)"""
    known_brands = ['nike', 'adidas', 'puma', 'samsung', 'apple', 'levi', 'zara', 'maybelline', 'boat']
    title_lower = title.lower()
    
    for brand in known_brands:
        if brand in title_lower:
            return brand.capitalize()
    return 'Unknown'

def classify_category(title: str, attributes: Dict = None) -> Dict[str, str]:
    """Simple rule-based category classification"""
    title_lower = title.lower()
    
    # Footwear keywords
    if any(word in title_lower for word in ['shoe', 'sneaker', 'boot', 'sandal', 'footwear', 'air max', 'ultraboost']):
        return {'l1': 'Footwear', 'l2': 'Sneakers', 'l3': 'General'}
    
    # Electronics keywords
    if any(word in title_lower for word in ['phone', 'smartphone', 'laptop', 'tablet', 'headphone', 'tv', 'camera', 'galaxy', 'iphone']):
        return {'l1': 'Electronics', 'l2': 'Smartphones', 'l3': 'General'}
    
    # Clothing keywords
    if any(word in title_lower for word in ['jeans', 'shirt', 'dress', 'jacket', 'hoodie', 'sweater', 'pant', 't-shirt', 'tshirt']):
        return {'l1': 'Clothing', 'l2': 'Apparel', 'l3': 'General'}
    
    # Beauty keywords
    if any(word in title_lower for word in ['lipstick', 'foundation', 'mascara', 'eyeshadow', 'makeup', 'beauty', 'cream', 'lotion']):
        return {'l1': 'Beauty', 'l2': 'Makeup', 'l3': 'General'}
    
    return {'l1': 'Other', 'l2': 'Uncategorized', 'l3': 'General'}

def enrich_product(product_data: Dict[str, Any]) -> Dict[str, Any]:
    """Main enrichment function"""
    title = product_data.get('title', '')
    
    enriched = {
        'normalized_brand': extract_brand(title),
        'normalized_color': None,
        'normalized_size': None,
        'category': classify_category(title),
        'confidence_scores': {
            'brand': 0.8,
            'color': 0.0,
            'size': 0.0,
            'category': 0.7
        }
    }
    
    # Extract color from title or attributes
    if 'color' in product_data.get('attributes', {}):
        enriched['normalized_color'] = normalize_color(product_data['attributes']['color'])
        enriched['confidence_scores']['color'] = 0.9
    else:
        enriched['normalized_color'] = normalize_color(title)
    
    # Extract size from variants or title
    variants = product_data.get('variants', [])
    if variants and 'size' in variants[0]:
        size_value = variants[0]['size']
        category = enriched['category']['l1']
        normalized = normalize_size(size_value, category)
        enriched['normalized_size'] = normalized
        enriched['confidence_scores']['size'] = 0.85
    
    return enriched