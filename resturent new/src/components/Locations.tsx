import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LOCATIONS } from '../data/restaurantData';
import type { LocationItem } from '../data/restaurantData';
import { MapPin, Phone, Clock, ArrowUpRight, Sparkles, X } from 'lucide-react';

interface LocationsProps {
  onReserveLocation?: (city: string) => void;
}

export const Locations: React.FC<LocationsProps> = ({ onReserveLocation }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const getStatusBadge = (status: LocationItem['status'], text: string) => {
    switch (status) {
      case 'open':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-800 text-xs font-semibold uppercase tracking-wider border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            {text}
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-900 text-xs font-semibold uppercase tracking-wider border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-600" />
            {text}
          </span>
        );
      case 'coming-soon':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C8321F]/20 text-[#C8321F] text-xs font-semibold uppercase tracking-wider border border-[#C8321F]/30">
            <Sparkles className="w-3 h-3 text-[#C8321F]" />
            {text}
          </span>
        );
    }
  };

  const activeHoveredLocation = LOCATIONS.find((loc) => loc.id === hoveredId);

  return (
    <section id="locations" className="py-24 px-6 md:px-12 bg-[#F6EFE3] relative overflow-hidden select-none">
      {/* Cursor Following Image Preview (Desktop Only) */}
      <AnimatePresence>
        {activeHoveredLocation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -4 }}
            animate={{ opacity: 1, scale: 1, rotate: 2 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              left: cursorPos.x + 24,
              top: cursorPos.y - 120,
              pointerEvents: 'none',
              zIndex: 90,
            }}
            className="hidden lg:block w-72 h-80 rounded-3xl overflow-hidden border-4 border-white shadow-2xl bg-black"
          >
            <img
              src={activeHoveredLocation.image}
              alt={activeHoveredLocation.city}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
              <span className="text-white font-serif-display font-bold text-xl">
                {activeHoveredLocation.city}
              </span>
              <span className="text-[#E9B44C] text-xs font-sans uppercase">
                {activeHoveredLocation.neighborhood}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 border-b border-[#1A1A1A]/10 pb-8">
          <div>
            <span className="text-xs uppercase tracking-widest font-semibold text-[#C8321F] mb-3 block">
              Global Bistro Residences
            </span>
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-serif-display font-bold text-[#1A1A1A] leading-[0.95] tracking-tight">
              Our restaurants <br />
              <span className="font-serif-italic text-[#1F3D2B]">welcome you</span>
            </h2>
          </div>

          {/* Large Counter Number */}
          <div className="flex items-baseline gap-2">
            <span className="font-serif-display text-7xl md:text-9xl font-extrabold text-[#C8321F] leading-none">
              04
            </span>
            <span className="text-xs uppercase tracking-widest text-[#1A1A1A]/60 font-semibold">
              Destinations
            </span>
          </div>
        </div>

        {/* Location Rows List */}
        <div className="space-y-4">
          {LOCATIONS.map((loc, idx) => {
            const isHovered = hoveredId === loc.id;
            const isAnyHovered = hoveredId !== null;

            return (
              <motion.div
                key={loc.id}
                onMouseEnter={() => setHoveredId(loc.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setSelectedLocation(loc)}
                animate={{
                  opacity: isAnyHovered ? (isHovered ? 1 : 0.3) : 1,
                  x: isHovered ? 12 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="group py-8 px-6 md:px-8 rounded-3xl border border-[#1A1A1A]/10 bg-white/40 hover:bg-white transition-all duration-300 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm hover:shadow-xl"
                data-cursor="Inspect"
                data-cursor-variant="hover"
              >
                {/* Left: Number & City Name */}
                <div className="flex items-center gap-6">
                  <span className="text-sm font-semibold font-mono text-[#1A1A1A]/40 group-hover:text-[#C8321F] transition-colors">
                    0{idx + 1}
                  </span>
                  <div>
                    <h3 className="text-3xl md:text-5xl lg:text-6xl font-serif-display font-bold text-[#1A1A1A] group-hover:text-[#C8321F] transition-colors">
                      {loc.city} <span className="font-serif-italic text-2xl md:text-4xl text-[#1A1A1A]/60">({loc.neighborhood})</span>
                    </h3>
                    <p className="text-xs text-[#1A1A1A]/70 font-sans mt-1">
                      {loc.address}
                    </p>
                  </div>
                </div>

                {/* Right: Hours, Badge & Arrow */}
                <div className="flex flex-wrap items-center gap-4 lg:gap-8 justify-between lg:justify-end">
                  {getStatusBadge(loc.status, loc.statusText)}

                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-semibold text-[#1A1A1A]/80">{loc.hours}</p>
                    <p className="text-xs text-[#1A1A1A]/50">{loc.phone}</p>
                  </div>

                  <div className="w-12 h-12 rounded-full border border-[#1A1A1A]/20 flex items-center justify-center group-hover:bg-[#C8321F] group-hover:border-[#C8321F] group-hover:text-white transition-all shadow-md">
                    <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Location Detail Modal */}
      <AnimatePresence>
        {selectedLocation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLocation(null)}
            className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#F6EFE3] text-[#1A1A1A] rounded-3xl max-w-3xl w-full overflow-hidden border-2 border-white shadow-2xl"
            >
              <div className="relative h-64 md:h-80 bg-black">
                <img
                  src={selectedLocation.image}
                  alt={selectedLocation.city}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-[#C8321F] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-6 text-white">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#E9B44C]">
                    Bistrot Chérie Residence
                  </span>
                  <h3 className="text-3xl md:text-5xl font-serif-display font-bold">
                    {selectedLocation.city} — {selectedLocation.neighborhood}
                  </h3>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#C8321F] shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-sm uppercase tracking-wider text-[#1A1A1A]/70">
                        Address
                      </h4>
                      <p className="text-base text-[#1A1A1A] mt-1">{selectedLocation.address}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-[#1F3D2B] shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-sm uppercase tracking-wider text-[#1A1A1A]/70">
                        Opening Hours
                      </h4>
                      <p className="text-base text-[#1A1A1A] mt-1">{selectedLocation.hours}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[#E9B44C] shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-sm uppercase tracking-wider text-[#1A1A1A]/70">
                        Telephone Direct
                      </h4>
                      <p className="text-base text-[#1A1A1A] mt-1">{selectedLocation.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[#C8321F] shrink-0 mt-1" />
                    <div>
                      <h4 className="font-semibold text-sm uppercase tracking-wider text-[#1A1A1A]/70">
                        Vibe & Atmosphere
                      </h4>
                      <p className="text-base text-[#1A1A1A] mt-1">
                        Heated outdoor terrace, candlelit marble bar, live vinyl set from 9 PM.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-[#1A1A1A]/10 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  {getStatusBadge(selectedLocation.status, selectedLocation.statusText)}

                  <button
                    onClick={() => {
                      const city = selectedLocation.city;
                      setSelectedLocation(null);
                      if (onReserveLocation) onReserveLocation(city);
                    }}
                    className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#C8321F] text-white font-medium text-xs uppercase tracking-widest hover:bg-[#1F3D2B] transition-colors shadow-lg"
                  >
                    Reserve Table at {selectedLocation.city}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
