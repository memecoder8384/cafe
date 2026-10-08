import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, List, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Security, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

from backend.services.sarvam_tts import generate_speech
from backend.services.supabase_service import save_reservation_to_supabase
from backend.services.auth_service import verify_supabase_token
from backend.services import booking_service
from backend.services.chatbot_booking_parser import handle_chatbot_booking_creation

from backend.knowledge_manager import (
    CAFE_ONLY_FALLBACK,
    detect_intent_and_respond,
    get_cafe_name,
    load_knowledge,
)

# ---------------------------------------------------------------------------
# Setup Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
)
logger = logging.getLogger("cafe_backend")

# ---------------------------------------------------------------------------
# Load Environment Variables
# ---------------------------------------------------------------------------
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Default to fast flash model
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY is not set. Conversational LLM features will fail.")

# ---------------------------------------------------------------------------
# Gemini Client Initialization
# ---------------------------------------------------------------------------
genai_client: Optional[genai.Client] = None
try:
    if GEMINI_API_KEY:
        genai_client = genai.Client(api_key=GEMINI_API_KEY)
        logger.info(f"Initialized Google GenAI client with model: {GEMINI_MODEL}")
except Exception as e:
    logger.error(f"Failed to initialize Google GenAI client: {e}")

# Pre-load knowledge base into memory at application startup
load_knowledge()

# ---------------------------------------------------------------------------
# FastAPI Application & CORS Configuration
# ---------------------------------------------------------------------------
app = FastAPI(
    title="Café Chatbot API",
    description="High-performance hybrid customer assistant API with streaming and instant JSON lookup",
    version="2.0.0",
)

