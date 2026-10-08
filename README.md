# Cafe Restaurant Platform

A modern full-stack web application for cafe and restaurant table bookings, intelligent AI voice/text chatbot concierge, interactive menu, and administrative management.

## 🚀 Architecture

- **Frontend** (`resturent new/`):
  - React 19 + TypeScript + Vite
  - Tailwind CSS + Framer Motion + GSAP animations
  - Interactive Table Reservations & Live Chatbot interface
  - Admin Dashboard for booking and table management
  - Supabase client integration

- **Backend** (`backend/`):
  - FastAPI (Python)
  - Gemini AI for intent parsing and conversational ordering/reservations
  - Sarvam AI for multilingual text-to-speech (TTS) voice responses
  - Supabase integration for reservations, tables, and knowledge store
  - Comprehensive fallback systems for offline/local reservation management

## 📦 Getting Started

### 1. Backend Setup

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Fill in your GEMINI_API_KEY, SARVAM_API_KEY, and SUPABASE credentials in .env

uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd "resturent new"
npm install
cp .env.example .env
# Set VITE_CHATBOT_API_URL, VITE_SUPABASE_URL, and VITE_SUPABASE_ANON_KEY in .env

npm run dev
```

The application will be running at `http://localhost:5173` connecting to the API at `http://localhost:8000`.

## 🛡️ License

MIT
