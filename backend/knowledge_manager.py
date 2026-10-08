import json
import logging
import re
import unicodedata
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger("cafe_backend.knowledge")

KNOWLEDGE_FILE_PATH = Path(__file__).resolve().parent / "knowledge" / "cafe_knowledge.json"

_CACHED_KNOWLEDGE: Optional[Dict[str, Any]] = None


def load_knowledge() -> Dict[str, Any]:
    """Load and cache the café knowledge base in memory once."""
    global _CACHED_KNOWLEDGE
    if _CACHED_KNOWLEDGE is not None:
        return _CACHED_KNOWLEDGE

    try:
        with open(KNOWLEDGE_FILE_PATH, "r", encoding="utf-8") as f:
            _CACHED_KNOWLEDGE = json.load(f)
            logger.info("Successfully loaded and cached cafe knowledge base.")
    except Exception as e:
        logger.error(f"Error loading cafe knowledge from {KNOWLEDGE_FILE_PATH}: {e}")
        _CACHED_KNOWLEDGE = {}

    return _CACHED_KNOWLEDGE


def get_cafe_name() -> str:
    data = load_knowledge()
    return data.get("cafe_info", {}).get("name", "Bistrot Chérie")


def get_opening_hours() -> str:
    """Return opening hours information in warm, conversational tone."""
    return "We're open every day from 12:00 PM to 01:30 AM at our Paris flagship, with service from lunch through late night."


def get_location() -> str:
    """Return location and address information in warm, natural tone."""
    return "We're located at 34 Rue des Archives in Le Marais, Paris, right near Place des Vosges. We also have spots in Milan and New York."


def get_contact() -> str:
    """Return contact details concisely."""
    return "You can reach us by phone at +33 1 42 68 55 90 or by email at ciao@bistrotcherie.com."


def get_best_seller() -> str:
    """Return best seller in a natural, friendly café host tone."""
    return "Honestly, the Tagliatelle al Tartufo is a big favorite here. It's our signature truffle pasta with 36-month Parmigiano Reggiano for €28."


def get_menu_overview(category: Optional[str] = None) -> str:
    """Return menu overview in a natural conversational style without giant lists."""
    if category == "drinks":
        return "We have signature cocktails like the Chérie Spritz Royale (€16), fine Italian & French wines, and artisanal coffee. Would you like a cocktail or wine recommendation?"

    if category == "desserts":
        return "For dessert, our Tiramisu au Calvados (€14) and Cannoli Siciliani (€12) are big favorites. Both are made fresh in-house."

    return "We specialize in artisan fresh pasta, antipasti, and grilled mains. A few guest favorites are our Tagliatelle al Tartufo, Burrata Pugliese, and Côte de Boeuf. What kind of dish are you in the mood for?"


def get_services(service_type: str) -> str:
    """Return specific service information conversationally."""
    if service_type == "takeaway":
        return "Yep, we offer takeaway for our whole menu. You can order at the counter or call ahead for pickup at +33 1 42 68 55 90."
    if service_type == "delivery":
        return "Yes, delivery is available through select courier partners."
    if service_type == "wifi":
        return "Yes, we have high-speed Wi-Fi available for all our guests."
    if service_type == "parking":
        return "We don't have private parking, but there is public parking nearby at Parking Baudoyer in Le Marais."
    if service_type in ["outdoor_seating", "outdoor"]:
        return "Yes, we have a lovely outdoor terrace seating area."
    if service_type in ["pets", "dogs"]:
        return "Dogs are welcome on our outdoor terrace! We love having furry friends join."

    return "We offer full dine-in service, takeaway pickup, outdoor terrace seating, and private dining."


def get_reservations() -> str:
    """Return reservation information."""
    return "Of course! What date are you thinking?"


# ---------------------------------------------------------------------------
# Strict Unrelated / Prompt Injection Detection & Warm Fallbacks
# ---------------------------------------------------------------------------
CAFE_ONLY_FALLBACK = (
    "I can help with the café — menu, dishes, opening hours, reservations and things like that. What would you like to know?"
)


