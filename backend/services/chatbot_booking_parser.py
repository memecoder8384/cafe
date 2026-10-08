"""
Chatbot Booking Parser & Handler.
Extracts structured reservation parameters from conversational history
and creates validated reservations via booking_service.
"""
import re
import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from google.genai import types

from backend.services import booking_service

logger = logging.getLogger("cafe_backend.chatbot_booking")


def parse_relative_date(text: str) -> str:
    """Resolve 'today', 'tomorrow', or day names relative to current date."""
    now = datetime.now()
    text_lower = text.lower()
    if "tomorrow" in text_lower:
        return (now + timedelta(days=1)).strftime("%Y-%m-%d")
    if "today" in text_lower or "tonight" in text_lower:
        return now.strftime("%Y-%m-%d")

    # Check for YYYY-MM-DD
    date_match = re.search(r"\b(202\d[-/]\d{1,2}[-/]\d{1,2})\b", text)
    if date_match:
        raw = date_match.group(1).replace("/", "-")
        try:
            return datetime.strptime(raw, "%Y-%m-%d").strftime("%Y-%m-%d")
        except Exception:
            pass

    # Default to tomorrow if not specified
    return (now + timedelta(days=1)).strftime("%Y-%m-%d")


def parse_time(text: str) -> str:
    """Normalize time like '8 PM', '7:30', '19:30' to 'HH:MM'."""
    text_clean = text.strip()
    match = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(am|pm)?", text_clean, re.IGNORECASE)
    if match:
        h = int(match.group(1))
        m = int(match.group(2)) if match.group(2) else 0
        ampm = match.group(3).lower() if match.group(3) else ""

        if ampm == "pm" and h < 12:
            h += 12
        elif ampm == "am" and h == 12:
            h = 0
        elif not ampm and h < 9:
            # Most evening restaurant bookings for '7' or '8' without am/pm mean PM
            h += 12
        return f"{h:02d}:{m:02d}"
    return "19:30"


async def extract_booking_details_with_llm(
    genai_client: Any,
    model_name: str,
    conversation_text: str
) -> Optional[Dict[str, Any]]:
    """
    Use Gemini structured output to reliably parse conversation details into a booking dict.
    Fast, small JSON schema.
    """
    today_str = datetime.now().strftime("%Y-%m-%d")
    prompt = f"""Extract the restaurant reservation details from the following conversation between a customer and the café assistant.
Today's date is {today_str}.

CONVERSATION:
{conversation_text}

OUTPUT ONLY VALID JSON with these exact keys:
{{
  "customer_name": "string (e.g. Vinayak, John)",
  "phone": "string (e.g. +91 9876543210)",
  "booking_date": "YYYY-MM-DD",
  "booking_time": "HH:MM (24-hour format e.g. 19:30)",
  "guests": integer (e.g. 2, 4),
  "special_request": "string or null"
}}
If phone or customer name is not found in the conversation, provide a sensible fallback (e.g. "Guest", "+91 0000000000").
"""
    try:
        resp = genai_client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.0,
                max_output_tokens=200,
            ),
        )
        if resp.text:
            data = json.loads(resp.text)
            return data
    except Exception as err:
        logger.warning(f"LLM extraction failed: {err}")
    return None


async def handle_chatbot_booking_creation(
    genai_client: Any,
    model_name: str,
    history: Optional[List[Any]],
    user_message: str,
    assistant_reply: str,
) -> Optional[Dict[str, Any]]:
    """
    If the assistant response indicates a booking was finalized,
    extract parameters and invoke booking_service to persist in Supabase.
    """
    reply_lower = assistant_reply.lower()
    is_confirmed_reply = any(
        phrase in reply_lower
        for phrase in [
            "table is booked",
            "table has been booked",
            "reservation is confirmed",
            "you're all set",
            "all set for",
        ]
    )

    if not is_confirmed_reply:
        return None

    logger.info("Chatbot completed a booking reservation. Extracting details...")

    # Assemble conversation transcript
    lines = []
    if history:
        for m in history[-6:]:
            role = getattr(m, "role", "user")
            content = getattr(m, "content", "")
            lines.append(f"{role.capitalize()}: {content}")
    lines.append(f"User: {user_message}")
    lines.append(f"Assistant: {assistant_reply}")
    full_conversation = "\n".join(lines)

    extracted = None
    if genai_client:
        extracted = await extract_booking_details_with_llm(genai_client, model_name, full_conversation)

    # Fallbacks if LLM extraction returned None
    if not extracted:
        extracted = {
            "customer_name": "Guest",
            "phone": "+91 9999999999",
            "booking_date": parse_relative_date(full_conversation),
            "booking_time": parse_time(full_conversation),
            "guests": 2,
            "special_request": None,
        }

    try:
        booking = await booking_service.create_booking(
            customer_name=extracted.get("customer_name") or "Guest",
            phone=extracted.get("phone") or "+91 9999999999",
            booking_date=extracted.get("booking_date") or (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            booking_time=extracted.get("booking_time") or "19:30",
            guests=int(extracted.get("guests") or 2),
            special_request=extracted.get("special_request"),
            source="chatbot",
            status="confirmed",
        )
        logger.info(f"Successfully recorded chatbot booking in Supabase: ID={booking.get('id')}")
        return booking
    except Exception as err:
        logger.warning(f"Could not save chatbot booking to Supabase: {err}")
        return None
