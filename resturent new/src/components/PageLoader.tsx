import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageLoaderProps {
  onComplete: () => void;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'intro' | 'tagline' | 'curtain'>('intro');

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('tagline'), 700);
    const timer2 = setTimeout(() => setPhase('curtain'), 1800);
    const timer3 = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== 'curtain' && (
        <motion.div
          key="loader"
          initial={{ y: 0 }}
          exit={{ y: '-100%', transition: { duration: 0.9, ease: [0.76, 0, 0.24, 1] } }}
          className="fixed inset-0 z-[10000] bg-[#1F3D2B] text-[#F6EFE3] flex flex-col items-center justify-center p-6 select-none"
        >
          {/* Animated decorative ring */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.1, 1], opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="w-24 h-24 rounded-full border-2 border-[#E9B44C]/30 flex items-center justify-center mb-6 relative overflow-hidden"
          >
            <span className="text-4xl animate-bounce">🍷</span>
          </motion.div>

          <div className="overflow-hidden mb-3">
            <motion.h1
              initial={{ y: 80 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl md:text-7xl font-serif-display tracking-tight text-center font-bold"
            >
              Bistrot <span className="italic text-[#E9B44C]">Chérie</span>
            </motion.h1>
          </div>

          <div className="overflow-hidden h-8">
            {phase === 'tagline' && (
              <motion.p
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-sm md:text-lg font-light tracking-widest uppercase text-[#ECE3D2]"
              >
                Italian Soul • French Elegance
              </motion.p>
            )}
          </div>

          {/* Progress loader bar */}
          <div className="w-48 h-[2px] bg-white/20 mt-8 rounded-full overflow-hidden">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '0%' }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
              className="w-full h-full bg-[#E9B44C]"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
