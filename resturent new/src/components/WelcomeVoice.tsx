import React, { useEffect, useRef } from 'react';

interface WelcomeVoiceProps {
  isSiteReady: boolean;
}

export const WelcomeVoice: React.FC<WelcomeVoiceProps> = ({ isSiteReady }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasTriggeredRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isSiteReady || hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    const audio = new Audio('/welcome.mp3');
    audio.preload = 'auto';
    audioRef.current = audio;

    const playAudio = async () => {
      try {
        await audio.play();
      } catch {
        // Fallback for strict browser autoplay policies: trigger on first user interaction
        const handleFirstInteraction = () => {
          audio.play().catch(() => {});
          window.removeEventListener('click', handleFirstInteraction);
          window.removeEventListener('touchstart', handleFirstInteraction);
          window.removeEventListener('keydown', handleFirstInteraction);
        };

        window.addEventListener('click', handleFirstInteraction, { once: true });
        window.addEventListener('touchstart', handleFirstInteraction, { once: true });
        window.addEventListener('keydown', handleFirstInteraction, { once: true });
      }
    };

    // Small delay to ensure smooth page load
    const timer = setTimeout(() => {
      playAudio();
    }, 300);

    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [isSiteReady]);

  // Audio-only gesture: no visual UI
  return null;
};

export default WelcomeVoice;
