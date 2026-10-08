"""
Supabase Service for storing and managing table reservations.
Connects directly to Supabase PostgREST API with resilient local JSON fallback.
"""
import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger("cafe_backend.supabase")

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://mfnaqwyxaabawzbajomi.supabase.co").rstrip("/")
DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbmFxd3l4YWFiYXd6YmFqb21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NTE2NjYsImV4cCI6MjEwNzAyNzY2Nn0.6jLigp-ZUYbtDH028KON8saziqOv13nl9pxRlwfW59k"
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY") or DEFAULT_SUPABASE_KEY

BACKUP_FILE = Path(__file__).resolve().parent.parent / "knowledge" / "reservations_backup.json"


def _backup_locally(record: Dict[str, Any]):
    """Save reservation to local backup storage to prevent any data loss."""
    try:
        BACKUP_FILE.parent.mkdir(parents=True, exist_ok=True)
        records = []
        if BACKUP_FILE.exists():
            try:
                with open(BACKUP_FILE, "r", encoding="utf-8") as f:
                    records = json.load(f)
            except Exception:
                records = []
        records.append(record)
        with open(BACKUP_FILE, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2, ensure_ascii=False)
        logger.info(f"Locally backed up reservation: {record.get('id') or record.get('guest_name')}")
    except Exception as e:
        logger.error(f"Failed to locally backup reservation: {e}")


def save_reservation_to_supabase(reservation_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Insert a reservation record into Supabase PostgreSQL database.
    
    Args:
        reservation_data: Dictionary containing reservation details:
            - guest_name
            - phone
            - guest_count
            - date
            - time
            - city
            - event_type
            - special_requests
            - source ('website_form' or 'chatbot')
            - status ('confirmed')
            
    Returns:
        dict: Result with 'success', 'data', and optional 'error'
    """
    record = {
        "guest_name": reservation_data.get("guest_name") or "Guest",
        "phone": reservation_data.get("phone"),
        "guest_count": str(reservation_data.get("guest_count", "2 Guests")),
        "date": reservation_data.get("date") or datetime.now().strftime("%Y-%m-%d"),
        "time": reservation_data.get("time") or "7:30 PM",
        "city": reservation_data.get("city") or "Paris",
        "event_type": reservation_data.get("event_type") or "Casual Dinner",
        "special_requests": reservation_data.get("special_requests"),
        "source": reservation_data.get("source") or "website_form",
        "status": reservation_data.get("status") or "confirmed",
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    # Always write to local backup store first
    _backup_locally(record)

    api_url = os.getenv("SUPABASE_URL", SUPABASE_URL)
    api_key = os.getenv("SUPABASE_KEY", SUPABASE_KEY)

    if not api_url or not api_key:
        logger.warning("Supabase credentials not configured in environment.")
        return {"success": True, "saved_to": "local_backup", "data": record}

    endpoint = f"{api_url}/rest/v1/reservations"
    headers = {
        "apikey": api_key,
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(endpoint, json=record, headers=headers)
            if resp.status_code in [200, 201]:
                logger.info("Successfully recorded reservation in Supabase.")
                return {"success": True, "saved_to": "supabase", "data": resp.json()}
            else:
                logger.warning(
                    f"Supabase returned status {resp.status_code}: {resp.text}. "
                    "Saved to local backup."
                )
                return {
                    "success": True,
                    "saved_to": "local_backup",
                    "note": f"Supabase responded {resp.status_code}: {resp.text}",
                    "data": record
                }
    except Exception as err:
        logger.error(f"Error connecting to Supabase: {err}. Saved to local backup.")
        return {
            "success": True,
            "saved_to": "local_backup",
            "error": str(err),
            "data": record
        }
