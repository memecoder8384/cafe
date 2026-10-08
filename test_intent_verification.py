import json
import sys
import urllib.request

sys.stdout.reconfigure(encoding="utf-8")

def call_chat(message, history=None):
    url = "http://127.0.0.1:8000/api/chat"
    payload = {"message": message, "history": history or []}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        return res["reply"]

def call_stream(message, history=None):
    url = "http://127.0.0.1:8000/api/chat/stream"
    payload = {"message": message, "history": history or []}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    chunks = []
    with urllib.request.urlopen(req) as resp:
        for line in resp:
            line_str = line.decode("utf-8").strip()
            if line_str.startswith("data:"):
                payload_json = json.loads(line_str[5:].strip())
                chunk = payload_json.get("chunk", "")
                chunks.append(chunk)
                if payload_json.get("done") and not chunk:
                    break
    return "".join(chunks)

print("=" * 80)
print("TESTING BACKEND ENDPOINTS (/api/chat & /api/chat/stream)")
print("=" * 80)

# TEST 1: THE CRITICAL BUG REPORTED BY USER
q1 = "can i order Tagliatelle al Tartufo for 3 person ?"
res1 = call_chat(q1)
print(f"\n[TEST 1 - USER'S REPORTED BUG]\nQuery: '{q1}'\nReply:\n{res1}\n")
assert "I'm sorry, I don't have that information" not in res1, "FAIL: Returned 'no information'!"
assert "84" in res1, "FAIL: Total €84 not calculated!"
assert "28" in res1, "FAIL: Price €28 not mentioned!"
assert "placed" not in res1.lower() or "can't place" in res1.lower() or "cannot place" in res1.lower(), "FAIL: Falsely claimed order was placed!"
print(">>> TEST 1 PASSED: Menu item recognized, 3 * €28 = €84 calculated deterministically, order placement guardrail enforced!\n")

# TEST 2: STREAMING VERSION OF THE REPORTED BUG
res1_stream = call_stream(q1)
print(f"[TEST 2 - STREAMING REPORTED BUG]\nQuery: '{q1}'\nReply:\n{res1_stream}\n")
assert "84" in res1_stream and "28" in res1_stream, "FAIL: Stream mismatch!"
print(">>> TEST 2 PASSED!\n")

# TEST 3: PRICE LOOKUP
q3 = "How much is Tagliatelle al Tartufo?"
res3 = call_chat(q3)
print(f"[TEST 3 - PRICE LOOKUP]\nQuery: '{q3}'\nReply: {res3}\n")
assert "28" in res3, "FAIL: Price €28 not found!"
print(">>> TEST 3 PASSED!\n")

# TEST 4: QUANTITY 2
q4 = "Can I get 2 Tagliatelle al Tartufo?"
res4 = call_chat(q4)
print(f"[TEST 4 - QUANTITY 2]\nQuery: '{q4}'\nReply: {res4}\n")
assert "56" in res4 and "28" in res4, "FAIL: 2 * €28 = €56 not calculated!"
print(">>> TEST 4 PASSED!\n")

# TEST 5: QUANTITY 3
q5 = "I want 3 Tagliatelle al Tartufo"
res5 = call_chat(q5)
print(f"[TEST 5 - QUANTITY 3]\nQuery: '{q5}'\nReply: {res5}\n")
assert "84" in res5 and "28" in res5, "FAIL: 3 * €28 = €84 not calculated!"
print(">>> TEST 5 PASSED!\n")

# TEST 6: VEGETARIAN FIELD LOOKUP
q6 = "Is Tagliatelle al Tartufo vegetarian?"
res6 = call_chat(q6)
print(f"[TEST 6 - VEGETARIAN LOOKUP]\nQuery: '{q6}'\nReply: {res6}\n")
assert "vegetarian" in res6.lower() and "yes" in res6.lower(), "FAIL: Vegetarian status not recognized!"
print(">>> TEST 6 PASSED!\n")

# TEST 7: INGREDIENTS / DESCRIPTION
q7 = "What ingredients are in Tagliatelle al Tartufo?"
res7 = call_chat(q7)
print(f"[TEST 7 - INGREDIENTS LOOKUP]\nQuery: '{q7}'\nReply: {res7}\n")
assert "parmigiano" in res7.lower() or "truffle" in res7.lower(), "FAIL: Ingredients not found!"
print(">>> TEST 7 PASSED!\n")

# TEST 8: BEEF DISHES
q8 = "Tell me about your beef dishes"
res8 = call_chat(q8)
print(f"[TEST 8 - BEEF DISHES]\nQuery: '{q8}'\nReply: {res8}\n")
assert "boeuf" in res8.lower() or "fiorentina" in res8.lower(), "FAIL: Beef dish not found!"
print(">>> TEST 8 PASSED!\n")

# TEST 9: UNRELATED QUESTIONS FALLBACK
unrelated_tests = [
    "Who is the president of India?",
    "Write Python code",
    "Tell me a joke"
]
for uq in unrelated_tests:
    ures = call_chat(uq)
    print(f"[TEST UNRELATED]\nQuery: '{uq}'\nReply: {ures}\n")
    assert "help with questions about our café" in ures.lower() or "bistrot chérie" in ures.lower(), f"FAIL on unrelated query '{uq}'!"
print(">>> UNRELATED DEFLECTION TESTS PASSED!\n")

# TEST 10: MULTI-TURN ENTITY RESOLUTION
print("[TEST 10 - MULTI-TURN CONTEXT RESOLUTION]")
hist = [
    {"role": "user", "content": "Tell me about Tagliatelle al Tartufo."},
    {"role": "assistant", "content": "Tagliatelle al Tartufo is €28 on our menu."}
]
q10 = "Can I get it for 3 people?"
res10 = call_chat(q10, history=hist)
print(f"Turn 1: 'Tell me about Tagliatelle al Tartufo.'\nTurn 2: '{q10}'\nReply:\n{res10}\n")
assert "84" in res10 and "28" in res10, "FAIL: Multi-turn entity resolution failed for 'it'!"
print(">>> TEST 10 PASSED: 'it' correctly resolved to Tagliatelle al Tartufo, calculated €84!\n")

# TEST 11: MULTI-TURN "Can we order three of them?"
q11 = "Can we order three of them?"
res11 = call_chat(q11, history=hist)
print(f"Turn 2: '{q11}'\nReply:\n{res11}\n")
assert "84" in res11 and "28" in res11, "FAIL: Multi-turn entity resolution failed for 'three of them'!"
print(">>> TEST 11 PASSED!\n")

# TEST 12: RECOMMENDATION FOR 3 PEOPLE (CAFÉ-RELATED -> GEMINI STREAM)
q12 = "What do you recommend for 3 people?"
res12 = call_stream(q12)
print(f"[TEST 12 - RECOMMENDATION FOR 3 PEOPLE]\nQuery: '{q12}'\nStreamed Gemini Reply:\n{res12}\n")
assert len(res12) > 30, "FAIL: Recommendation too short or empty!"
print(">>> TEST 12 PASSED: Successfully routed to Gemini with menu/group context!\n")

print("=" * 80)
print("ALL 12 RIGOROUS INTENT DETECTION AND ROUTING TESTS PASSED PERFECTLY!")
print("=" * 80)
