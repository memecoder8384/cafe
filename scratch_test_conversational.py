import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8000"

def chat(message, history=None):
    req_data = {"message": message}
    if history:
        req_data["history"] = history
    data_bytes = json.dumps(req_data).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}/api/chat",
        data=data_bytes,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode("utf-8"))
            return res.get("reply", "")
    except urllib.error.HTTPError as e:
        return f"HTTP {e.code}: {e.read().decode('utf-8')}"
    except Exception as e:
        return f"ERROR: {e}"

def tts(text):
    req_data = {"text": text, "speaker": "simran"}
    data_bytes = json.dumps(req_data).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}/api/voice/tts",
        data=data_bytes,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            data = resp.read()
            return f"200 OK, audio/wav, {len(data)} bytes"
    except urllib.error.HTTPError as e:
        return f"HTTP {e.code}: {e.read().decode('utf-8')}"
    except Exception as e:
        return f"ERROR: {e}"

print("=== STARTING CONVERSATIONAL VERIFICATION SUITE ===")

# Test 1: Best seller
r1 = chat("What is your best seller?")
print(f"\n1. Best Seller:\nUSER: What is your best seller?\nBOT:  {r1}")

# Test 2: Multi-turn price follow-up
hist2 = [
    {"role": "user", "content": "What is your best seller?"},
    {"role": "assistant", "content": r1}
]
r2 = chat("How much is it?", hist2)
print(f"\n2. Price Follow-up:\nUSER: How much is it?\nBOT:  {r2}")

# Test 3: Multi-turn vegetarian follow-up
hist3 = hist2 + [
    {"role": "user", "content": "How much is it?"},
    {"role": "assistant", "content": r2}
]
r3 = chat("Is it vegetarian?", hist3)
print(f"\n3. Vegetarian Follow-up:\nUSER: Is it vegetarian?\nBOT:  {r3}")

# Test 4: Recommendation
r4 = chat("What do you recommend?")
print(f"\n4. Recommendation:\nUSER: What do you recommend?\nBOT:  {r4}")

# Test 5: Menu overview
r5 = chat("What's on the menu?")
print(f"\n5. Menu Overview:\nUSER: What's on the menu?\nBOT:  {r5}")

# Test 6: Booking Start
r6 = chat("Can I book a table?")
print(f"\n6. Booking Start:\nUSER: Can I book a table?\nBOT:  {r6}")

# Test 7: Multi-turn Booking (date, time, guests)
hist7 = [
    {"role": "user", "content": "Can I book a table?"},
    {"role": "assistant", "content": r6}
]
r7 = chat("Tomorrow at 8 for four.", hist7)
print(f"\n7. Booking Details:\nUSER: Tomorrow at 8 for four.\nBOT:  {r7}")

# Test 8: Booking Name & Phone
hist8 = hist7 + [
    {"role": "user", "content": "Tomorrow at 8 for four."},
    {"role": "assistant", "content": r7}
]
r8 = chat("John, phone is +33 1 23 45 67 89", hist8)
print(f"\n8. Booking Contact:\nUSER: John, phone is +33 1 23 45 67 89\nBOT:  {r8}")

# Test 8b: Confirmation
hist8b = hist8 + [
    {"role": "user", "content": "John, phone is +33 1 23 45 67 89"},
    {"role": "assistant", "content": r8}
]
r8b = chat("Book it.", hist8b)
print(f"\n8b. Booking Confirmation:\nUSER: Book it.\nBOT:   {r8b}")

# Test 9: Small Talk (Thanks)
r9 = chat("Thanks.")
print(f"\n9. Small Talk:\nUSER: Thanks.\nBOT:  {r9}")

# Test 10: Unrelated query
r10 = chat("Who is the president of France?")
print(f"\n10. Unrelated:\nUSER: Who is the president of France?\nBOT:  {r10}")

# Test 11: Unknown information query
r11 = chat("Do you have a kids playground?")
print(f"\n11. Unknown Info:\nUSER: Do you have a kids playground?\nBOT:  {r11}")

# Test 12: Short follow-up "What about the price?"
r12 = chat("What about the price?", hist3)
print(f"\n12. Short follow-up price:\nUSER: What about the price?\nBOT:  {r12}")

# Test 13: Voice synthesis
r13 = tts(r1)
print(f"\n13. Voice TTS for r1 ({r1[:30]}...):\nRESULT: {r13}")

print("\n=== ALL TESTS FINISHED ===")
