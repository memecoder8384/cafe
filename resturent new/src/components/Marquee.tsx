import React, { useState, useEffect } from 'react';
import { MARQUEE_EVENTS } from '../data/restaurantData';
import { Sparkles, Calendar, Music, Wine, Flame } from 'lucide-react';

export const Marquee: React.FC = () => {
  const [scrollDirection, setScrollDirection] = useState<'left' | 'right'>('left');
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY) {
        setScrollDirection('left');
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('right');
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const items = [...MARQUEE_EVENTS, ...MARQUEE_EVENTS, ...MARQUEE_EVENTS];

  const getIcon = (idx: number) => {
    const icons = [
      <Sparkles key="1" className="w-4 h-4" />,
      <Calendar key="2" className="w-4 h-4" />,
      <Wine key="3" className="w-4 h-4" />,
      <Music key="4" className="w-4 h-4" />,
      <Flame key="5" className="w-4 h-4" />
    ];
    return icons[idx % icons.length];
  };

  return (
    <section id="marquee-section" className="py-8 bg-[#1A1A1A] overflow-hidden border-y border-white/10 select-none">
      <div className="flex items-center gap-2 mb-3 px-6 text-center justify-center text-xs uppercase tracking-widest text-[#E9B44C] font-semibold">
        <Sparkles className="w-3.5 h-3.5 animate-spin" />
        <span>Weekly Happenings & Bistro Vibe • Scroll Reverses Direction</span>
      </div>

      <div className="relative w-full overflow-hidden py-3">
        {/* Horizontal Gradient Vignette */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#1A1A1A] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#1A1A1A] to-transparent z-10 pointer-events-none" />

        <div className={scrollDirection === 'left' ? 'animate-marquee' : 'animate-marquee-reverse'}>
          {items.map((event, index) => (
            <div
              key={`${event.id}-${index}`}
              className="inline-flex items-center gap-3 px-6 py-3 mx-3 rounded-full font-serif-display font-medium text-lg md:text-xl shadow-md transition-transform duration-300 hover:scale-105 cursor-pointer border border-white/10"
              style={{
                backgroundColor: event.bgColor,
                color: event.textColor,
              }}
              data-cursor="Event"
              data-cursor-variant="hover"
            >
              <span>{getIcon(index)}</span>
              <span>{event.label}</span>
              <span className="opacity-40 text-xs font-sans">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
