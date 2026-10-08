"""
Booking and Table Management Service for Café Assistant.
Handles Supabase integration, table availability calculation, conflict prevention,
and atomic booking creation.
"""
import os
import logging
from datetime import datetime, timedelta, time
from typing import Any, Dict, List, Optional, Tuple
import httpx

from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

logger = logging.getLogger("cafe_backend.booking_service")

# Environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://mfnaqwyxaabawzbajomi.supabase.co").rstrip("/")
# Prefer SERVICE_ROLE_KEY for server-side operations, fall back to SUPABASE_KEY / anon key
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY", "")
DEFAULT_RESERVATION_DURATION_MINUTES = int(os.getenv("DEFAULT_RESERVATION_DURATION_MINUTES", "90"))

# Default initial tables if database is empty
INITIAL_TABLES = [
    {"id": "00000000-0000-0000-0000-000000000001", "table_number": "T01", "capacity": 2, "status": "available"},
    {"id": "00000000-0000-0000-0000-000000000002", "table_number": "T02", "capacity": 2, "status": "available"},
    {"id": "00000000-0000-0000-0000-000000000003", "table_number": "T03", "capacity": 4, "status": "available"},
    {"id": "00000000-0000-0000-0000-000000000004", "table_number": "T04", "capacity": 4, "status": "available"},
    {"id": "00000000-0000-0000-0000-000000000005", "table_number": "T05", "capacity": 6, "status": "available"},
]


def _get_headers() -> Dict[str, str]:
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_KEY") or SUPABASE_SERVICE_ROLE_KEY or ""
    headers = {
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    if key:
        headers["apikey"] = key
        headers["Authorization"] = f"Bearer {key}"
    return headers


def _get_base_url() -> str:
    return os.getenv("SUPABASE_URL", SUPABASE_URL)


def _parse_time_to_minutes(time_str: str) -> Optional[int]:
    """Parse time string like '19:30', '7:30 PM', '19:30:00' to minutes from midnight."""
    if not time_str:
        return None
    time_str = time_str.strip()
    # Try various formats
    formats = [
        "%H:%M",
        "%H:%M:%S",
        "%I:%M %p",
        "%I:%M%p",
        "%I %p",
        "%H",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(time_str, fmt)
            return dt.hour * 60 + dt.minute
        except ValueError:
            continue
    # Fallback: simple split if contains ':'
    try:
        parts = time_str.split(":")
        h = int(parts[0])
        m = int(parts[1][:2]) if len(parts) > 1 else 0
        return h * 60 + m
    except Exception:
        return None


def _format_minutes_to_time(minutes: int) -> str:
    h = (minutes // 60) % 24
    m = minutes % 60
    return f"{h:02d}:{m:02d}"


# ---------------------------------------------------------------------------
# TABLES CRUD
# ---------------------------------------------------------------------------

async def get_all_tables() -> List[Dict[str, Any]]:
    """Retrieve all tables sorted by table_number."""
    url = f"{_get_base_url()}/rest/v1/tables?select=*&order=table_number.asc"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, headers=_get_headers())
        if resp.status_code == 200:
            tables = resp.json()
            if not tables:
                return [dict(t) for t in INITIAL_TABLES]
            return tables
        else:
            logger.error(f"Failed to fetch tables: {resp.status_code} {resp.text}")
            return [dict(t) for t in INITIAL_TABLES]


async def seed_initial_tables_if_empty() -> List[Dict[str, Any]]:
    """Seeds default tables if table count is 0."""
    try:
        existing = await get_all_tables()
        if existing:
            return existing
        url = f"{_get_base_url()}/rest/v1/tables"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, headers=_get_headers(), json=INITIAL_TABLES)
            if resp.status_code in [200, 201]:
                logger.info("Successfully seeded initial café tables.")
                return resp.json()
            else:
                logger.warning(f"Could not seed tables: {resp.status_code} {resp.text}")
                return []
    except Exception as e:
        logger.warning(f"seed_initial_tables_if_empty error: {e}")
        return []


async def get_table_by_id(table_id: str) -> Optional[Dict[str, Any]]:
    url = f"{_get_base_url()}/rest/v1/tables?id=eq.{table_id}&select=*"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, headers=_get_headers())
        if resp.status_code == 200:
            data = resp.json()
            return data[0] if data else None
        return None