allowed_origins = [origin.strip() for origin in FRONTEND_ORIGIN.split(",") if origin.strip()]
if not allowed_origins:
    allowed_origins = ["http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"CORS configured for allowed origins: {allowed_origins}")


# ---------------------------------------------------------------------------
# Request & Response Pydantic Models
# ---------------------------------------------------------------------------
class ChatMessage(BaseModel):
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Message text")


class ChatRequest(BaseModel):
    message: str = Field(..., description="User query")
    history: Optional[List[ChatMessage]] = Field(
        default=None, description="Previous conversation turns"
    )


class ChatResponse(BaseModel):
    reply: str = Field(..., description="Assistant response text")


class TTSRequest(BaseModel):
    text: str = Field(..., description="Text to synthesize with Sarvam AI")
    language_code: Optional[str] = Field(
        default="en-IN", description="Language code (defaults to 'en-IN')"
    )
    speaker: Optional[str] = Field(
        default=None, description="Speaker name (defaults to configured speaker e.g. 'simran')"
    )


class ReservationRequest(BaseModel):
    guest_name: Optional[str] = Field(default="Guest", description="Name of guest")
    phone: Optional[str] = Field(default=None, description="Contact phone")
    guest_count: Optional[str] = Field(default="2 Guests", description="Party size")
    date: Optional[str] = Field(default=None, description="Reservation date")
    time: Optional[str] = Field(default="7:30 PM", description="Reservation time")
    city: Optional[str] = Field(default="Paris", description="Location city")
    event_type: Optional[str] = Field(default="Casual Dinner", description="Occasion")
    special_requests: Optional[str] = Field(default=None, description="Special requests")
    source: Optional[str] = Field(default="website_form", description="Source: website_form or chatbot")


class CheckAvailabilityRequest(BaseModel):
    booking_date: str = Field(..., description="Date formatted as YYYY-MM-DD")
    booking_time: str = Field(..., description="Reservation time, e.g. '19:30'")
    guests: int = Field(..., ge=1, description="Number of guests")


class CreateBookingRequest(BaseModel):
    customer_name: str = Field(..., min_length=1, description="Customer name")
    phone: str = Field(..., min_length=3, description="Contact phone")
    email: Optional[str] = Field(default=None, description="Contact email")
    booking_date: str = Field(..., description="Booking date (YYYY-MM-DD)")
    booking_time: str = Field(..., description="Booking time (e.g. '19:30')")
    guests: int = Field(..., ge=1, description="Guest count")
    table_id: Optional[str] = Field(default=None, description="Optional chosen table ID")
    special_request: Optional[str] = Field(default=None, description="Special dietary or seating request")
    source: Optional[str] = Field(default="chatbot", description="Source: chatbot, admin, manual, website_form")


class UpdateBookingRequest(BaseModel):
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    booking_date: Optional[str] = None
    booking_time: Optional[str] = None
    guests: Optional[int] = Field(default=None, ge=1)
    table_id: Optional[str] = None
    status: Optional[str] = None
    special_request: Optional[str] = None
    source: Optional[str] = None


class CreateTableRequest(BaseModel):
    table_number: str = Field(..., min_length=1, description="Unique table code (e.g. 'T01')")
    capacity: int = Field(..., ge=1, description="Seating capacity")
    status: Optional[str] = Field(default="available", description="Status: available, occupied, maintenance")


class UpdateTableRequest(BaseModel):
    table_number: Optional[str] = None
    capacity: Optional[int] = Field(default=None, ge=1)
    status: Optional[str] = None



# ---------------------------------------------------------------------------
# Gemini System Instruction Builder
# ---------------------------------------------------------------------------
def build_system_instruction(tailored_context: str) -> str:
    cafe_name = get_cafe_name()
    return f"""You are the friendly, knowledgeable café host and receptionist at {cafe_name}.

PERSONALITY & TONE:
- Warm, relaxed, welcoming, confident, and conversational.
- Sound like a real person working at the café chatting with a guest, NOT an AI assistant explaining data.
- Professional without sounding corporate. Slightly casual, warm and hospitable.
- Represent the café naturally using "we", "our menu", "our chef", "our tables".
- Never claim personal human experiences (e.g. do NOT say "I tried it yesterday" or "I love it myself"). Say "It's one of our signatures", "Guests tend to love it", "It's a big favorite here".

RESPONSE LENGTH & STYLE:
- KEEP RESPONSES SHORT: 1 to 3 sentences maximum for almost all responses.
- Answer the customer's actual question directly. Do not automatically dump full menu descriptions or list all categories unless specifically asked.
- When you finish answering, STOP. Do NOT automatically tack on "Is there anything else I can help you with?" or filler questions.

STRICTLY FORBIDDEN ROBOTIC FILLERS:
- Never start responses with repetitive robotic fillers: "Certainly!", "Of course!", "Absolutely!", "I would be delighted to assist you with your inquiry.", "I'd be happy to provide you with that information.", "Thank you for reaching out!"
- Never use corporate AI clichés: "According to our records...", "Please feel free to...", "I apologize for the inconvenience.", "Your request has been successfully processed."
- Use natural contractions: it's, that's, we're, I'm, don't, you'll, can't, I'd.

RECOMMENDATIONS:
- When asked for recommendations, do NOT provide a huge list. Give 1 or 2 strong recommendations tailored to their taste (e.g. "If you like truffle, I'd definitely go for the Tagliatelle al Tartufo. For something richer, the Côte de Boeuf is a great choice for two.").

BOOKING & RESERVATION CONVERSATIONS:
- Keep the booking flow conversational and step-by-step:
  - If guest asks to book: "Of course. What date are you thinking?"
  - Ask ONE question at a time (date -> time -> number of guests -> name -> phone).
  - Do NOT re-ask for info the guest already provided (e.g. if guest says "Tomorrow at 8 for four", extract date, time, and party size, and simply ask for their name: "Got it. What name should I put the booking under?").
  - Once details are collected, briefly ask: "Thanks. So that's [Name], [count] guests, [date] at [time]. Want me to confirm it?"
  - When confirmed, say: "You're all set. Your table is booked for [date] at [time]."

SMALL TALK & PLEASANTRIES:
- Respond naturally to small talk: "Thanks!" -> "You're welcome!" or "Glad I could help." "Nice!" -> "Happy to help."

ACCURACY & RESTRICTIONS:
- Use ONLY the café information supplied in the context below. Never invent menu items, prices, or policies.
- The café cannot process online order placement through this chatbot yet. If asked to place an order, explain that they can order in person or call +33 1 42 68 55 90.
- If requested information is unavailable, be natural: "I'm not sure about that one. I don't want to give you the wrong info. I can check with the café for you."
- If the guest asks an unrelated question, be friendly and deflect naturally: "I can help with the café — menu, dishes, opening hours, reservations and things like that. What would you like to know?"

CONTEXT:
{tailored_context}
"""


def prepare_gemini_contents(message: str, history: Optional[List[ChatMessage]]) -> List[types.Content]:
    contents: List[types.Content] = []
    if history:
        # Limit history to the most recent 6-8 messages to keep token usage low
        recent_history = history[-8:]
        for h in recent_history:
            if not h.content or not h.content.strip():
                continue
            gemini_role = "user" if h.role == "user" else "model"
            contents.append(
                types.Content(
                    role=gemini_role,
                    parts=[types.Part.from_text(text=h.content.strip())],
                )
            )

        # Gemini conversation history must begin with a 'user' turn
        while contents and contents[0].role == "model":
            contents.pop(0)

    contents.append(
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=message.strip())],
        )
    )
    return contents