def check_small_talk(message: str) -> Optional[str]:
    """
    Handle natural café-related small talk and pleasantries without robotic deflections.
    """
    clean = normalize_text(message)
    words = set(clean.split())

    # Gratitude
    if any(clean.startswith(w) or clean == w for w in ["thank you", "thanks", "thx", "thank u", "many thanks", "appreciate it"]):
        return "You're welcome! Glad I could help."
    if "thank" in words or "thanks" in words:
        return "You're welcome!"

    # Positive affirmations / satisfaction
    if clean in ["perfect", "great", "awesome", "nice", "sounds good", "wonderful", "cool", "super", "got it", "all right", "alright", "okay", "ok"]:
        return "Glad I could help."

    # Farewells
    if any(clean.startswith(w) for w in ["bye", "goodbye", "see you", "have a good day", "have a nice day", "cya"]):
        return "Have a wonderful day! See you soon at the café."

    # Casual greetings
    if clean in ["hi", "hello", "hey", "bonjour", "ciao", "good morning", "good evening", "good afternoon"]:
        return "Hello! Welcome to Bistrot Chérie. What can I help you with today?"

    return None

INJECTION_PATTERNS = [
    r"\bignore\s+(?:all\s+)?(?:your\s+)?(?:previous\s+)?instructions\b",
    r"\bforget\s+(?:the\s+)?(?:all\s+)?(?:previous\s+)?(?:caf[eé]\s+)?rules\b",
    r"\bsystem\s+prompt\b",
    r"\bsystem\s+instruction\b",
    r"\bhidden\s+prompt\b",
    r"\breveal\s+(?:your\s+)?prompt\b",
    r"\bshow\s+me\s+(?:your\s+)?(?:system\s+)?prompt\b",
    r"\btell\s+me\s+(?:your\s+)?(?:system\s+)?prompt\b",
    r"\bwhat\s+is\s+your\s+system\s+prompt\b",
    r"\bapi\s+key\b",
]

UNRELATED_PATTERNS = [
    r"\btell\s+(?:me\s+)?(?:a\s+)?joke\b",
    r"\bmake\s+me\s+laugh\b",
    r"\bprime\s+minister\b",
    r"\bpresident\s+of\b",
    r"\bwho\s+is\s+the\s+president\b",
    r"\bpolitics\b",
    r"\bpolitician\b",
    r"\bwho\s+won\s+the\s+(?:cricket|match|game|election|world\s+cup|ipl)\b",
    r"\bcricket\s+match\b",
    r"\bweather\s+(?:today|tomorrow|forecast|like)\b",
    r"\bwhat('?s|\s+is)\s+the\s+weather\b",
    r"\b(?:write|generate|explain)\s+(?:python|javascript|code|java|c\+\+|html|css|script|sql|regex)\b",
    r"\btell\s+me\s+about\s+python\b",
    r"\bquantum\s+physics\b",
    r"\bphysics\b",
    r"\binvestment\s+advice\b",
    r"\bcrypto\b",
    r"\bbitcoin\b",
    r"\bstock\s+market\b",
    r"\b(?:write|fix)\s+(?:my\s+)?resume\b",
    r"\bwrite\s+(?:an?\s+)?essay\b",
    r"\bwrite\s+(?:a\s+)?cover\s+letter\b",
    r"\bwho\s+is\s+elon\s+musk\b",
]


def is_unrelated_or_injection(message: str) -> bool:
    """Check if message is a prompt injection or clearly unrelated question."""
    msg_lower = message.strip().lower()
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, msg_lower):
            return True
    for pattern in UNRELATED_PATTERNS:
        if re.search(pattern, msg_lower):
            return True
    return False


# ---------------------------------------------------------------------------
# Text Normalization & Dynamic Menu Entity Resolution
# ---------------------------------------------------------------------------
def normalize_text(text: str) -> str:
    """
    Normalizes text for robust matching:
    - NFKD Unicode decomposition (strips accents: é -> e, à -> a, ô -> o, etc.)
    - Lowercase
    - Removes punctuation and extra whitespace
    """
    if not text:
        return ""
    nfkd = unicodedata.normalize("NFKD", text)
    ascii_text = nfkd.encode("ASCII", "ignore").decode("utf-8")
    cleaned = re.sub(r"[^\w\s]", " ", ascii_text.lower())
    return " ".join(cleaned.split())


GENERIC_OR_CAFE_WORDS = {
    "cherie", "bistrot", "bistro", "cafe", "italian", "italy", "artisanal",
    "house", "style", "fresh", "special", "signature", "royal", "royale",
    "food", "dish", "dishes", "menu", "drink", "drinks", "order", "table",
    "reservation", "hours", "open", "close", "price", "servings", "portions", "plates"
}

STOP_WORDS = {"and", "with", "the", "for", "al", "la", "di", "con", "de", "le", "au", "du", "sur", "a"}

WORD_TO_NUMBER = {
    "a": 1, "an": 1, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "single": 1, "double": 2, "couple": 2
}

