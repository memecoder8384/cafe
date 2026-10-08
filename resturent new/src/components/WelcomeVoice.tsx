import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface WelcomeVoiceProps {
  isSiteReady: boolean;
}

export const WelcomeVoice: React.FC<WelcomeVoiceProps> = ({ isSiteReady }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hasPlayed, setHasPlayed] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showWidget, setShowWidget] = useState<boolean>(false);

  useEffect(() => {
    if (!isSiteReady) return;

    const audio = new Audio('/welcome.mp3');
    audio.preload = 'auto';
    audioRef.current = audio;

    audio.onplay = () => {
      setIsPlaying(true);
      setShowWidget(true);
    };

    audio.onended = () => {
      setIsPlaying(false);
      setHasPlayed(true);
    };

    audio.onerror = (e) => {
      console.warn('Welcome voice playback notice:', e);
    };

    // Attempt autoplay upon site reveal
    const startAudio = async () => {
      try {
        await audio.play();
        setIsPlaying(true);
        setShowWidget(true);
      } catch {
        // Browser autoplay blocked -> wait for the user's very first interaction
        const triggerOnFirstInteraction = async () => {
          try {
            await audio.play();
            setIsPlaying(true);
            setShowWidget(true);
          } catch (err) {
            console.warn('Playback on interaction notice:', err);
          } finally {
            window.removeEventListener('click', triggerOnFirstInteraction);
            window.removeEventListener('touchstart', triggerOnFirstInteraction);
            window.removeEventListener('keydown', triggerOnFirstInteraction);
          }
        };

        window.addEventListener('click', triggerOnFirstInteraction, { once: true });
        window.addEventListener('touchstart', triggerOnFirstInteraction, { once: true });
        window.addEventListener('keydown', triggerOnFirstInteraction, { once: true });
      }
    };

    // Small delay to let page transition complete gracefully
    const playTimer = setTimeout(() => {
      startAudio();
    }, 400);

    return () => {
      clearTimeout(playTimer);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [isSiteReady]);

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setIsMuted(true);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        setIsMuted(false);
      }).catch(console.warn);
    }
  };

  const handleReplay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().then(() => {
      setIsPlaying(true);
      setIsMuted(false);
      setShowWidget(true);
    }).catch(console.warn);
  };

  if (!isSiteReady || !showWidget) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="fixed bottom-6 left-6 z-[9995] flex items-center gap-3 bg-[#1F3D2B]/95 backdrop-blur-md text-[#F6EFE3] px-4 py-2.5 rounded-full border border-[#E9B44C]/30 shadow-2xl select-none"
      >
        {/* Animated Sound Wave Equalizer Bars */}
        <div className="flex items-center gap-1 h-3.5 px-0.5">
          <motion.span
            animate={isPlaying ? { height: ['4px', '14px', '6px'] } : { height: '4px' }}
            transition={isPlaying ? { repeat: Infinity, duration: 0.8, ease: 'easeInOut' } : {}}
            className="w-[2px] bg-[#E9B44C] rounded-full"
          />
          <motion.span
            animate={isPlaying ? { height: ['12px', '4px', '14px'] } : { height: '4px' }}
            transition={isPlaying ? { repeat: Infinity, duration: 0.7, ease: 'easeInOut' } : {}}
            className="w-[2px] bg-[#E9B44C] rounded-full"
          />
          <motion.span
            animate={isPlaying ? { height: ['6px', '14px', '4px'] } : { height: '4px' }}
            transition={isPlaying ? { repeat: Infinity, duration: 0.9, ease: 'easeInOut' } : {}}
            className="w-[2px] bg-[#E9B44C] rounded-full"
          />
        </div>

        {/* Status text */}
        <span className="text-xs font-serif-display tracking-wide font-medium">
          {isPlaying ? 'Welcome gesture playing' : hasPlayed ? 'Welcome gesture ended' : 'Bistrot Chérie voice'}
        </span>

        {/* Action button: Mute / Pause or Replay */}
        {isPlaying ? (
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-full hover:bg-white/10 text-[#F6EFE3] transition-colors"
            title="Mute voice"
            data-cursor="Mute"
            data-cursor-variant="button"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-[#E9B44C]" /> : <Volume2 className="w-3.5 h-3.5 text-[#E9B44C]" />}
          </button>
        ) : (
          <button
            onClick={handleReplay}
            className="flex items-center gap-1 text-[11px] font-medium text-[#E9B44C] hover:text-white transition-colors pl-1"
            title="Replay welcome gesture"
            data-cursor="Replay"
            data-cursor-variant="button"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Replay</span>
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default WelcomeVoice;
