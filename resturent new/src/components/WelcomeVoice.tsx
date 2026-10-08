import React, { useEffect, useRef } from 'react';

interface WelcomeVoiceProps {
  isSiteReady: boolean;
}

export const WelcomeVoice: React.FC<WelcomeVoiceProps> = ({ isSiteReady }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedRef = useRef<boolean>(false);

  useEffect(() => {
    // 1. Preload audio as soon as component mounts
    if (!audioRef.current) {
      const audio = new Audio('/welcome.mp3');
      audio.preload = 'auto';
      audio.volume = 1.0;
      audioRef.current = audio;
    }

    const audio = audioRef.current;

    const playAudio = async () => {
      if (hasPlayedRef.current || !audio) return;
      try {
        await audio.play();
        hasPlayedRef.current = true;
      } catch {
        // Browser autoplay policy restricted automated playback without user gesture.
        // Listen to first user gesture using capture phase so no child stopPropagation can block it.
        const unlockAndPlay = async () => {
          if (hasPlayedRef.current || !audio) return;
          try {
            await audio.play();
            hasPlayedRef.current = true;
          } catch (e) {
            console.warn('Welcome audio playback error:', e);
          } finally {
            cleanup();
          }
        };

        const cleanup = () => {
          window.removeEventListener('pointerdown', unlockAndPlay, true);
          window.removeEventListener('click', unlockAndPlay, true);
          window.removeEventListener('touchstart', unlockAndPlay, true);
          window.removeEventListener('keydown', unlockAndPlay, true);
        };

        window.addEventListener('pointerdown', unlockAndPlay, { capture: true, once: true });
        window.addEventListener('click', unlockAndPlay, { capture: true, once: true });
        window.addEventListener('touchstart', unlockAndPlay, { capture: true, once: true });
        window.addEventListener('keydown', unlockAndPlay, { capture: true, once: true });
      }
    };

    if (isSiteReady && !hasPlayedRef.current) {
      // Allow curtain transition to unveil before speaking
      const timer = setTimeout(() => {
        playAudio();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isSiteReady]);

  // Purely audio gesture - zero visual UI
  return null;
};

export default WelcomeVoice;