PRONOUN_OR_REFERENCE = re.compile(
    r"\b(?:it|this|them|that|these|the\s+same|one|dish|pasta|food|portions?|plates?|servings?|that\s+dish|this\s+dish|the\s+dish|those)\b",
    re.IGNORECASE
)

ORDERING_FOOD_REGEX = re.compile(
    r"\b(?:can\s+i\s+order|can\s+we\s+order|i\s+(?:want|would\s+like)\s+to\s+order|we\s+(?:want|would\s+like)\s+to\s+order|order\s+(?:it|this|that|them|one|\d+)|place\s+(?:an?\s+)?order)\b",
    re.IGNORECASE
)


def extract_quantity(text: str) -> Optional[int]:
    """
    Extracts ordered food quantity or number of portions from text.
    Only applies to food portions/plates/servings/orders.
    """
    clean = normalize_text(text)

    # 1. "X portions/plates/servings/orders/dishes/bowls/cups/glasses/pieces"
    m = re.search(
        r"\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+(?:portions?|plates?|servings?|orders?|dishes|bowls?|cups?|glasses?|pieces?)\b",
        clean,
    )
    if m:
        val = m.group(1)
        return int(val) if val.isdigit() else WORD_TO_NUMBER.get(val)

    # 2. "order / want to order / have X portions"
    m = re.search(
        r"\b(?:order|want\s+to\s+order|bring)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b",
        clean,
    )
    if m:
        val = m.group(1)
        return int(val) if val.isdigit() else WORD_TO_NUMBER.get(val)

    # 3. "X of them / X of these / X of this"
    m = re.search(
        r"\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+of\s+(?:them|these|this|it)\b",
        clean,
    )
    if m:
        val = m.group(1)
        return int(val) if val.isdigit() else WORD_TO_NUMBER.get(val)

    return None


