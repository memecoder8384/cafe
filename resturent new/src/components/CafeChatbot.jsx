import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  UtensilsCrossed,
  Clock,
  MapPin,
  Phone,
  RefreshCw,
  AlertCircle,
  Mic,
  Square,
  Volume2,
  Loader2
} from 'lucide-react';
import {
  VOICE_LANGUAGE,
  FALLBACK_VOICE_LANGUAGE,
  cleanTextForSpeech,
  isSpeechRecognitionSupported
} from './voiceUtils';

const API_BASE_URL = import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:8000';

const INITIAL_MESSAGE = {
  id: 'init-1',
  role: 'assistant',
  content: `Hi! 👋 Welcome to Bistrot Chérie.\nI can help with our menu, prices, timings, location, reservations and more.\nWhat would you like to know?`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

const QUICK_ACTIONS = [
  { label: '🍽 Menu', query: 'What is on the menu and what are your popular dishes?' },
  { label: '🕐 Opening Hours', query: 'What are your opening hours?' },
  { label: '📍 Location', query: 'Where are you located?' },
  { label: '📞 Contact', query: 'How can I contact the café or make a reservation?' }
];

export const CafeChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Voice State Machine: 'idle' | 'requesting' | 'listening' | 'processing' | 'speaking' | 'error'
  const [voiceState, setVoiceState] = useState('idle');
  const [voiceMode, setVoiceMode] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState(null);

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const chatWindowRef = useRef(null);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const currentTranscriptRef = useRef('');
  const currentAudioRef = useRef(null);
  const currentAudioUrlRef = useRef(null);
  const ttsAbortControllerRef = useRef(null);
  const ttsRequestIdRef = useRef(0);

  // Auto-scroll inside the messages container
  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  };

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        scrollToBottom('smooth');
      });
      setHasUnread(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
    } else {
      // Clean up speech recognition and synthesis when chatbot closes
      stopSpeaking();
      stopListening();
      setVoiceState('idle');
      setInterimTranscript('');
      setVoiceError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, isLoading, interimTranscript]);

  // Handle Escape key to close the chatbot
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Clean up all audio playback and speech processes on component unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopListening();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Text-To-Speech (Sarvam AI Audio Playback with Interruption Support)
  // -------------------------------------------------------------------------
  const stopSpeaking = useCallback(() => {
    // 1. Abort any active Sarvam TTS network request
    if (ttsAbortControllerRef.current) {
      try {
        ttsAbortControllerRef.current.abort();
      } catch {
        // Ignore
      }
      ttsAbortControllerRef.current = null;
    }

    // 2. Increment request ID so any late arriving audio response is discarded
    ttsRequestIdRef.current += 1;

    // 3. Stop and reset active audio element
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current.onplay = null;
        currentAudioRef.current.onended = null;
        currentAudioRef.current.onerror = null;
      } catch (e) {
        console.warn('Error pausing audio element:', e);
      }
      currentAudioRef.current = null;
    }

    // 4. Revoke blob URL to prevent memory leaks
    if (currentAudioUrlRef.current) {
      try {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      } catch {
        // Ignore
      }
      currentAudioUrlRef.current = null;
    }

    setVoiceState((prev) => (prev === 'speaking' || prev === 'processing' ? 'idle' : prev));
  }, []);

  const speakResponse = useCallback(async (text) => {
    // Cancel any ongoing speech/audio playback immediately
    stopSpeaking();

    const speechText = cleanTextForSpeech(text);
    if (!speechText) {
      setVoiceState('idle');
      return;
    }

    // Generation/Request ID to protect against stale/out-of-order TTS responses
    const requestId = ++ttsRequestIdRef.current;

    // AbortController for this specific TTS request
    const abortController = new AbortController();
    ttsAbortControllerRef.current = abortController;

    // Keep state as processing ("Thinking...") until audio starts playing
    setVoiceState('processing');

    try {
      const response = await fetch(`${API_BASE_URL}/api/voice/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: speechText,
          language_code: VOICE_LANGUAGE,
          speaker: 'simran'
        }),
        signal: abortController.signal
      });

      // Stale check: if a newer request started or user interrupted, discard
      if (requestId !== ttsRequestIdRef.current) {
        return;
      }

      if (!response.ok) {
        console.warn('Sarvam TTS API returned non-200 status:', response.status);
        // Do NOT break or hide the text response; gracefully reset voice state
        setVoiceState('idle');
        return;
      }

      const audioBlob = await response.blob();

      // Second stale check before creating blob URL
      if (requestId !== ttsRequestIdRef.current) {
        return;
      }

      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      currentAudioUrlRef.current = audioUrl;

      audio.onplay = () => {
        if (requestId === ttsRequestIdRef.current) {
          setVoiceState('speaking');
        }
      };

      audio.onended = () => {
        if (currentAudioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);
          currentAudioUrlRef.current = null;
        }
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
        if (requestId === ttsRequestIdRef.current) {
          setVoiceState('idle');
        }
      };

      audio.onerror = (e) => {
        console.warn('Sarvam audio element playback notice:', e);
        if (currentAudioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);
          currentAudioUrlRef.current = null;
        }
        if (currentAudioRef.current === audio) {
          currentAudioRef.current = null;
        }
        if (requestId === ttsRequestIdRef.current) {
          setVoiceState('idle');
        }
      };

      // Play audio; catch browser autoplay restrictions gracefully
      try {
        await audio.play();
      } catch (playErr) {
        console.warn('Audio play was prevented by browser policy (e.g. autoplay):', playErr);
        if (currentAudioUrlRef.current === audioUrl) {
          URL.revokeObjectURL(audioUrl);
          currentAudioUrlRef.current = null;
        }
        currentAudioRef.current = null;
        if (requestId === ttsRequestIdRef.current) {
          setVoiceState('idle');
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // Intentional cancellation/interruption
        return;
      }
      console.warn('Sarvam TTS fetch exception:', err);
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
        currentAudioUrlRef.current = null;
      }
      currentAudioRef.current = null;
      if (requestId === ttsRequestIdRef.current) {
        setVoiceState('idle');
      }
    } finally {
      if (ttsAbortControllerRef.current === abortController) {
        ttsAbortControllerRef.current = null;
      }
    }
  }, [stopSpeaking]);

  // -------------------------------------------------------------------------
  // Speech Recognition
  // -------------------------------------------------------------------------
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore if already stopped
      }
    }
  }, []);

  const startListening = useCallback(async (isRetry = false) => {
    // 1. Browser capability check
    if (!isSpeechRecognitionSupported()) {
      setVoiceError(
        "Voice input isn't supported in this browser. Please use Chrome or Edge, or continue with text chat."
      );
      setVoiceState('idle');
      return;
    }

    // 2. Stop any existing speech playback immediately
    stopSpeaking();

    // 3. Abort any previous recognition instance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore
      }
      recognitionRef.current = null;
    }

    setVoiceError(null);
    setVoiceState('requesting');
    setVoiceMode(true);
    setInterimTranscript('');
    finalTranscriptRef.current = '';
    currentTranscriptRef.current = '';

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // If retrying after a network error, use universal fallback language 'en-US'
      const langToUse = isRetry ? FALLBACK_VOICE_LANGUAGE : (navigator.language || VOICE_LANGUAGE);
      recognition.lang = langToUse;

      recognition.onstart = () => {
        setVoiceState('listening');
        setVoiceError(null);
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          const transcript = item[0].transcript;
          if (item.isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        if (final) {
          finalTranscriptRef.current = (
            finalTranscriptRef.current +
            ' ' +
            final
          ).trim();
        }

        const latest = (finalTranscriptRef.current + ' ' + interim).trim();
        currentTranscriptRef.current = latest;
        setInterimTranscript(interim || finalTranscriptRef.current);
      };

      recognition.onspeechend = () => {
        setVoiceState('processing');
      };

      recognition.onerror = (event) => {
        const err = event.error;
        if (err === 'no-speech') {
          setVoiceError("I didn't hear anything. Please try again.");
          setVoiceState('idle');
        } else if (err === 'not-allowed' || err === 'service-not-allowed') {
          setVoiceError(
            'Microphone access is blocked. Please allow microphone access in your browser settings or continue using text chat.'
          );
          setVoiceState('idle');
        } else if (err === 'audio-capture') {
          setVoiceError(
            "I couldn't access your microphone. Please check your device settings."
          );
          setVoiceState('idle');
        } else if (err === 'network') {
          // Automatically retry once with universal fallback language (en-US)
          if (!isRetry) {
            console.warn(`Speech recognition network error with ${langToUse}. Retrying with ${FALLBACK_VOICE_LANGUAGE}...`);
            setTimeout(() => {
              startListening(true);
            }, 150);
            return;
          }

          // If persistent network error: check if Brave or adblocker
          const isBrave =
            Boolean(navigator.brave && typeof navigator.brave.isBrave === 'function') ||
            (navigator.userAgent && navigator.userAgent.includes('Brave'));

          if (isBrave) {
            setVoiceError(
              'Speech recognition blocked by Brave. In Brave, go to Settings → Privacy/System and enable "Google services for speech recognition", or use text chat.'
            );
          } else {
            setVoiceError(
              'A network error occurred with the browser speech recognition service. Please check your internet connection or continue using text chat.'
            );
          }
          setVoiceState('idle');
        } else if (err === 'aborted') {
          // Deliberate user interruption or stop
          setVoiceState('idle');
        } else {
          setVoiceError(
            'Voice recognition encountered an issue. Please try again or use text chat.'
          );
          setVoiceState('idle');
        }
      };

      recognition.onend = () => {
        const capturedText = (
          finalTranscriptRef.current || currentTranscriptRef.current
        ).trim();
        setInterimTranscript('');
        recognitionRef.current = null;

        console.log('VOICE TRANSCRIPT:\n' + capturedText);

        if (capturedText) {
          setVoiceState('processing');
          sendMessage(capturedText, { isVoice: true });
        } else {
          setVoiceState('idle');
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
      setVoiceError(
        'Could not start microphone. Please check permissions and try again.'
      );
      setVoiceState('idle');
    }
  }, [stopSpeaking]);

  // Click microphone button handler (handles start, stop, and interruption)
  const handleMicClick = () => {
    // If assistant is currently speaking or generating TTS: interrupt immediately and start listening!
    if (voiceState === 'speaking' || voiceState === 'processing') {
      stopSpeaking();
      startListening();
      return;
    }

    // If currently listening: stop listening to trigger early completion
    if (voiceState === 'listening') {
      stopListening();
      return;
    }

    // If idle or error: start listening
    startListening();
  };

  // -------------------------------------------------------------------------
  // Send Message Logic (Supports both Text and Voice Mode)
  // -------------------------------------------------------------------------
  const sendMessage = async (overrideText, options = {}) => {
    const isVoiceRequest = Boolean(options.isVoice);
    const textToSend = (overrideText || inputMessage).trim();
    if (!textToSend || isLoading) {
      if (isVoiceRequest) setVoiceState('idle');
      return;
    }

    if (textToSend.length > 1000) {
      setErrorMessage('Your message is too long (maximum 1000 characters).');
      if (isVoiceRequest) setVoiceState('idle');
      return;
    }

    setErrorMessage(null);
    setVoiceError(null);

    // Stop speaking any previous message
    stopSpeaking();

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const assistantId = `assistant-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message immediately
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    if (isVoiceRequest) {
      setVoiceState('processing');
    }

    // Format recent history for backend (limit to last 8 messages)
    const historyPayload = updatedMessages
      .slice(-8, -1)
      .map((m) => ({
        role: m.role,
        content: m.content
      }));

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 15000);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        let errDetail =
          "Sorry, I'm having trouble responding right now. Please try again.";
        try {
          const errData = await response.json();
          if (errData && errData.detail) {
            errDetail = errData.detail;
          }
        } catch {
          // Keep default fallback
        }

        setIsLoading(false);
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: errDetail,
            isError: true,
            timestamp
          }
        ]);

        if (isVoiceRequest) {
          speakResponse(errDetail);
        } else {
          setVoiceState('idle');
        }
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedContent = '';
      let hasStartedAssistantMessage = false;
      let streamDone = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;

          const dataJson = trimmed.slice(6).trim();
          if (dataJson === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(dataJson);
            const chunk = parsed.chunk || '';
            const isFinished = parsed.done;
            const isError = parsed.error;

            if (chunk) {
              accumulatedContent += chunk;

              if (!hasStartedAssistantMessage) {
                hasStartedAssistantMessage = true;
                setIsLoading(false);

                setMessages((prev) => [
                  ...prev,
                  {
                    id: assistantId,
                    role: 'assistant',
                    content: accumulatedContent,
                    timestamp,
                    isError: !!isError
                  }
                ]);
              } else {
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: accumulatedContent, isError: !!isError }
                      : msg
                  )
                );
              }

              scrollToBottom('smooth');
            }

            if (isFinished) {
              streamDone = true;
              break;
            }
          } catch (e) {
            console.error('SSE JSON parsing error:', e);
          }
        }

        if (streamDone) break;
      }

      if (!hasStartedAssistantMessage) {
        setIsLoading(false);
        const fallbackText =
          accumulatedContent ||
          "Sorry, I'm having trouble responding right now. Please try again.";
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: fallbackText,
            timestamp
          }
        ]);
        accumulatedContent = fallbackText;
      }

      // If this query was initiated via voice, speak the complete answer naturally!
      if (isVoiceRequest && accumulatedContent) {
        speakResponse(accumulatedContent);
      } else {
        setVoiceState('idle');
      }
    } catch (err) {
      console.error('Chatbot streaming communication error:', err);
      setIsLoading(false);
      const fallbackMsg =
        "Sorry, I'm having trouble responding right now. Please try again.";
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: fallbackMsg,
          isError: true,
          timestamp
        }
      ]);
      if (isVoiceRequest) {
        speakResponse(fallbackMsg);
      } else {
        setVoiceState('idle');
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickAction = (action) => {
    sendMessage(action.query);
  };

  const handleResetChat = () => {
    stopSpeaking();
    stopListening();
    setVoiceState('idle');
    setMessages([INITIAL_MESSAGE]);
    setErrorMessage(null);
    setVoiceError(null);
  };

  // Helper to render bold markdown and clean line breaks in messages
  const renderFormattedContent = (content) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} className={idx > 0 ? 'mt-1.5' : ''}>
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-[#1A1A1A]">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans print:hidden">
      {/* Floating Chat Trigger Button (Closed State) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0, rotate: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative"
          >
            <button
              onClick={() => setIsOpen(true)}
              aria-label="Open Café Assistant Chatbot"
              aria-expanded={isOpen}
              className="group relative flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#C8321F] text-[#F6EFE3] shadow-xl hover:shadow-2xl hover:shadow-[#C8321F]/30 transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#C8321F]/30"
            >
              {/* Animated subtle ripple background */}
              <span className="absolute inset-0 rounded-full bg-[#C8321F] animate-ping opacity-20 pointer-events-none" />

              {/* Icon Container */}
              <div className="relative flex items-center justify-center">
                <UtensilsCrossed className="w-6 h-6 md:w-7 md:h-7 transition-transform duration-300 group-hover:rotate-12" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E9B44C] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E9B44C]" />
                </span>
              </div>

              {/* Tooltip on hover */}
              <div className="absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-[#1A1A1A] text-[#F6EFE3] text-xs font-medium tracking-wide whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md hidden sm:block">
                Chat with Bistrot Chérie
                <span className="absolute top-1/2 -right-1 -translate-y-1/2 border-solid border-l-[#1A1A1A] border-l-4 border-y-transparent border-y-4 border-r-0" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Window (Open State) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWindowRef}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            role="dialog"
            aria-modal="false"
            aria-labelledby="chatbot-title"
            data-lenis-prevent="true"
            className="w-[calc(100vw-32px)] sm:w-[380px] h-[550px] max-h-[calc(100vh-100px)] flex flex-col bg-[#F6EFE3] rounded-3xl shadow-2xl border border-[#1A1A1A]/10 overflow-hidden text-[#1A1A1A] overscroll-contain"
            style={{
              boxShadow:
                '0 20px 40px -15px rgba(26, 26, 26, 0.25), 0 0 0 1px rgba(26, 26, 26, 0.05)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)'
            }}
          >
            {/* Header */}
            <header className="px-5 py-4 bg-[#1A1A1A] text-[#F6EFE3] flex items-center justify-between border-b border-[#F6EFE3]/10 select-none relative">
              <div className="flex items-center gap-3">
                {/* Café Brand Monogram Badge */}
                <div className="w-10 h-10 rounded-full bg-[#C8321F] text-white flex items-center justify-center font-serif-italic text-lg font-bold shadow-inner">
                  C
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      id="chatbot-title"
                      className="font-serif-display text-base font-bold tracking-tight text-[#F6EFE3]"
                    >
                      Café Assistant
                    </h2>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#1F3D2B] text-[#86efac] text-[10px] font-medium uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                      Online
                    </span>
                  </div>
                  <p className="text-[11px] text-[#ECE3D2]/70 font-light tracking-wide flex items-center gap-1">
                    <span>Ask with text or voice</span>
                    <span className="text-[#E9B44C]">🎙</span>
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetChat}
                  aria-label="Restart conversation"
                  title="Reset conversation"
                  className="p-1.5 rounded-full text-[#ECE3D2]/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C8321F]"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  aria-label="Close café assistant"
                  className="p-1.5 rounded-full text-[#ECE3D2]/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C8321F]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Quick Actions Bar */}
            <div
              data-lenis-prevent="true"
              onWheel={(e) => e.stopPropagation()}
              className="px-3.5 py-2 bg-[#ECE3D2]/60 border-b border-[#1A1A1A]/5 flex items-center gap-1.5 overflow-x-auto no-scrollbar"
            >
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickAction(action)}
                  disabled={isLoading || voiceState === 'listening'}
                  aria-label={`Ask: ${action.label}`}
                  className="shrink-0 px-2.5 py-1 text-xs font-medium bg-[#F6EFE3] hover:bg-[#C8321F] hover:text-white text-[#1A1A1A] rounded-full border border-[#1A1A1A]/10 shadow-2xs transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {action.label}
                </button>
              ))}
            </div>

            {/* Messages Scroll Area */}
            <div
              ref={messagesContainerRef}
              data-lenis-prevent="true"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="flex-1 overflow-y-auto p-4 space-y-3.5 text-sm bg-radial from-[#F6EFE3] to-[#ECE3D2]/40 chat-scroll-area overscroll-contain"
              style={{
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                touchAction: 'pan-y'
              }}
            >
              {messages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#C8321F] text-white rounded-2xl rounded-br-xs shadow-sm font-normal'
                          : message.isError
                          ? 'bg-red-50 text-red-900 border border-red-200 rounded-2xl rounded-bl-xs'
                          : 'bg-[#ECE3D2] text-[#1A1A1A] border border-[#1A1A1A]/5 rounded-2xl rounded-bl-xs shadow-2xs font-normal'
                      }`}
                    >
                      {message.isError && (
                        <div className="flex items-center gap-1.5 text-red-700 font-medium mb-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Notice</span>
                        </div>
                      )}
                      <div>{renderFormattedContent(message.content)}</div>
                    </div>
                    <span className="text-[10px] text-[#1A1A1A]/40 mt-1 px-1">
                      {message.timestamp}
                    </span>
                  </motion.div>
                );
              })}

              {/* Typing / Loading Indicator Bubble */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-start"
                >
                  <div className="px-4 py-3 bg-[#ECE3D2] border border-[#1A1A1A]/5 rounded-2xl rounded-bl-xs flex items-center gap-1.5 shadow-2xs">
                    <span className="text-xs text-[#1A1A1A]/60 font-medium mr-1 font-serif-italic">
                      Café Assistant is replying
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8321F] animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8321F] animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8321F] animate-bounce" />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Voice Status Panel (Active States Feedback) */}
            <AnimatePresence>
              {voiceState === 'requesting' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-2 bg-[#ECE3D2] border-t border-[#1A1A1A]/10 flex items-center gap-2 text-xs text-[#1A1A1A]"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C8321F] shrink-0" />
                  <span className="font-medium">Allow microphone access...</span>
                </motion.div>
              )}

              {voiceState === 'listening' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-2.5 bg-[#C8321F]/10 border-t border-[#C8321F]/20 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 text-[#C8321F] font-medium overflow-hidden">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C8321F] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#C8321F]" />
                    </span>
                    <span className="shrink-0 font-semibold">Listening...</span>
                    {interimTranscript && (
                      <span className="text-[#1A1A1A]/80 italic truncate ml-1">
                        "{interimTranscript}"
                      </span>
                    )}
                  </div>
                  <button
                    onClick={stopListening}
                    className="text-[11px] font-semibold text-[#C8321F] hover:text-[#9c2517] underline shrink-0 ml-2"
                  >
                    Done
                  </button>
                </motion.div>
              )}

              {voiceState === 'processing' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-2 bg-[#E9B44C]/15 border-t border-[#E9B44C]/30 flex items-center gap-2 text-xs text-[#1A1A1A]"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C8321F] shrink-0" />
                  <span className="font-medium">Thinking...</span>
                </motion.div>
              )}

              {voiceState === 'speaking' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-2 bg-[#1A1A1A] text-[#F6EFE3] border-t border-white/10 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Volume2 className="w-3.5 h-3.5 text-[#E9B44C] shrink-0" />
                    <span className="font-medium tracking-wide">Speaking...</span>
                    {/* Subtle audio waveform bars */}
                    <div className="flex items-center gap-0.5 ml-1">
                      <span className="w-0.5 h-2.5 bg-[#E9B44C] animate-pulse rounded-full" />
                      <span className="w-0.5 h-4 bg-[#E9B44C] animate-pulse rounded-full [animation-delay:0.15s]" />
                      <span className="w-0.5 h-2 bg-[#E9B44C] animate-pulse rounded-full [animation-delay:0.3s]" />
                      <span className="w-0.5 h-3.5 bg-[#E9B44C] animate-pulse rounded-full [animation-delay:0.45s]" />
                    </div>
                  </div>
                  <button
                    onClick={stopSpeaking}
                    aria-label="Stop speaking"
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[#F6EFE3] text-[11px] font-medium transition-colors"
                  >
                    <Square className="w-2.5 h-2.5 fill-current" />
                    <span>Stop</span>
                  </button>
                </motion.div>
              )}

              {voiceError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-4 py-2 bg-red-50 text-red-800 text-xs flex items-center justify-between border-t border-red-200"
                >
                  <div className="flex items-center gap-1.5 flex-1 pr-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span className="leading-snug">{voiceError}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setVoiceError(null);
                        startListening(false);
                      }}
                      className="text-[11px] font-semibold text-red-800 hover:text-red-950 underline cursor-pointer"
                    >
                      Retry
                    </button>
                    <button
                      onClick={() => setVoiceError(null)}
                      aria-label="Dismiss error"
                      className="text-red-900 font-bold hover:opacity-75 cursor-pointer ml-1"
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Banner if message validation fails */}
            {errorMessage && (
              <div className="px-4 py-2 bg-red-100 text-red-800 text-xs flex items-center justify-between border-t border-red-200">
                <span>{errorMessage}</span>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-red-900 hover:opacity-75"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Input Form Footer */}
            <footer className="p-3 bg-[#F6EFE3] border-t border-[#1A1A1A]/10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about our café..."
                    maxLength={1000}
                    disabled={isLoading || voiceState === 'listening'}
                    aria-label="Ask about our café..."
                    className="w-full px-4 py-2.5 text-xs sm:text-sm bg-white rounded-full border border-[#1A1A1A]/15 text-[#1A1A1A] placeholder-[#1A1A1A]/40 focus:outline-none focus:border-[#C8321F] focus:ring-2 focus:ring-[#C8321F]/20 transition-all disabled:opacity-60"
                  />
                </div>

                {/* Voice Microphone / Stop Button */}
                {voiceState === 'speaking' ? (
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    aria-label="Stop speaking"
                    title="Stop speaking"
                    className="w-10 h-10 sm:w-10 sm:h-10 min-w-[40px] min-h-[40px] rounded-full bg-[#1A1A1A] hover:bg-[#333333] text-white flex items-center justify-center transition-all duration-200 shadow-md active:scale-95 shrink-0 focus:outline-none focus:ring-2 focus:ring-[#C8321F]/40"
                  >
                    <Square className="w-4 h-4 fill-white" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleMicClick}
                    disabled={isLoading && voiceState !== 'listening'}
                    aria-label={
                      voiceState === 'listening'
                        ? 'Stop listening'
                        : voiceState === 'requesting'
                        ? 'Requesting microphone access'
                        : 'Talk to Café Assistant'
                    }
                    title={
                      voiceState === 'listening'
                        ? 'Listening... click to stop'
                        : 'Talk to Café Assistant'
                    }
                    className={`relative w-10 h-10 sm:w-10 sm:h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center transition-all duration-200 shadow-md active:scale-95 shrink-0 focus:outline-none focus:ring-2 focus:ring-[#C8321F]/40 ${
                      voiceState === 'listening'
                        ? 'bg-[#C8321F] text-white ring-4 ring-[#C8321F]/30'
                        : voiceState === 'requesting'
                        ? 'bg-[#E9B44C] text-[#1A1A1A]'
                        : 'bg-[#ECE3D2] hover:bg-[#dfd4bf] text-[#1A1A1A] border border-[#1A1A1A]/15'
                    }`}
                  >
                    {voiceState === 'listening' ? (
                      <>
                        <span className="absolute inset-0 rounded-full bg-[#C8321F] animate-ping opacity-40 pointer-events-none" />
                        <Mic className="w-4 h-4 animate-pulse" />
                      </>
                    ) : voiceState === 'requesting' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                )}

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading || voiceState === 'listening'}
                  aria-label="Send question"
                  className="w-10 h-10 sm:w-10 sm:h-10 min-w-[40px] min-h-[40px] rounded-full bg-[#C8321F] hover:bg-[#a52616] text-white flex items-center justify-center transition-all duration-200 shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-[#C8321F]/40 shrink-0"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
              <div className="flex items-center justify-between mt-2 px-2 text-[10px] text-[#1A1A1A]/50 font-light">
                <span>Type or tap 🎙 to speak</span>
                <span>Press Esc to close</span>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CafeChatbot;
