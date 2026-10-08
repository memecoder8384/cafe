import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HERO_PHOTOS } from '../data/restaurantData';
import { Sparkles, ArrowDown, Utensils } from 'lucide-react';

interface HeroProps {
  onOpenReservation?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenReservation }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section className="relative min-h-screen w-full flex flex-col justify-between items-center px-6 md:px-12 pt-28 pb-12 overflow-hidden select-none bg-[#F6EFE3]">
      {/* Subtle Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E9B44C]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-[#C8321F]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Floating Photo Collage (Desktop & Tablet) */}
      <div className="absolute inset-0 pointer-events-none hidden md:block z-0">
        {HERO_PHOTOS.map((photo, index) => {
          const offsetX = mousePos.x * 25 * photo.depth;
          const offsetY = mousePos.y * 25 * photo.depth;

          return (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.6, y: 40, rotate: photo.rotation * 2 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: [0, -10, 0],
                rotate: photo.rotation,
              }}
              transition={{
                opacity: { duration: 0.8, delay: index * 0.12 + 0.3 },
                scale: { duration: 0.8, delay: index * 0.12 + 0.3, ease: [0.16, 1, 0.3, 1] },
                y: { duration: 4 + index, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
              }}
              style={{
                position: 'absolute',
                top: photo.top,
                left: photo.left,
                right: photo.right,
                bottom: photo.bottom,
                transform: `translate3d(${offsetX}px, ${offsetY}px, 0px) rotate(${photo.rotation}deg)`,
                transition: 'transform 0.15s ease-out',
              }}
              className={`group pointer-events-auto cursor-pointer shadow-2xl rounded-2xl md:rounded-3xl overflow-hidden border-4 border-white/90 bg-white ${photo.size}`}
              data-cursor={photo.caption}
              data-cursor-variant="image"
            >
              <img
                src={photo.url}
                alt={photo.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                <span className="text-white font-serif-display text-sm md:text-base font-semibold">
                  {photo.caption}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Hero Badge Tagline */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="z-10 mb-4 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#1F3D2B]/10 border border-[#1F3D2B]/20 text-[#1F3D2B] text-xs font-semibold uppercase tracking-widest"
      >
        <span className="w-2 h-2 rounded-full bg-[#C8321F] animate-ping" />
        <span>Italian-French Bistro & Aperitivo Bar • Paris • Milano • NY</span>
      </motion.div>

      {/* Main Giant Headline */}
      <div className="z-10 max-w-6xl mx-auto text-center my-auto px-4 py-8">
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-7xl md:text-8xl lg:text-[7.5rem] font-serif-display font-bold text-[#1A1A1A] leading-[0.92] tracking-tight text-balance"
        >
          Life is a <span className="font-serif-italic text-[#C8321F]">party</span>, <br />
          and the table is a <span className="font-serif-italic text-[#1F3D2B]">feast</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-6 md:mt-8 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-[#1A1A1A]/80 font-normal leading-relaxed text-balance"
        >
          Fresh handmade tagliatelle at dawn, natural orange wines at twilight, and late-night laughter under brass chandeliers. Welcome to <span className="font-semibold text-[#C8321F]">Bistrot Chérie</span>.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.75 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={onOpenReservation}
            className="px-8 py-4 rounded-full bg-[#C8321F] text-white font-medium text-sm md:text-base uppercase tracking-wider btn-sweep shadow-xl hover:shadow-2xl transition-all flex items-center gap-2"
            data-cursor="Book Table"
            data-cursor-variant="button"
          >
            <Sparkles className="w-4 h-4 text-[#E9B44C]" />
            <span>Book Your Table</span>
          </button>

          <a
            href="#menu-section"
            onClick={(e) => {
              e.preventDefault();
              const el = document.querySelector('#menu-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-8 py-4 rounded-full bg-white/80 border-2 border-[#1A1A1A]/10 text-[#1A1A1A] font-medium text-sm md:text-base uppercase tracking-wider hover:bg-[#1F3D2B] hover:text-white hover:border-[#1F3D2B] transition-all shadow-sm flex items-center gap-2"
            data-cursor="See Food"
          >
            <Utensils className="w-4 h-4 text-[#C8321F]" />
            <span>Explore Menu</span>
          </a>
        </motion.div>
      </div>

      {/* Mobile Photo Strip */}
      <div className="md:hidden w-full my-6 grid grid-cols-2 gap-3 px-2">
        {HERO_PHOTOS.slice(0, 4).map((photo) => (
          <div
            key={photo.id}
            className="rounded-xl overflow-hidden h-36 border-2 border-white shadow-md relative"
          >
            <img src={photo.url} alt={photo.alt} className="w-full h-full object-cover" />
            <span className="absolute bottom-1 left-2 text-[10px] text-white font-serif-display font-semibold bg-black/50 px-2 py-0.5 rounded-full">
              {photo.caption}
            </span>
          </div>
        ))}
      </div>

      {/* Scroll Down Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="z-10 flex items-center gap-3 text-xs uppercase tracking-widest text-[#1A1A1A]/60 font-semibold cursor-pointer group"
        onClick={() => {
          const el = document.querySelector('#marquee-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      >
        <span>Scroll to Taste</span>
        <div className="w-8 h-8 rounded-full border border-[#1A1A1A]/20 flex items-center justify-center group-hover:bg-[#C8321F] group-hover:text-white group-hover:border-[#C8321F] transition-all">
          <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
        </div>
      </motion.div>
    </section>
  );
};