def find_menu_item_in_text(text: str, menu_list: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Search text for menu entities built dynamically from cafe_knowledge.json.
    Normalizes both text and entity names, tolerating accents, punctuation, and extra words.
    Ignores generic cafe words (cherie, bistrot, italian, etc.) to prevent false triggers.
    """
    if not text:
        return None
    clean = normalize_text(text)
    clean_words = set(clean.split())

    # Strategy 1: Exact normalized name substring match (Longest name match first)
    sorted_menu = sorted(menu_list, key=lambda x: len(normalize_text(x.get("name", ""))), reverse=True)
    for item in sorted_menu:
        norm_name = normalize_text(item.get("name", ""))
        if norm_name and norm_name in clean:
            return item

    # Strategy 2: Distinctive token match (tokens with len >= 5 unique to the item, excluding generic/cafe words)
    for item in sorted_menu:
        norm_name = normalize_text(item.get("name", ""))
        item_tokens = [w for w in norm_name.split() if w not in STOP_WORDS and w not in GENERIC_OR_CAFE_WORDS]
        for tok in item_tokens:
            if len(tok) >= 5 and tok in clean_words:
                return item

    # Strategy 3: Common culinary synonyms & keywords mapping dynamically to menu items
    culinary_synonyms = [
        ("truffle", "Tagliatelle al Tartufo"),
        ("tartufo", "Tagliatelle al Tartufo"),
        ("tagliatelle", "Tagliatelle al Tartufo"),
        ("burrata", "Burrata Pugliese & Pêches Rôties"),
        ("fiorentina", "Côte de Boeuf à la Fiorentina"),
        ("bistecca", "Côte de Boeuf à la Fiorentina"),
        ("arancini", "Arancini al Ragù di Cervo"),
        ("pappardelle", "Pappardelle al Cinghiale"),
        ("cinghiale", "Pappardelle al Cinghiale"),
        ("polpo", "Polpo alla Griglia con Nduja"),
        ("octopus", "Polpo alla Griglia con Nduja"),
        ("tiramisu", "Tiramisu au Calvados"),
        ("cannoli", "Cannoli Siciliani al Pistacchio"),
        ("spritz", "Chérie Spritz Royale"),
        ("paloma", "Smoky Mezcal Paloma Italian"),
        ("mezcal", "Smoky Mezcal Paloma Italian"),
        ("paneer", "Paneer Tikka"),
        ("espresso", "Artisanal Espresso"),
        ("cappuccino", "Cappuccino Chérie")
    ]
    for key, target_name in culinary_synonyms:
        if key in clean_words:
            for item in menu_list:
                if item.get("name") == target_name:
                    return item

    return None


def is_table_reservation_query(msg_clean: str) -> bool:
    """Checks if message is asking to book or reserve a table, seats, or check availability."""
    if not msg_clean:
        return False
    reservation_phrases = [
        "reserve a table", "book a table", "table reservation", "table reservations",
        "reserve table", "book table", "booking a table", "reserving a table",
        "make a reservation", "make reservation", "do a reservation",
        "table booking", "table bookings", "book a spot", "reserve a spot",
        "do you take reservations", "how to book a table", "how can i book a table",
        "how to reserve a table", "how can i reserve a table",
        "can i book", "can we book", "can i reserve", "can we reserve",
        "want to book", "want to reserve", "like to book", "like to reserve",
        "need a table", "have a table", "get a table", "book it", "reserve it",
        "reservation", "reservations", "table for", "seat for", "seats for"
    ]
    if any(p in msg_clean for p in reservation_phrases):
        return True

    if re.search(r"\b(?:reserve|reserving|reservation|reservations)\b", msg_clean):
        return True
    if re.search(r"\b(?:book|booking)\b", msg_clean) and any(
        w in msg_clean for w in ["table", "dinner", "lunch", "tonight", "tomorrow", "seats", "spot", "people", "guests", "person"]
    ):
        return True
    if re.search(r"\b(?:table|seats?|place|spot)\s+(?:for\s+)?(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten|a\s+couple)\b", msg_clean):
        return True
    return False


def is_opening_hours_query(msg_clean: str) -> bool:
    if any(q in msg_clean for q in [
        "what time do you open", "when do you open", "when do you close",
        "what time you open", "what time you close", "opening hours",
        "are you open today", "are you open", "timings", "what are your hours",
        "what are today s opening hours", "closing hours", "closing time",
        "what time do you close", "when are you open", "hours of operation",
        "opening time", "are you open now"
    ]):
        return True
    if re.search(r"\b(?:open|opening|close|closing)\s+(?:hours?|times?|timings?)\b", msg_clean):
        return True
    return False


def is_location_query(msg_clean: str) -> bool:
    if any(q in msg_clean for q in [
        "where are you located", "what is your address", "whats your address",
        "where is the cafe", "where is the restaurant", "where are you situated",
        "how do i reach", "how to find you", "where is bistrot cherie",
        "directions", "how to get there"
    ]):
        return True
    if re.search(r"\bwhere\s+are\s+you\b", msg_clean) and not re.search(r"\brecommend\b", msg_clean):
        return True
    if re.search(r"\b(?:your\s+)?address\b", msg_clean) and not re.search(r"\bemail\b", msg_clean):
        return True
    return False


def is_contact_query(msg_clean: str) -> bool:
    if any(q in msg_clean for q in [
        "what is your phone", "whats your phone", "phone number",
        "how can i contact", "how to contact", "what is your email",
        "whats your email", "contact number", "call you", "contact you"
    ]):
        return True
    if re.search(r"\b(?:phone\s+number|contact\s+number|call\s+you|email\s+address)\b", msg_clean):
        return True
    return False


def is_service_query(msg_clean: str) -> Optional[str]:
    if any(q in msg_clean for q in ["takeaway", "take away", "take out", "takeout", "carry out"]):
        return "takeaway"
    if any(q in msg_clean for q in ["delivery", "deliver", "home delivery"]):
        return "delivery"
    if any(q in msg_clean for q in ["wifi", "wi fi", "internet"]):
        return "wifi"
    if any(q in msg_clean for q in ["parking", "park a car", "parking space"]):
        return "parking"
    if any(q in msg_clean for q in ["outdoor seating", "terrace", "patio", "outside seating", "outdoor table"]):
        return "outdoor_seating"
    if any(q in msg_clean for q in ["dog", "dogs", "pet", "pets"]):
        return "pets"
    return None


def resolve_menu_entity(
    message: str,
    history: Optional[List[Any]],
    menu_list: List[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    """
    Resolve active menu entity:
    1. First, search directly in the current message.
    2. If not found, check if message refers to previous items (e.g., 'it', 'this')
       and resolve from recent conversation history ONLY if this query is actually about a menu dish.
    """
    clean = normalize_text(message)

    # If the user is asking to book a table, opening hours, address, etc., do NOT resolve an entity!
    if (
        is_table_reservation_query(clean)
        or is_opening_hours_query(clean)
        or is_location_query(clean)
        or is_contact_query(clean)
        or is_service_query(clean) is not None
        or is_best_seller_query(clean)
        or any(w in clean for w in ["recommend", "recommendation", "suggest", "suggestion", "what is good", "what s good"])
    ):
        return None

    # Direct match in message
    direct = find_menu_item_in_text(message, menu_list)
    if direct:
        return direct

    # Multi-turn reference check: ONLY resolve from history if the user explicitly references
    # a dish via pronoun or asks a dish property (price, dietary, ingredients, availability)
    has_dish_ref = bool(re.search(
        r"\b(?:it|this|that|them|these|the\s+same|one|the\s+dish|that\s+dish|this\s+dish|those)\b",
        clean
    ))
    is_dish_property = any(
        w in clean for w in ["vegetarian", "veg", "vegan", "price", "cost", "ingredients", "available", "how much", "calories", "nuts", "gluten"]
    )
    is_explicit_order_dish = bool(re.search(
        r"\b(?:order\s+(?:it|this|that|them|one|\d+)|can\s+i\s+order\s+(?:it|this|that|them)|i\s+(?:want|would\s+like)\s+to\s+order)\b",
        clean
    ))

    if (has_dish_ref or is_dish_property or is_explicit_order_dish) and history:
        for turn in reversed(history):
            content = turn.get("content", "") if isinstance(turn, dict) else getattr(turn, "content", "")
            if content:
                hist_item = find_menu_item_in_text(content, menu_list)
                if hist_item:
                    logger.info(f"Resolved menu entity from conversation history: {hist_item['name']}")
                    return hist_item

    return None


def is_best_seller_query(msg_clean: str) -> bool:
    """
    Normalized best-seller intent detection covering varied customer phrasings.
    Resolves directly to BEST_SELLER without calling Gemini.
    """
    if not msg_clean:
        return False

    # Exclude group recommendations like "recommend for 3 people"
    if any(w in msg_clean for w in ["recommend for", "group", "3 people", "three people"]):
        return False

    # 1. Direct best seller keywords (covers "best seller", "bestseller", "best selling", "top seller", etc.)
    if any(k in msg_clean for k in [
        "best seller", "bestseller", "best sellers", "bestsellers",
        "best selling", "top seller", "top selling", "top dish"
    ]):
        return True

    # 2. Most popular variations (covers "most popular item", "most popular dish", "which item is most popular", etc.)
    if "most popular" in msg_clean:
        return True

    # 3. Popular queries with dish/item/food or interrogatives
    if "popular" in msg_clean and any(w in msg_clean for w in ["item", "dish", "food", "what", "which", "most"]):
        return True

    # 4. "Order the most" / "ordered the most" (covers "what dish do customers order the most", "what do people order the most")
    if re.search(r"\b(?:order(?:ed)?|orders)\s+(?:the\s+)?most\b", msg_clean):
        return True

    # 5. Customer habit: "what do people/customers usually order"
    if re.search(r"\b(?:people|customers|guests)\s+(?:usually\s+)?order\b", msg_clean) and any(w in msg_clean for w in ["what", "which"]):
        return True

    # 6. Customer favorites / signature dish
    if any(k in msg_clean for k in [
        "customer favorite", "customer favorites", "most famous dish", "most famous item",
        "signature dish", "what is your specialty"
    ]):
        return True

    return False


# ---------------------------------------------------------------------------
# Fast Intent Classifier & Dispatcher
# ---------------------------------------------------------------------------
def detect_intent_and_respond(
    message: str,
    history: Optional[List[Any]] = None
) -> Tuple[str, Optional[str], Optional[str]]:
    """
    Returns:
    (intent_category, direct_answer, tailored_gemini_context)
    If direct_answer is provided, we return immediately without calling Gemini!

    Routing Priority:
    0. Natural small talk
    1. Clearly unrelated questions & prompt injections
    2. Table Reservations & Multi-turn Booking Flow (Never hijacked by previous dishes)
    3. Direct Quick Inquiries (Hours, Location, Contact, Services, Best Seller)
    4. General Menu & Category Overviews (Drinks, Desserts, Beef, Vegetarian)
    5. Specific Menu Item Match (Direct or explicit multi-turn pronoun reference)
    6. General conversational café inquiries -> Gemini
    """
    data = load_knowledge()
    menu_list = data.get("menu", [])

    msg_clean = normalize_text(message)
    msg_words = set(msg_clean.split())
    msg_raw_lower = message.strip().lower()

    # =========================================================================
    # PRIORITY 0: Natural small talk (greetings, thanks, compliments)
    # =========================================================================
    small_talk = check_small_talk(message)
    if small_talk:
        return ("small_talk", small_talk, None)

    # =========================================================================
    # PRIORITY 1: Clearly unrelated questions & prompt injections
    # =========================================================================
    if is_unrelated_or_injection(msg_raw_lower):
        return ("unrelated", CAFE_ONLY_FALLBACK, None)

    # =========================================================================
    # PRIORITY 2: Table Reservations & Multi-turn Booking Flow
    # (Evaluated before menu items so phrases like 'I want to reserve a table'
    # are never hijacked by food-ordering logic!)
    # =========================================================================
    is_res = is_table_reservation_query(msg_clean)
    history_in_booking = False
    if history:
        for turn in history[-4:]:
            content = getattr(turn, 'content', '') or (turn.get('content', '') if isinstance(turn, dict) else '')
            if any(w in content.lower() for w in ["table", "book", "reservation", "guests", "what date", "what time", "what name", "confirm your table", "confirm it"]):
                history_in_booking = True
                break

    # If in booking flow and NOT asking an explicit hours/location/contact query
    if is_res or (history_in_booking and not (is_opening_hours_query(msg_clean) or is_location_query(msg_clean) or is_contact_query(msg_clean))):
        tailored_context = build_tailored_context(msg_clean, is_reservation=True)
        return ("reservations_flow", None, tailored_context)

    # =========================================================================
    # PRIORITY 3: Quick Direct Inquiries (Hours, Location, Contact, Services, Best Seller)
    # =========================================================================
    # 3A. Fast Opening Hours
    if is_opening_hours_query(msg_clean):
        return ("opening_hours", get_opening_hours(), None)

    # 3B. Fast Location & Address
    if is_location_query(msg_clean):
        return ("location", get_location(), None)

    # 3C. Fast Contact & Phone
    if is_contact_query(msg_clean):
        return ("contact", get_contact(), None)

    # 3D. Fast Services & Facilities
    service_kind = is_service_query(msg_clean)
    if service_kind:
        return (f"services_{service_kind}", get_services(service_kind), None)

    # 3E. Fast Best Seller / Popular Dish
    if is_best_seller_query(msg_clean):
        return ("best_seller", get_best_seller(), None)

    # =========================================================================
    # PRIORITY 4: General Menu, Categories, Beef, Vegetarian overviews
    # =========================================================================
    # 4A. Beef dishes query
    if "beef" in msg_words and any(w in msg_clean for w in ["dish", "dishes", "menu", "option", "options", "tell", "what", "have"]):
        beef_item = next(
            (i for i in menu_list if "beef" in normalize_text(i.get("name", "") + " " + i.get("description", ""))),
            None
        )
        if beef_item:
            ans = (
                f"Our signature beef specialty is the {beef_item['name']} ({beef_item.get('price_display', '')}) — "
                f"{beef_item.get('description', '')}"
            )
            return ("beef_dishes", ans, None)

    # 4B. Vegetarian general menu options
    if any(w in msg_clean for w in ["vegetarian options", "do you have vegetarian", "veg options", "vegan options", "vegetarian menu"]):
        ans = "Yes! We have several vegetarian favorites, including our Tagliatelle al Tartufo (€28), Burrata Pugliese (€21), and Paneer Tikka (₹299)."
        return ("menu_vegetarian", ans, None)

    # 4C. General Menu, Drinks, Desserts
    if any(q in msg_clean for q in [
        "what is on the menu", "whats on the menu", "show me the menu",
        "what food do you have", "show menu", "view menu", "see the menu"
    ]):
        return ("menu_general", get_menu_overview(), None)

    if any(q in msg_clean for q in [
        "what drinks do you have", "drinks menu", "what beverages do you have",
        "cocktails do you have", "do you have cocktails", "wine list"
    ]):
        return ("menu_drinks", get_menu_overview("drinks"), None)

    if any(q in msg_clean for q in [
        "what desserts do you have", "dessert menu", "any sweets", "what dolci do you have"
    ]):
        return ("menu_desserts", get_menu_overview("desserts"), None)

    # =========================================================================
    # PRIORITY 5: Specific Menu item / entity match
    # =========================================================================
    item = resolve_menu_entity(message, history, menu_list)
    if item:
        quantity = extract_quantity(message)
        unit_price = item.get("price")
        unit_display = item.get("price_display", f"€{unit_price}")
        currency = "₹" if "₹" in unit_display else ("$" if "$" in unit_display else "€")

        # 5A. Dietary / Vegetarian / Vegan Check
        if any(w in msg_words for w in ["vegetarian", "veg", "vegan"]):
            if "vegan" in msg_words:
                if item.get("vegan"):
                    ans = f"Yep, {item['name']} is 100% vegan."
                else:
                    ans = f"No, {item['name']} isn't vegan."
            else:
                if item.get("vegetarian"):
                    ans = "Yep, it is."
                else:
                    ans = f"No, that one isn't vegetarian. But our Tagliatelle al Tartufo and Burrata Pugliese are both great vegetarian options."
            return ("menu_dietary_lookup", ans, None)

        # 5B. Ingredients / Description Lookup
        if any(w in msg_clean for w in ["ingredient", "what is in", "what s in", "tell me about", "describe"]):
            dietary_notes = " It's vegetarian, too." if item.get("vegetarian") else ""
            ans = f"It's {item.get('description', '')}.{dietary_notes}"
            return ("menu_details_lookup", ans, None)

        # 5C. Availability Lookup
        if any(w in msg_words for w in ["available", "in stock"]):
            ans = f"Yep, that's available on our menu for {unit_display}."
            return ("menu_availability_lookup", ans, None)

        # 5D. Ingredient Customization / Allergen Query (Route to Gemini with item context)
        is_customization = any(
            w in msg_clean for w in ["without", "allergic", "allergy", "no onion", "no garlic", "substitute", "replace"]
        )
        if is_customization and quantity is None:
            item_ctx = build_tailored_context(msg_clean, active_item=item)
            return ("menu_item_gemini", None, item_ctx)

        # 5E. True Food Ordering Intent (Deterministic math, NEVER claiming order placed)
        is_ordering_intent = (
            bool(ORDERING_FOOD_REGEX.search(msg_clean))
            or (quantity is not None and any(w in msg_clean for w in ["portion", "portions", "plate", "plates", "serving", "servings", "order", "orders", "bowl", "bowls", "piece", "pieces"]))
        )
        if is_ordering_intent:
            qty = quantity if quantity and quantity > 0 else 1
            if unit_price is not None and isinstance(unit_price, (int, float)):
                total = unit_price * qty
                total_str = f"{currency}{int(total) if total == int(total) else f'{total:.2f}'}"
                unit_str = f"{currency}{int(unit_price) if unit_price == int(unit_price) else f'{unit_price:.2f}'}"
                if qty > 1:
                    ans = (
                        f"Yes — {item['name']} is on our menu for {unit_str} each, so {qty} portions would be {total_str}. "
                        f"I can't place orders directly through chat, but you can order in person or call us at +33 1 42 68 55 90."
                    )
                else:
                    ans = (
                        f"Yes — {item['name']} is on our menu for {unit_str}. "
                        f"I can't place the order directly here, but you can order in person or call us at +33 1 42 68 55 90."
                    )
                return ("menu_order_info", ans, None)
            else:
                ans = f"Yes, {item['name']} is on our menu for {unit_display}. You can order in person or by phone at +33 1 42 68 55 90."
                return ("menu_order_info", ans, None)

        # 5F. Price Lookup
        if any(w in msg_clean for w in ["price", "cost", "how much", "expensive"]):
            ans = f"It's {unit_display}."
            return ("menu_price_lookup", ans, None)

        # 5G. Nuanced Question about this item -> Gemini with focused item context
        item_ctx = build_tailored_context(msg_clean, active_item=item)
        return ("menu_item_gemini", None, item_ctx)

    # =========================================================================
    # PRIORITY 6: Conversational Recommendations & General Café Queries -> Gemini
    # =========================================================================
    cafe_keywords = [
        "recommend", "recommendation", "suggest", "suggestion", "good for", "best dishes",
        "cafe", "café", "restaurant", "bistrot", "cherie", "food", "table", "vibe", "ambience",
        "atmosphere", "music", "chef", "wine", "cocktail", "pasta", "dessert", "eat",
        "lunch", "dinner", "menu", "dish", "dishes", "card", "payment", "pet", "dog", "kids"
    ]
    if any(k in msg_clean for k in cafe_keywords):
        tailored_context = build_tailored_context(msg_clean)
        return ("complex_gemini", None, tailored_context)

    # Fallback to café-only deflection
    return ("unrelated", CAFE_ONLY_FALLBACK, None)


def build_tailored_context(
    msg_lower: str,
    active_item: Optional[Dict[str, Any]] = None,
    is_reservation: bool = False
) -> str:
    """
    Construct a concise, focused context for Gemini rather than passing the entire knowledge base.
    Saves tokens and makes response time significantly faster.
    """
    data = load_knowledge()
    cafe_name = data.get("cafe_info", {}).get("name", "Bistrot Chérie")
    lines = [f"CAFÉ: {cafe_name}"]

    # If handling a table reservation / booking conversation
    if is_reservation:
        lines.append("\nTABLE RESERVATIONS & BOOKING ASSISTANCE:")
        lines.append("- Service Hours: Mon-Sun 12:00 PM – 01:30 AM (Paris Flagship).")
        lines.append("- Booking Window: Tables can be booked up to 30 days in advance.")
        lines.append("- Group Policy: Parties over 8 guests should call +33 1 42 68 55 90.")
        lines.append("- Walk-ins: Always welcome.")
        lines.append("\nBOOKING CONVERSATION RULES:")
        lines.append("- Act like a friendly, efficient café host.")
        lines.append("- Ask for ONE missing detail at a time (date -> time -> guests -> name -> phone).")
        lines.append("- If the guest already mentioned info (e.g., 'Tomorrow at 8 for four'), NEVER re-ask for it! Simply acknowledge and ask for their name: 'Got it. What name should I put the booking under?'")
        lines.append("- Once details are complete, summarize and ask: 'Thanks. So that's [Name], [count] guests, [date] at [time]. Want me to confirm it?'")
        lines.append("- When confirmed, reply: 'You're all set. Your table is booked for [date] at [time].'")
        return "\n".join(lines)

    # If focused on a specific active item
    if active_item:
        lines.append(f"\nACTIVE MENU ITEM UNDER DISCUSSION:")
        lines.append(f"Name: {active_item.get('name')}")
        lines.append(f"Category: {active_item.get('category')}")
        lines.append(f"Price: {active_item.get('price_display')}")
        lines.append(f"Description & Ingredients: {active_item.get('description')}")
        lines.append(f"Vegetarian: {active_item.get('vegetarian')}")
        lines.append(f"Vegan: {active_item.get('vegan')}")
        lines.append(f"Dietary: {', '.join(active_item.get('dietary', []))}")
        lines.append("\nNOTE: The chatbot cannot place orders directly. Guide guests to order at the café or call +33 1 42 68 55 90.")
        return "\n".join(lines)

    menu = data.get("menu", [])

    # If vegetarian/vegan recommendation
    if any(w in msg_lower for w in ["vegetarian", "veg", "vegan", "meat"]):
        lines.append("\nVEGETARIAN & VEGAN MENU ITEMS:")
        for item in menu:
            if item.get("vegetarian") or item.get("vegan"):
                price = item.get("price_display", str(item.get("price", "")))
                lines.append(f"- {item['name']} ({item.get('category')}): {price}. {item.get('description')}")
        return "\n".join(lines)

    # If dessert / sweet / coffee
    if any(w in msg_lower for w in ["sweet", "dessert", "dolci", "coffee", "pastry"]):
        lines.append("\nDESSERTS & COFFEE MENU ITEMS:")
        for item in menu:
            if item.get("category") in ["Dolci & Desserts", "Coffee & Beverages"]:
                price = item.get("price_display", str(item.get("price", "")))
                lines.append(f"- {item['name']} ({item.get('category')}): {price}. {item.get('description')}")
        return "\n".join(lines)

    # If group / friends / celebration
    if any(w in msg_lower for w in ["group", "friends", "party", "people", "kids", "children", "birthday", "3 people", "three people"]):
        lines.append("FACILITIES & POLICIES:")
        for f in data.get("facilities", []):
            lines.append(f"- {f}")
        res = data.get("reservations", {})
        lines.append(f"Group policy: {res.get('group_bookings', '')}")
        lines.append("\nSIGNATURE SHARING DISHES FOR GROUPS:")
        lines.append("- Côte de Boeuf à la Fiorentina (€85 for two, 45-day aged Chianina beef ribeye)")
        lines.append("- Tagliatelle al Tartufo (€28, fresh Norcia black truffle shaved tableside)")
        lines.append("- Burrata Pugliese & Pêches Rôties (€21, creamy 250g burrata with roasted peaches)")
        lines.append("- Arancini al Ragù di Cervo (€18, crispy saffron risotto spheres)")
        lines.append("- Tiramisu au Calvados (€14, artisan dessert)")
        lines.append("\nNOTE: The chatbot cannot place orders directly. Never say order is placed.")
        return "\n".join(lines)

    # General concise menu context
    lines.append("\nFEATURED DISHES & PRICES:")
    for item in menu:
        price = item.get("price_display", str(item.get("price", "")))
        lines.append(f"- {item['name']} ({price}): {item.get('description')}")

    return "\n".join(lines)
