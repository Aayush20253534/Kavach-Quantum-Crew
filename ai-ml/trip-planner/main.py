from datetime import date, timedelta
import os
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# Import the original, unmodified trip-planning logic.
from trip_core import build_trip_response

app = FastAPI(title="Kavach Python Trip Planner API")


@app.get("/")
def root():
    """Cheap public endpoint for Render/browser checks without invoking AI providers."""
    return {
        "ok": True,
        "service": "kavach-python-trip-planner",
        "message": "KAVACH AI trip planner is running",
        "health": "/health",
        "plan_endpoint": "/api/trip/plan",
    }


@app.get("/health")
def health():
    return {
        "ok": True,
        "service": "kavach-python-trip-planner",
        "serpapi_configured": bool(os.getenv("SERPAPI_API_KEY")),
        "groq_configured": bool(os.getenv("GROQ_API_KEY")),
    }


class TripPlanRequest(BaseModel):
    city: str
    num_days: int = Field(gt=0)
    check_in: Optional[str] = None   # "YYYY-MM-DD" — defaults to +7 days if omitted
    check_out: Optional[str] = None  # "YYYY-MM-DD" — defaults to +10 days if omitted


@app.post("/api/trip/plan")
def plan_trip(payload: TripPlanRequest):
    check_in = payload.check_in or (date.today() + timedelta(days=7)).isoformat()
    check_out = payload.check_out or (date.today() + timedelta(days=10)).isoformat()

    try:
        return build_trip_response(
            payload.city,
            payload.num_days,
            check_in,
            check_out,
        )
    except ValueError as e:
        # e.g. the SerpAPI error raised inside get_hotels
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate trip plan: {e}")