#!/usr/bin/env python3

from fastapi import FastAPI
from typing import Dict

app = FastAPI()

@app.get("/debug/cache")
async def debug_cache():
    """Affiche le contenu du cache"""
    from app.database import get_all_bins
    cache = get_all_bins()
    return {
        "cache_size": len(cache),
        "cache_keys": list(cache.keys())
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)