async def create_table(table_number: str, capacity: int, status: str = "available") -> Dict[str, Any]:
    if capacity <= 0:
        raise ValueError("Capacity must be greater than 0")
    if status not in ["available", "occupied", "maintenance"]:
        raise ValueError("Status must be one of: available, occupied, maintenance")

    url = f"{_get_base_url()}/rest/v1/tables"
    payload = {
        "table_number": table_number.strip().upper(),
        "capacity": capacity,
        "status": status,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(url, headers=_get_headers(), json=payload)
        if resp.status_code in [200, 201]:
            created = resp.json()
            return created[0] if isinstance(created, list) else created
        else:
            raise Exception(f"Failed to create table: {resp.status_code} {resp.text}")


async def update_table(table_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    url = f"{_get_base_url()}/rest/v1/tables?id=eq.{table_id}"
    allowed_keys = {"table_number", "capacity", "status"}
    payload = {k: v for k, v in updates.items() if k in allowed_keys and v is not None}

    if "capacity" in payload and payload["capacity"] <= 0:
        raise ValueError("Capacity must be greater than 0")
    if "status" in payload and payload["status"] not in ["available", "occupied", "maintenance"]:
        raise ValueError("Invalid table status")

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.patch(url, headers=_get_headers(), json=payload)
        if resp.status_code in [200, 204]:
            updated = resp.json() if resp.status_code == 200 else await get_table_by_id(table_id)
            return updated[0] if isinstance(updated, list) else updated
        else:
            raise Exception(f"Failed to update table: {resp.status_code} {resp.text}")


# ---------------------------------------------------------------------------
# AVAILABILITY LOGIC & CONFLICT PROTECTION
# ---------------------------------------------------------------------------

async def check_availability(
    booking_date: str,
    booking_time: str,
    guests: int,
    duration_minutes: Optional[int] = None
) -> Dict[str, Any]:
    """
    Core availability engine:
    1. Filter out tables with status == 'maintenance' and where capacity < guests.
    2. Query all non-cancelled bookings for booking_date.
    3. Check for time overlaps [start, start + duration].
    4. Sort available tables by capacity ascending (prefer smallest suitable table).
    """
    if guests <= 0:
        raise ValueError("Guests count must be greater than 0")

    duration = duration_minutes or DEFAULT_RESERVATION_DURATION_MINUTES
    req_start = _parse_time_to_minutes(booking_time)
    if req_start is None:
        raise ValueError(f"Invalid time format: {booking_time}")
    req_end = req_start + duration

    # 1. Fetch tables
    all_tables = await get_all_tables()
    # Filter candidate tables: not in maintenance and capacity >= guests
    candidates = [
        t for t in all_tables
        if t.get("status") != "maintenance" and int(t.get("capacity", 0)) >= guests
    ]

    # 2. Fetch existing bookings for this date (exclude cancelled)
    url = f"{_get_base_url()}/rest/v1/Bookings?booking_date=eq.{booking_date}&status=neq.cancelled&select=*"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, headers=_get_headers())
        if resp.status_code == 200:
            existing_bookings = resp.json()
        else:
            logger.warning(f"Could not fetch bookings for date {booking_date}: {resp.status_code} {resp.text}")
            existing_bookings = []

    # Also include active bookings from local backup storage
    try:
        from pathlib import Path
        import json
        backup_file = Path(__file__).resolve().parent.parent / "knowledge" / "reservations_backup.json"
        if backup_file.exists():
            local_list = json.loads(backup_file.read_text(encoding="utf-8"))
            existing_ids = {b.get("id") for b in existing_bookings}
            for lb in local_list:
                if (
                    lb.get("id") not in existing_ids
                    and lb.get("booking_date") == booking_date
                    and lb.get("status") != "cancelled"
                ):
                    existing_bookings.append(lb)
    except Exception:
        pass

    # 3. Identify occupied tables during requested interval
    occupied_table_ids = set()
    conflicts_detail = []

    for b in existing_bookings:
        b_time_str = b.get("booking_time")
        b_start = _parse_time_to_minutes(b_time_str)
        if b_start is None:
            continue
        b_end = b_start + duration

        # Two intervals [req_start, req_end] and [b_start, b_end] overlap if:
        # max(req_start, b_start) < min(req_end, b_end)
        if max(req_start, b_start) < min(req_end, b_end):
            table_id = b.get("table_id")
            if table_id:
                occupied_table_ids.add(table_id)
                conflicts_detail.append({
                    "booking_id": b.get("id"),
                    "table_id": table_id,
                    "booking_time": b_time_str,
                    "customer_name": b.get("customer_name")
                })

    # 4. Filter available candidates
    available_tables = [t for t in candidates if t.get("id") not in occupied_table_ids]

    # Sort available tables by capacity ascending, then table_number
    # (RULE: Prefer smallest suitable table: 4 guests -> 4-seat table before 6-seat table)
    available_tables.sort(key=lambda t: (int(t.get("capacity", 0)), t.get("table_number", "")))

    is_available = len(available_tables) > 0
    recommended = available_tables[0] if is_available else None

    return {
        "available": is_available,
        "booking_date": booking_date,
        "booking_time": booking_time,
        "guests": guests,
        "duration_minutes": duration,
        "suitable_tables": available_tables,
        "recommended_table": recommended,
        "total_candidate_tables": len(candidates),
        "available_tables_count": len(available_tables),
        "conflicts_count": len(occupied_table_ids),
    }


# ---------------------------------------------------------------------------
# BOOKINGS CRUD
# ---------------------------------------------------------------------------

async def create_booking(
    customer_name: str,
    phone: str,
    booking_date: str,
    booking_time: str,
    guests: int,
    email: Optional[str] = None,
    table_id: Optional[str] = None,
    special_request: Optional[str] = None,
    source: str = "chatbot",
    status: str = "pending",
) -> Dict[str, Any]:
    """
    Validate and atomic booking creation with race condition protection:
    Re-checks availability right before insert.
    """
    if not customer_name or not customer_name.strip():
        raise ValueError("Customer name is required")
    if not phone or not phone.strip():
        raise ValueError("Phone number is required")
    if guests <= 0:
        raise ValueError("Guests must be greater than 0")
    if status not in ["pending", "confirmed", "cancelled", "completed", "no_show"]:
        raise ValueError(f"Invalid booking status: {status}")
    if source not in ["chatbot", "admin", "manual", "website_form"]:
        source = "chatbot"

    # Always re-check availability at the moment of booking
    avail = await check_availability(booking_date, booking_time, guests)
    if not avail["available"]:
        raise ValueError(
            f"No tables available for {guests} guests on {booking_date} at {booking_time}. Please pick another time."
        )

    assigned_table = None
    if table_id:
        # Verify the requested table is in the suitable & available tables
        matches = [t for t in avail["suitable_tables"] if str(t.get("id")) == str(table_id)]
        if not matches:
            raise ValueError(
                f"Selected table ({table_id}) is not available or cannot accommodate {guests} guests at this time."
            )
        assigned_table = matches[0]
    else:
        # Auto-assign the recommended smallest suitable table
        assigned_table = avail["recommended_table"]
        table_id = assigned_table["id"]

    url = f"{_get_base_url()}/rest/v1/Bookings"
    payload = {
        "customer_name": customer_name.strip(),
        "phone": phone.strip(),
        "email": email.strip() if email else None,
        "booking_date": booking_date,
        "booking_time": booking_time,
        "guests": guests,
        "table_id": table_id,
        "status": status,
        "special_request": special_request.strip() if special_request else None,
        "source": source,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(url, headers=_get_headers(), json=payload)
        if resp.status_code in [200, 201]:
            created = resp.json()
            record = created[0] if isinstance(created, list) else created
            record["assigned_table"] = assigned_table
            logger.info(f"Booking created in Supabase: ID {record.get('id')} for {customer_name} at Table {assigned_table.get('table_number')}")
            return record
        else:
            logger.warning(f"Supabase returned {resp.status_code}: {resp.text}. Backing up reservation locally.")
            local_record = {
                "id": f"bk-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                **payload,
                "created_at": datetime.now().isoformat(),
                "assigned_table": assigned_table,
                "_sync_pending": True,
            }
            # Persist to local backup storage
            from pathlib import Path
            import json
            backup_file = Path(__file__).resolve().parent.parent / "knowledge" / "reservations_backup.json"
            try:
                existing_recs = []
                if backup_file.exists():
                    try:
                        existing_recs = json.loads(backup_file.read_text(encoding="utf-8"))
                    except Exception:
                        existing_recs = []
                existing_recs.append(local_record)
                backup_file.write_text(json.dumps(existing_recs, indent=2, ensure_ascii=False), encoding="utf-8")
                logger.info(f"Booking locally preserved: {local_record['id']}")
            except Exception as b_err:
                logger.error(f"Failed to locally store reservation: {b_err}")
            return local_record



async def get_all_bookings(
    date: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    source: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Retrieve bookings with filtering and table enrichment."""
    # PostgREST query
    query_parts = ["select=*"]
    if date:
        query_parts.append(f"booking_date=eq.{date}")
    if status:
        query_parts.append(f"status=eq.{status}")
    if source:
        query_parts.append(f"source=eq.{source}")

    query_str = "&".join(query_parts)
    url = f"{_get_base_url()}/rest/v1/Bookings?{query_str}&order=booking_date.asc,booking_time.asc"

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, headers=_get_headers())
        if resp.status_code != 200:
            raise Exception(f"Failed to fetch bookings: {resp.status_code} {resp.text}")
        bookings = resp.json()

    # Merge local backup if exists
    try:
        from pathlib import Path
        import json
        backup_file = Path(__file__).resolve().parent.parent / "knowledge" / "reservations_backup.json"
        if backup_file.exists():
            local_list = json.loads(backup_file.read_text(encoding="utf-8"))
            existing_ids = {b.get("id") for b in bookings}
            for lb in local_list:
                if lb.get("id") and lb.get("id") not in existing_ids:
                    if date and lb.get("booking_date") != date:
                        continue
                    if status and lb.get("status") != status:
                        continue
                    if source and lb.get("source") != source:
                        continue
                    bookings.append(lb)
    except Exception as err:
        logger.warning(f"Error reading local backup in get_all_bookings: {err}")

    # Fetch tables map for enrichment
    try:
        tables = await get_all_tables()
        table_map = {t["id"]: t for t in tables}
    except Exception:
        table_map = {}

    enriched = []
    search_lower = search.lower().strip() if search else None

    for b in bookings:
        b["table"] = table_map.get(b.get("table_id"))
        if search_lower:
            name = (b.get("customer_name") or "").lower()
            phone = (b.get("phone") or "").lower()
            email = (b.get("email") or "").lower()
            if search_lower not in name and search_lower not in phone and search_lower not in email:
                continue
        enriched.append(b)

    return enriched


async def get_booking_by_id(booking_id: str) -> Optional[Dict[str, Any]]:
    if str(booking_id).startswith("bk-"):
        try:
            from pathlib import Path
            import json
            backup_file = Path(__file__).resolve().parent.parent / "knowledge" / "reservations_backup.json"
            if backup_file.exists():
                local_list = json.loads(backup_file.read_text(encoding="utf-8"))
                for lb in local_list:
                    if lb.get("id") == booking_id:
                        return lb
        except Exception:
            pass

    url = f"{_get_base_url()}/rest/v1/Bookings?id=eq.{booking_id}&select=*"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, headers=_get_headers())
        if resp.status_code == 200:
            data = resp.json()
            if data:
                booking = data[0]
                if booking.get("table_id"):
                    booking["table"] = await get_table_by_id(booking["table_id"])
                return booking
        return None


async def update_booking(booking_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    current = await get_booking_by_id(booking_id)
    if not current:
        raise ValueError(f"Booking {booking_id} not found")

    allowed_keys = {
        "customer_name", "phone", "email", "booking_date", "booking_time",
        "guests", "table_id", "status", "special_request", "source"
    }
    payload = {k: v for k, v in updates.items() if k in allowed_keys and v is not None}

    if str(booking_id).startswith("bk-"):
        try:
            from pathlib import Path
            import json
            backup_file = Path(__file__).resolve().parent.parent / "knowledge" / "reservations_backup.json"
            if backup_file.exists():
                local_list = json.loads(backup_file.read_text(encoding="utf-8"))
                for i, lb in enumerate(local_list):
                    if lb.get("id") == booking_id:
                        local_list[i].update(payload)
                        backup_file.write_text(json.dumps(local_list, indent=2, ensure_ascii=False), encoding="utf-8")
                        return local_list[i]
        except Exception as e:
            logger.error(f"Local update failed: {e}")


    # If date, time, guests, or table_id changes, re-check availability
    date_changed = "booking_date" in payload and payload["booking_date"] != current.get("booking_date")
    time_changed = "booking_time" in payload and payload["booking_time"] != current.get("booking_time")
    guests_changed = "guests" in payload and payload["guests"] != current.get("guests")
    table_changed = "table_id" in payload and payload["table_id"] != current.get("table_id")

    if (date_changed or time_changed or guests_changed or table_changed):
        check_date = payload.get("booking_date", current.get("booking_date"))
        check_time = payload.get("booking_time", current.get("booking_time"))
        check_guests = payload.get("guests", current.get("guests"))
        check_table = payload.get("table_id", current.get("table_id"))

        avail = await check_availability(check_date, check_time, check_guests)
        # Check if table is available (excluding this booking itself)
        matching_tables = [t for t in avail["suitable_tables"] if str(t.get("id")) == str(check_table)]
        if not matching_tables and str(check_table) != str(current.get("table_id")):
            raise ValueError(f"Selected table is not available for {check_guests} guests on {check_date} at {check_time}")

    url = f"{_get_base_url()}/rest/v1/Bookings?id=eq.{booking_id}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.patch(url, headers=_get_headers(), json=payload)
        if resp.status_code in [200, 204]:
            updated = resp.json() if resp.status_code == 200 else await get_booking_by_id(booking_id)
            return updated[0] if isinstance(updated, list) else updated
        else:
            raise Exception(f"Failed to update booking: {resp.status_code} {resp.text}")


async def cancel_booking(booking_id: str) -> Dict[str, Any]:
    """Soft-cancel booking by setting status = 'cancelled' (preserves history)."""
    return await update_booking(booking_id, {"status": "cancelled"})


async def get_admin_dashboard_stats() -> Dict[str, Any]:
    """Calculates overview stats for the admin dashboard."""
    today_str = datetime.now().strftime("%Y-%m-%d")

    tables = await get_all_tables()
    all_bookings = await get_all_bookings()

    today_bookings = [b for b in all_bookings if b.get("booking_date") == today_str and b.get("status") != "cancelled"]
    today_guests = sum(int(b.get("guests", 0)) for b in today_bookings)

    upcoming_bookings = [
        b for b in all_bookings
        if b.get("booking_date", "") >= today_str and b.get("status") in ["pending", "confirmed"]
    ]

    pending_bookings = [b for b in all_bookings if b.get("status") == "pending"]

    # Tables overview
    available_tables = [t for t in tables if t.get("status") == "available"]
    occupied_tables = [t for t in tables if t.get("status") == "occupied"]
    maintenance_tables = [t for t in tables if t.get("status") == "maintenance"]

    return {
        "today_date": today_str,
        "today_bookings_count": len(today_bookings),
        "today_guests_count": today_guests,
        "upcoming_bookings_count": len(upcoming_bookings),
        "pending_bookings_count": len(pending_bookings),
        "total_tables_count": len(tables),
        "available_tables_count": len(available_tables),
        "occupied_tables_count": len(occupied_tables),
        "maintenance_tables_count": len(maintenance_tables),
        "recent_bookings": upcoming_bookings[:10],
    }
