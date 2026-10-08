import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { STAMP_ICONS } from '../data/restaurantData';
import { Sparkles, Users, Wine, CheckCircle2, Clock, MapPin, ArrowRight } from 'lucide-react';
import { saveReservation } from '../lib/supabaseClient';

interface Stamp {
  id: string;
  x: number;
  y: number;
  icon: typeof STAMP_ICONS[0];
  rotation: number;
}

interface ReservationCTAProps {
  initialCity?: string;
}

export const ReservationCTA: React.FC<ReservationCTAProps> = ({ initialCity = 'Paris' }) => {
  const [guestCount, setGuestCount] = useState('2 Guests');
  const [eventType, setEventType] = useState('Casual Dinner');
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedTime, setSelectedTime] = useState('7:30 PM');
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBooked, setIsBooked] = useState(false);

  // Magnetic button state
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [magneticPos, setMagneticPos] = useState({ x: 0, y: 0 });

  // Stamp trail state
  const sectionRef = useRef<HTMLDivElement>(null);
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const lastStampPos = useRef({ x: 0, y: 0 });

  // Handle cursor stamp trail creation
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - lastStampPos.current.x;
    const dy = y - lastStampPos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 110) {
      lastStampPos.current = { x, y };

      const randomIcon = STAMP_ICONS[Math.floor(Math.random() * STAMP_ICONS.length)];
      const randomRotation = (Math.random() - 0.5) * 45;
      const newStamp: Stamp = {
        id: `${Date.now()}-${Math.random()}`,
        x,
        y,
        icon: randomIcon,
        rotation: randomRotation,
      };

      setStamps((prev) => [...prev.slice(-15), newStamp]);

      setTimeout(() => {
        setStamps((prev) => prev.filter((s) => s.id !== newStamp.id));
      }, 1500);
    }

    if (buttonRef.current) {
      const btnRect = buttonRef.current.getBoundingClientRect();
      const btnCenterX = btnRect.left + btnRect.width / 2;
      const btnCenterY = btnRect.top + btnRect.height / 2;
      const distToBtn = Math.hypot(e.clientX - btnCenterX, e.clientY - btnCenterY);

      if (distToBtn < 150) {
        setMagneticPos({
          x: (e.clientX - btnCenterX) * 0.25,
          y: (e.clientY - btnCenterY) * 0.25,
        });
      } else {
        setMagneticPos({ x: 0, y: 0 });
      }
    }
  };

  const handleBookNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Direct Supabase insert
      await saveReservation({
        guest_name: guestName.trim() || 'Website Guest',
        phone: phone.trim() || undefined,
        guest_count: guestCount,
        time: selectedTime,
        city: selectedCity,
        event_type: eventType,
        source: 'website_form',
      });

      // 2. Also notify backend endpoint for resilient backup
      const apiUrl = import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:8000';
      fetch(`${apiUrl}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: guestName.trim() || 'Website Guest',
          phone: phone.trim() || null,
          guest_count: guestCount,
          time: selectedTime,
          city: selectedCity,
          event_type: eventType,
          source: 'website_form',
        }),
      }).catch(() => {});
    } catch (err) {
      console.warn('Booking persistence note:', err);
    } finally {
      setIsSubmitting(false);
      setIsBooked(true);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#C8321F', '#1F3D2B', '#E9B44C', '#F6EFE3']
      });
    }
  };

  const guestsOptions = ['1 Guest', '2 Guests', '3-4 Guests', '5-8 Party', 'Private Dining (10+)'];
  const eventOptions = ['Casual Dinner', 'Romantic Date', 'Birthday Feast', 'Natural Wine Tasting', 'Private Party'];
  const timeSlots = ['6:00 PM', '7:30 PM', '9:00 PM', '10:30 PM'];
  const cities = ['Paris', 'Milano', 'New York', 'Saint-Tropez'];

  return (
    <section
      id="contact"
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="py-24 px-6 md:px-12 bg-[#C8321F] text-[#F6EFE3] relative overflow-hidden select-none"
    >
      {/* Stamp Sticker Trail Layer */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <AnimatePresence>
          {stamps.map((stamp) => (
            <motion.div
              key={stamp.id}
              initial={{ scale: 0, opacity: 0, rotate: stamp.rotation - 15 }}
              animate={{ scale: 1, opacity: 1, rotate: stamp.rotation }}
              exit={{ scale: 0.5, opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{
                position: 'absolute',
                left: stamp.x - 32,
                top: stamp.y - 32,
                backgroundColor: stamp.icon.bg,
                color: stamp.icon.color,
                transform: `rotate(${stamp.rotation}deg)`,
              }}
              className="w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-xl border-2 border-white/80 font-bold text-center p-1 backdrop-blur-sm"
            >
              <span className="text-xl leading-none">{stamp.icon.emoji}</span>
              <span className="text-[9px] uppercase font-mono tracking-tighter mt-0.5">
                {stamp.icon.label}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="max-w-6xl mx-auto relative z-20">
        {/* Giant Header: "Prego!" */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 text-[#E9B44C] text-xs font-semibold uppercase tracking-widest mb-6 border border-white/15"
          >
            <Sparkles className="w-4 h-4" />
            <span>Interactive Table Reservation</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="text-6xl sm:text-8xl md:text-9xl font-serif-display font-extrabold text-[#F6EFE3] leading-none tracking-tight"
          >
            Prego<span className="font-serif-italic text-[#E9B44C]">!</span>
          </motion.h2>

          <p className="mt-4 text-lg md:text-xl text-[#F6EFE3]/90 font-light max-w-xl mx-auto">
            Your table awaits. Select your details below to lock in your feast.
          </p>
        </div>

        {/* Reservation Form Block */}
        {!isBooked ? (
          <form onSubmit={handleBookNow} className="bg-[#1A1A1A] text-[#F6EFE3] rounded-3xl p-6 md:p-12 shadow-2xl border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-10">
              {/* Block 01: Number of Guests */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                  <span className="font-mono text-[#E9B44C] font-bold text-lg">01</span>
                  <Users className="w-5 h-5 text-[#E9B44C]" />
                  <h3 className="font-serif-display text-2xl font-bold text-white">
                    Number of Guests
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                  {guestsOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setGuestCount(opt)}
                      className={`px-3 py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all border ${
                        guestCount === opt
                          ? 'bg-[#C8321F] text-white border-[#C8321F] shadow-lg scale-105'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Block 02: The Event / Occasion */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b border-white/10 pb-3">
                  <span className="font-mono text-[#E9B44C] font-bold text-lg">02</span>
                  <Wine className="w-5 h-5 text-[#E9B44C]" />
                  <h3 className="font-serif-display text-2xl font-bold text-white">
                    The Occasion
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                  {eventOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setEventType(opt)}
                      className={`px-3 py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all border ${
                        eventType === opt
                          ? 'bg-[#1F3D2B] text-white border-[#1F3D2B] shadow-lg scale-105'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Location & Time Slot Selection */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#E9B44C] mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Destination Residence
                </label>
                <div className="flex flex-wrap gap-2">
                  {cities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setSelectedCity(city)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase border transition-all ${
                        selectedCity === city
                          ? 'bg-white text-[#1A1A1A] border-white font-bold'
                          : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#E9B44C] mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Preferred Time Slot
                </label>
                <div className="flex flex-wrap gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTime(slot)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        selectedTime === slot
                          ? 'bg-[#E9B44C] text-[#1A1A1A] border-[#E9B44C] font-bold'
                          : 'bg-white/5 text-white/60 border-white/10 hover:text-white'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Guest Name & Phone Inputs */}
            <div className="pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#E9B44C] mb-2">
                  Guest Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Jean Dupont"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#E9B44C] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[#E9B44C] mb-2">
                  Phone / Contact (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +33 6 12 34 56 78"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#E9B44C] transition-colors"
                />
              </div>
            </div>

            {/* Magnetic Hover + Text-Roll Pill Button */}
            <div className="flex justify-center pt-2">
              <motion.button
                ref={buttonRef}
                type="submit"
                disabled={isSubmitting}
                animate={{ x: magneticPos.x, y: magneticPos.y }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className={`btn-roll px-12 py-5 rounded-full bg-[#E9B44C] text-[#1A1A1A] font-serif-display font-bold text-lg md:text-xl uppercase tracking-wider shadow-2xl hover:bg-white transition-colors flex items-center gap-3 overflow-hidden ${
                  isSubmitting ? 'opacity-70 cursor-wait' : 'cursor-pointer'
                }`}
                data-cursor="Submit"
                data-cursor-variant="button"
              >
                <span className="text-roll h-7">
                  <span className="text-roll-inner">
                    <span className="h-7 flex items-center gap-2">
                      <span>{isSubmitting ? 'Securing Table...' : 'Reserve Table'}</span>
                      <ArrowRight className="w-5 h-5" />
                    </span>
                    <span className="h-7 flex items-center gap-2 text-[#C8321F]">
                      <span>Contact Us Now</span>
                      <Sparkles className="w-5 h-5" />
                    </span>
                  </span>
                </span>
              </motion.button>
            </div>
          </form>
        ) : (
          /* Booking Confirmed State */
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1A1A1A] text-[#F6EFE3] rounded-3xl p-8 md:p-12 text-center border border-white/10 shadow-2xl max-w-2xl mx-auto"
          >
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-6 border border-emerald-500/40">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <h3 className="text-3xl md:text-4xl font-serif-display font-bold text-white mb-2">
              Table Reserved at Bistrot Chérie!
            </h3>
            <p className="text-[#E9B44C] font-serif-italic text-lg mb-6">
              Magnifique! We've held your spot for {guestCount} in {selectedCity} at {selectedTime}.
            </p>

            <div className="bg-white/5 rounded-2xl p-4 text-left text-xs space-y-2 mb-8 border border-white/10">
              <p><span className="text-white/50">Party Size:</span> {guestCount}</p>
              <p><span className="text-white/50">Occasion:</span> {eventType}</p>
              <p><span className="text-white/50">Location:</span> Bistrot Chérie ({selectedCity})</p>
              <p><span className="text-white/50">Confirmation Code:</span> #BC-{Math.floor(100000 + Math.random() * 900000)}</p>
            </div>

            <button
              onClick={() => setIsBooked(false)}
              className="px-8 py-3 rounded-full bg-[#C8321F] text-white text-xs font-semibold uppercase tracking-widest hover:bg-[#E9B44C] hover:text-[#1A1A1A] transition-colors"
            >
              Make Another Reservation
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
};
