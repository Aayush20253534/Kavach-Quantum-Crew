from datetime import date, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# Import the original, unmodified trip-planning logic.
from trip_core import build_trip_response

app = FastAPI(title="AI Trip Planner API")


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