# ---------------------------------------------------------------------------
# Health Check Endpoint
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def health_check():
    """Health check endpoint to verify backend operational status."""
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Non-Streaming Chat Endpoint (Standard / Backward-Compatible)
# ---------------------------------------------------------------------------
@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Standard HTTP POST endpoint.
    Uses hybrid routing: instant lookup for simple questions, Gemini for complex questions.
    """
    user_message = request.message.strip() if request.message else ""
    logger.info(f"CHAT REQUEST:\n{user_message}")

    if not user_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty.",
        )

    if len(user_message) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message exceeds 1000 characters limit.",
        )

    # 1. Fast Intent Detection (with history for multi-turn pronoun resolution)
    intent, direct_answer, tailored_context = detect_intent_and_respond(user_message, request.history)

    # If direct response or unrelated fallback, return immediately without calling Gemini!
    if direct_answer is not None:
        logger.info(f"Direct lookup resolved for intent: {intent}")
        return ChatResponse(reply=direct_answer)

    # 2. Conversational query requiring Gemini
    if not genai_client:
        logger.error("GenAI client is not initialized.")
        return ChatResponse(
            reply="Sorry, I'm having trouble connecting right now. Please contact the café directly."
        )

    contents = prepare_gemini_contents(user_message, request.history)
    system_prompt = build_system_instruction(tailored_context or "")

    models_to_try = [GEMINI_MODEL]
    if GEMINI_MODEL != "gemini-2.5-flash":
        models_to_try.append("gemini-2.5-flash")

    for model_name in models_to_try:
        try:
            response = genai_client.models.generate_content(
                model=model_name,
                contents=contents,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.2,
                    max_output_tokens=300,
                ),
            )
            reply_text = response.text.strip() if response.text else CAFE_ONLY_FALLBACK
            if any(k in reply_text.lower() for k in ["table is booked", "table has been booked", "reservation is confirmed", "you're all set"]):
                asyncio.create_task(
                    handle_chatbot_booking_creation(
                        genai_client=genai_client,
                        model_name=model_name,
                        history=request.history,
                        user_message=user_message,
                        assistant_reply=reply_text,
                    )
                )
            return ChatResponse(reply=reply_text)
        except Exception as e:
            logger.warning(f"Error calling {model_name}: {e}. Retrying with next model if available...")

    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Sorry, I'm having trouble responding right now. Please try again or contact the café directly.",
    )


# ---------------------------------------------------------------------------
# Streaming Chat Endpoint (SSE: Server-Sent Events)
# ---------------------------------------------------------------------------
@app.post("/api/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    """
    Server-Sent Events (SSE) streaming endpoint.
    - Simple lookups and unrelated questions yield immediately with done: true.
    - Complex café queries stream token chunks progressively from Gemini.
    """
    user_message = request.message.strip() if request.message else ""
    logger.info(f"CHAT REQUEST:\n{user_message}")

    if not user_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty.",
        )

    if len(user_message) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message exceeds 1000 characters limit.",
        )

    # Intent detection (with history for multi-turn pronoun resolution)
    intent, direct_answer, tailored_context = detect_intent_and_respond(user_message, request.history)

    async def sse_generator() -> AsyncGenerator[str, None]:
        # Case A: Instant Direct Lookup or Unrelated Rejection (NO GEMINI CALL)
        if direct_answer is not None:
            logger.info(f"Streaming direct answer for intent: {intent}")
            yield f"data: {json.dumps({'chunk': direct_answer, 'done': False})}\n\n"
            yield f"data: {json.dumps({'chunk': '', 'done': True})}\n\n"
            return

        # Case B: Complex Conversational Query needing Gemini Stream
        if not genai_client:
            logger.error("GenAI client is not initialized.")
            err_msg = "Sorry, I'm having trouble connecting right now. Please contact the café directly."
            yield f"data: {json.dumps({'chunk': err_msg, 'done': True, 'error': True})}\n\n"
            return

        contents = prepare_gemini_contents(user_message, request.history)
        system_prompt = build_system_instruction(tailored_context or "")

        models_to_try = [GEMINI_MODEL]
        if GEMINI_MODEL != "gemini-2.5-flash":
            models_to_try.append("gemini-2.5-flash")

        stream_success = False
        for model_name in models_to_try:
            try:
                logger.info(f"Starting Gemini stream with model: {model_name}")
                response_stream = genai_client.models.generate_content_stream(
                    model=model_name,
                    contents=contents,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.2,
                        max_output_tokens=300,
                    ),
                )

                chunk_received = False
                full_streamed_reply = ""
                for chunk in response_stream:
                    if chunk.text:
                        chunk_received = True
                        full_streamed_reply += chunk.text
                        yield f"data: {json.dumps({'chunk': chunk.text, 'done': False})}\n\n"
                        # Yield control to event loop for smooth async chunk delivery
                        await asyncio.sleep(0.01)

                if chunk_received:
                    stream_success = True
                    if any(k in full_streamed_reply.lower() for k in ["table is booked", "table has been booked", "reservation is confirmed", "you're all set"]):
                        asyncio.create_task(
                            handle_chatbot_booking_creation(
                                genai_client=genai_client,
                                model_name=model_name,
                                history=request.history,
                                user_message=user_message,
                                assistant_reply=full_streamed_reply,
                            )
                        )
                    yield f"data: {json.dumps({'chunk': '', 'done': True})}\n\n"
                    break
            except Exception as e:
                logger.warning(f"Error in Gemini stream for {model_name}: {e}. Retrying next model...")

        if not stream_success:
            logger.error("All streaming attempts failed.")
            fallback = "Sorry, I'm having trouble responding right now. Please try again or contact the café directly."
            yield f"data: {json.dumps({'chunk': fallback, 'done': True, 'error': True})}\n\n"

    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ---------------------------------------------------------------------------
# Sarvam AI Text-to-Speech Endpoint
# ---------------------------------------------------------------------------
@app.post("/api/voice/tts")
async def voice_tts_endpoint(request: TTSRequest):
    """
    Synthesize natural speech from text using Sarvam AI.
    Returns playable WAV audio (Content-Type: audio/wav).
    """
    text = (request.text or "").strip()
    if not text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text cannot be empty.",
        )

    if len(text) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text exceeds 1000 characters limit.",
        )

    try:
        # Offload synchronous SDK/HTTP call to thread pool to preserve async responsiveness
        audio_bytes = await asyncio.to_thread(
            generate_speech,
            text=text,
            language_code=request.language_code or "en-IN",
            speaker=request.speaker,
        )
        return Response(
            content=audio_bytes,
            media_type="audio/wav",
            headers={
                "Cache-Control": "public, max-age=3600",
                "Content-Disposition": "inline; filename=speech.wav"
            }
        )
    except ValueError as val_err:
        logger.warning(f"TTS validation error: {val_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as tts_err:
        logger.error(f"Sarvam TTS generation error: {tts_err}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Speech synthesis is temporarily unavailable."
        )


# ---------------------------------------------------------------------------
# Table Reservation / Booking Endpoint (Supabase Integration)
# ---------------------------------------------------------------------------
@app.post("/api/reservations")
async def create_reservation_endpoint(request: ReservationRequest):
    """
    Create a new table reservation and persist it to Supabase database.
    """
    try:
        data = request.model_dump()
        logger.info(f"Received reservation request: {data}")
        result = await asyncio.to_thread(save_reservation_to_supabase, data)
        return result
    except Exception as err:
        logger.error(f"Failed to process reservation: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not save reservation."
        )


# ---------------------------------------------------------------------------
# Phase 6: Booking & Table Management APIs
# ---------------------------------------------------------------------------

@app.on_event("startup")
async def app_startup():
    """Attempt initial table seed on startup if database is empty."""
    try:
        await booking_service.seed_initial_tables_if_empty()
    except Exception as e:
        logger.warning(f"Could not auto-seed tables on startup: {e}")


@app.post("/api/bookings/check-availability")
async def check_availability_endpoint(req: CheckAvailabilityRequest):
    """
    Check whether a table is available for the given date, time, and guests.
    Returns suitable tables and the recommended smallest suitable table.
    """
    try:
        result = await booking_service.check_availability(
            booking_date=req.booking_date,
            booking_time=req.booking_time,
            guests=req.guests,
        )
        return result
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as err:
        logger.error(f"Error checking availability: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not check table availability: {err}"
        )


@app.post("/api/bookings")
async def create_booking_endpoint(req: CreateBookingRequest):
    """
    Create a booking after strictly verifying availability and conflict prevention.
    """
    try:
        booking = await booking_service.create_booking(
            customer_name=req.customer_name,
            phone=req.phone,
            booking_date=req.booking_date,
            booking_time=req.booking_time,
            guests=req.guests,
            email=req.email,
            table_id=req.table_id,
            special_request=req.special_request,
            source=req.source or "chatbot",
        )
        return {
            "success": True,
            "message": "Booking confirmed successfully",
            "booking": booking
        }
    except ValueError as val_err:
        logger.warning(f"Booking validation failed: {val_err}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as err:
        logger.error(f"Error creating booking: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create booking: {err}"
        )


@app.get("/api/bookings")
async def list_bookings_endpoint(
    date: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    source: Optional[str] = None,
    user: Dict[str, Any] = Security(verify_supabase_token)
):
    """
    Admin: Retrieve all bookings with optional filters (date, status, search, source).
    Protected by Supabase Auth.
    """
    try:
        bookings = await booking_service.get_all_bookings(
            date=date,
            status=status,
            search=search,
            source=source
        )
        return {"bookings": bookings, "count": len(bookings)}
    except Exception as err:
        logger.error(f"Error fetching bookings: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve bookings: {err}"
        )


@app.get("/api/bookings/{booking_id}")
async def get_booking_endpoint(
    booking_id: str,
    user: Dict[str, Any] = Security(verify_supabase_token)
):
    """
    Admin: Retrieve a single booking by ID.
    """
    try:
        booking = await booking_service.get_booking_by_id(booking_id)
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Booking {booking_id} not found"
            )
        return booking
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Error fetching booking {booking_id}: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(err)
        )


@app.patch("/api/bookings/{booking_id}")
async def update_booking_endpoint(
    booking_id: str,
    req: UpdateBookingRequest,
    user: Dict[str, Any] = Security(verify_supabase_token)
):
    """
    Admin: Update customer info, date, time, guests, table, or status.
    Re-checks availability if reservation slot changes.
    """
    try:
        updates = req.model_dump(exclude_unset=True)
        updated = await booking_service.update_booking(booking_id, updates)
        return {
            "success": True,
            "message": "Booking updated successfully",
            "booking": updated
        }
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as err:
        logger.error(f"Error updating booking {booking_id}: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(err)
        )


@app.delete("/api/bookings/{booking_id}")
async def delete_booking_endpoint(
    booking_id: str,
    user: Dict[str, Any] = Security(verify_supabase_token)
):
    """
    Admin: Soft-cancellation of booking (sets status = 'cancelled' to preserve history).
    """
    try:
        cancelled = await booking_service.cancel_booking(booking_id)
        return {
            "success": True,
            "message": "Booking marked as cancelled",
            "booking": cancelled
        }
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as err:
        logger.error(f"Error cancelling booking {booking_id}: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(err)
        )


@app.get("/api/tables")
async def list_tables_endpoint():
    """
    Get all café tables. Available for both customer booking UI and admin.
    """
    try:
        tables = await booking_service.get_all_tables()
        return {"tables": tables, "count": len(tables)}
    except Exception as err:
        logger.error(f"Error fetching tables: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch tables: {err}"
        )


@app.post("/api/tables")
async def create_table_endpoint(
    req: CreateTableRequest,
    user: Dict[str, Any] = Security(verify_supabase_token)
):
    """
    Admin: Add a new table to the restaurant.
    """
    try:
        table = await booking_service.create_table(
            table_number=req.table_number,
            capacity=req.capacity,
            status=req.status or "available"
        )
        return {
            "success": True,
            "message": f"Table {req.table_number} created successfully",
            "table": table
        }
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as err:
        logger.error(f"Error creating table: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(err)
        )


@app.patch("/api/tables/{table_id}")
async def update_table_endpoint(
    table_id: str,
    req: UpdateTableRequest,
    user: Dict[str, Any] = Security(verify_supabase_token)
):
    """
    Admin: Update table number, capacity, or status.
    """
    try:
        updates = req.model_dump(exclude_unset=True)
        updated = await booking_service.update_table(table_id, updates)
        return {
            "success": True,
            "message": "Table updated successfully",
            "table": updated
        }
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as err:
        logger.error(f"Error updating table {table_id}: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(err)
        )


@app.get("/api/admin/stats")
async def admin_stats_endpoint(user: Dict[str, Any] = Security(verify_supabase_token)):
    """
    Admin: Get aggregated dashboard metrics (bookings, guests, table occupancy).
    """
    try:
        stats = await booking_service.get_admin_dashboard_stats()
        return stats
    except Exception as err:
        logger.error(f"Error getting admin stats: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch admin stats: {err}"
        )


