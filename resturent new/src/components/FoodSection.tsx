import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FEATURED_DISHES, MENU_CATEGORIES, FULL_MENU_ITEMS } from '../data/restaurantData';
import { Sparkles, Utensils, Heart } from 'lucide-react';

interface FoodSectionProps {
  initialCategory?: string;
  onOpenReservation?: () => void;
}

export const FoodSection: React.FC<FoodSectionProps> = ({ initialCategory = 'all', onOpenReservation }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [favoriteDishes, setFavoriteDishes] = useState<Record<string, boolean>>({});

  const displayWord = "delizioso";

  const filteredDishes = selectedCategory === 'all'
    ? FULL_MENU_ITEMS
    : FULL_MENU_ITEMS.filter(d => d.category === selectedCategory);

  const toggleFavorite = (id: string) => {
    setFavoriteDishes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="menu-section" className="py-24 px-6 md:px-12 bg-[#1F3D2B] text-[#F6EFE3] relative overflow-hidden select-none">
      {/* Background Decorative Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#E9B44C]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#C8321F]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Split Text Heading Section */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-[#E9B44C] text-xs font-semibold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fatta a Mano Every Morning</span>
          </div>

          {/* Animated Split-Text Word: "delizioso" */}
          <div className="overflow-hidden py-2">
            <h2 className="text-6xl sm:text-8xl md:text-9xl font-serif-italic text-[#E9B44C] tracking-tight leading-none flex justify-center items-center flex-wrap">
              {displayWord.split('').map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ y: 100, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.05,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="inline-block"
                >
                  {char}
                </motion.span>
              ))}
            </h2>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-6 text-base sm:text-xl text-[#F6EFE3]/80 font-light leading-relaxed max-w-2xl mx-auto"
          >
            We combine rustic Italian soul with French culinary precision. Organic flour milled in Puglia, cultured Normandy butter, and seasonal wild mushrooms.
          </motion.p>
        </div>

        {/* 4 Interactive Dynamic Showcase Cards */}
        <div className="mb-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED_DISHES.slice(0, 4).map((dish, index) => {
            const rotations = [-2, 3, -3, 2];
            const translateYs = [0, 20, -10, 15];

            return (
              <motion.div
                key={dish.id}
                initial={{ opacity: 0, scale: 0.8, y: 40 }}
                whileInView={{ opacity: 1, scale: 1, y: translateYs[index] }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.05, rotate: 0, zIndex: 20 }}
                style={{ transform: `rotate(${rotations[index]}deg)` }}
                className="bg-[#1A1A1A] rounded-3xl p-5 border border-white/10 shadow-2xl transition-all duration-300 group cursor-pointer"
                data-cursor="Dish Info"
                data-cursor-variant="hover"
              >
                <div className="relative h-60 rounded-2xl overflow-hidden mb-4 bg-black">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-[#C8321F] text-white font-serif-italic font-bold text-sm shadow-md">
                    {dish.price}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-semibold text-[#E9B44C] tracking-widest">
                      {dish.category}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(dish.id);
                      }}
                      className="text-white/60 hover:text-[#C8321F] transition-colors"
                    >
                      <Heart className={`w-4 h-4 ${favoriteDishes[dish.id] ? 'fill-[#C8321F] text-[#C8321F]' : ''}`} />
                    </button>
                  </div>

                  <h3 className="font-serif-display text-xl font-bold text-white group-hover:text-[#E9B44C] transition-colors">
                    {dish.name}
                  </h3>
                  <p className="text-xs text-white/70 line-clamp-2">
                    {dish.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Tabbed Menu Explorer */}
        <div className="bg-[#1A1A1A] rounded-3xl p-6 md:p-12 border border-white/10 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold text-[#E9B44C]">
                Explore Our Complete Menu
              </span>
              <h3 className="text-3xl md:text-5xl font-serif-display font-bold text-white mt-1">
                La Carte <span className="font-serif-italic text-[#C8321F]">du Jour</span>
              </h3>
            </div>

            {/* Menu Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {MENU_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border ${
                    selectedCategory === cat.id
                      ? 'bg-[#C8321F] text-white border-[#C8321F] shadow-lg scale-105'
                      : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Dish Grid List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {filteredDishes.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover shrink-0 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-serif-display text-lg md:text-xl text-white font-bold group-hover:text-[#E9B44C] transition-colors">
                        {item.name}
                      </h4>
                      {item.frenchName && (
                        <p className="text-xs text-[#E9B44C] italic">{item.frenchName}</p>
                      )}
                    </div>
                    <span className="font-serif-italic text-xl text-[#E9B44C] font-bold shrink-0 ml-3">
                      {item.price}
                    </span>
                  </div>

                  <p className="text-xs text-white/70 mt-2 leading-relaxed">
                    {item.description}
                  </p>

                  {item.dietary && (
                    <div className="flex gap-1.5 mt-3">
                      {item.dietary.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded-full bg-white/10 text-white/80"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom Table Booking Shortcut */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-sm text-white/80">
              <Utensils className="w-5 h-5 text-[#E9B44C]" />
              <span>Have dietary preferences? Our chefs cater to gluten-free, vegan & allergy requests.</span>
            </div>

            <button
              onClick={onOpenReservation}
              className="px-8 py-3.5 rounded-full bg-[#E9B44C] text-[#1A1A1A] font-semibold text-xs uppercase tracking-widest hover:bg-white hover:scale-105 transition-all shadow-xl"
            >
              Reserve a Table to Taste
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
