import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Utensils, Wine } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const stats = [
    { number: '100%', label: 'Organic Local Produce' },
    { number: '5 AM', label: 'Daily Fresh Pasta Rolling' },
    { number: '240+', label: 'Natural European Wines' },
    { number: '4.9★', label: '10,000+ Bistro Guest Reviews' },
  ];

  return (
    <section id="about" className="py-24 px-6 md:px-12 bg-[#F6EFE3] relative overflow-hidden select-none border-b border-[#1A1A1A]/10">
      <div className="max-w-7xl mx-auto">
        {/* Top Editorial Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center mb-20">
          {/* Left: Headline & Story */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C8321F]/10 text-[#C8321F] text-xs font-semibold uppercase tracking-widest"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Our Culinary Manifesto</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl sm:text-6xl md:text-7xl font-serif-display font-bold text-[#1A1A1A] leading-[0.98] tracking-tight"
            >
              Born in <span className="font-serif-italic text-[#C8321F]">Paris</span>, <br />
              raised in <span className="font-serif-italic text-[#1F3D2B]">Milano</span>.
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-base sm:text-lg text-[#1A1A1A]/80 font-normal leading-relaxed"
            >
              Bistrot Chérie was founded in 2019 by childhood friends Marco Rossi (Chef de Cuisine) and Camille Laurent (Head Sommelier). Tired of stuffy fine-dining rules, they set out to create a lively, warm dining room where high-grade culinary craftsmanship meets late-night fun.
            </motion.p>

            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white/60 border border-[#1A1A1A]/10 flex items-start gap-3">
                <Utensils className="w-5 h-5 text-[#C8321F] shrink-0 mt-1" />
                <div>
                  <h4 className="font-serif-display font-bold text-[#1A1A1A] text-lg">
                    Pasta Fatta a Mano
                  </h4>
                  <p className="text-xs text-[#1A1A1A]/70 mt-1">
                    Every morning at 5 AM, our pasta artisans hand-roll fresh egg dough using Puglia semolina.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/60 border border-[#1A1A1A]/10 flex items-start gap-3">
                <Wine className="w-5 h-5 text-[#1F3D2B] shrink-0 mt-1" />
                <div>
                  <h4 className="font-serif-display font-bold text-[#1A1A1A] text-lg">
                    Vins Naturels Only
                  </h4>
                  <p className="text-xs text-[#1A1A1A]/70 mt-1">
                    Direct relationships with biodynamic smallholder vignerons across France and Italy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Dual Editorial Photos */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, rotate: -4, scale: 0.9 }}
              whileInView={{ opacity: 1, rotate: -3, scale: 1 }}
              viewport={{ once: true }}
              className="w-full h-80 sm:h-96 rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-black"
            >
              <img
                src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=900&q=80"
                alt="Chef Marco rolling fresh pasta"
                className="w-full h-full object-cover"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, rotate: 6, scale: 0.9 }}
              whileInView={{ opacity: 1, rotate: 5, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="absolute -bottom-8 -left-6 w-56 h-56 rounded-3xl overflow-hidden shadow-2xl border-4 border-white hidden sm:block bg-black"
            >
              <img
                src="https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80"
                alt="Sommelier pouring natural wine"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-12 border-t border-[#1A1A1A]/10">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="text-center p-6 rounded-2xl bg-white/40 border border-[#1A1A1A]/5"
            >
              <div className="text-4xl md:text-5xl font-serif-display font-extrabold text-[#C8321F] mb-1">
                {stat.number}
              </div>
              <div className="text-xs uppercase font-semibold tracking-wider text-[#1A1A1A]/70">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
