/**
 * Voice utilities for the Café Assistant chatbot.
 * Configurable constants, Web Speech API detection for microphone input,
 * and text cleaning for Sarvam AI natural TTS.
 */

// Language setting for voice
export const VOICE_LANGUAGE = 'en-IN';
export const FALLBACK_VOICE_LANGUAGE = 'en-US';

/**
 * Checks if the browser supports SpeechRecognition or webkitSpeechRecognition.
 */
export const isSpeechRecognitionSupported = () => {
  return (
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
};

/**
 * Strips markdown symbols, asterisks, bullet points, headers, and raw URLs,
 * and converts currency expressions to natural spoken words so Sarvam AI TTS
 * speaks smoothly and naturally like a real receptionist without reading formatting symbols.
 * Preserves authentic menu item names completely intact.
 */
export const cleanTextForSpeech = (text) => {
  if (!text) return '';
  return text
    // Remove emojis so TTS does not produce awkward sounds or pauses
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    // Remove markdown bold and italics: **text** or *text*
    .replace(/\*\*([^*]+)\*\*/g, (m, p) => p)
    .replace(/\*([^*]+)\*/g, (m, p) => p)
    .replace(/~~([^~]+)~~/g, (m, p) => p)
    // Remove markdown headers: ### Header
    .replace(/^#+\s+/gm, '')
    // Remove bullet points and dashes
    .replace(/^[\s*•-]+\s+/gm, '')
    // Replace markdown links [text](url) with just text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, (m, p) => p)
    // Remove raw URLs
    .replace(/https?:\/\/\S+/g, '')
    // Convert numbered ranks (e.g. #1 -> number 1)
    .replace(/#(\d+)/g, (m, p) => `number ${p}`)
    // Convert currency symbols to natural spoken words
    .replace(/€\s*(\d+(?:\.\d+)?)/g, (m, p) => `${p} euros`)
    .replace(/₹\s*(\d+(?:\.\d+)?)/g, (m, p) => `${p} rupees`)
    .replace(/\$\s*(\d+(?:\.\d+)?)/g, (m, p) => `${p} dollars`)
    // Replace em dashes or en dashes with commas for conversational pausing
    .replace(/[—–]/g, ', ')
    // Conversational touch for voice: "Yes, we" or "Yes, that" -> "Yep, we" / "Yep, that"
    .replace(/^Yes\s*,\s*/i, 'Yep, ')
    .replace(/\.\s*Yes\s*,\s*/g, '. Yep, ')
    // Replace ellipses and multiple newlines with natural conversational pauses
    .replace(/\.\.\./g, ', ')
    .replace(/\n+/g, '. ')
    // Clean up multiple commas or spaces
    .replace(/,\s*,+/g, ', ')
    .replace(/\.\s*\.+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
};
