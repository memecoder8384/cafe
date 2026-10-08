import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UtensilsCrossed, ArrowUpRight, MapPin, Clock, Wine, Sparkles } from 'lucide-react';
import { FULL_MENU_ITEMS } from '../data/restaurantData';

interface HeaderProps {
  onOpenReservationModal?: () => void;
  onSelectCategory?: (category: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenReservationModal, onSelectCategory }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeMenuCategory, setActiveMenuCategory] = useState<string>('pasta');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Locations', href: '#locations' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Events', href: '#events' },
    { label: 'Private Events', href: '#contact' },
  ];

  const menuCategories = [
    { id: 'pasta', label: '01. Fresh Pasta', count: '8 Dishes' },
    { id: 'antipasti', label: '02. Antipasti & Starters', count: '6 Dishes' },
    { id: 'principale', label: '03. Grill & Principale', count: '5 Dishes' },
    { id: 'cocktails', label: '04. Natural Wines & Cocktails', count: '12 Drinks' },
    { id: 'dolci', label: '05. Dolci & Desserts', count: '4 Sweets' },
  ];

  const filteredDishes = FULL_MENU_ITEMS.filter(item => item.category === activeMenuCategory);

  const handleMenuCategoryClick = (catId: string) => {
    setActiveMenuCategory(catId);
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
  };

  const scrollToSection = (href: string) => {
    setIsMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Top Fixed Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 md:px-12 py-4 md:py-6 flex items-center justify-between ${
          isScrolled
            ? 'bg-[#F6EFE3]/90 backdrop-blur-md shadow-sm border-b border-[#1A1A1A]/5 py-3 md:py-4'
            : 'bg-transparent'
        }`}
      >
        {/* Logo Left */}
        <a
          href="#"
          className={`group flex items-center gap-3 text-2xl md:text-3xl font-serif-display font-bold tracking-tight transition-colors ${
            isScrolled ? 'text-[#1A1A1A]' : 'text-[#F6EFE3]'
          }`}
          data-cursor="Home"
          data-cursor-variant="button"
        >
          <span className="w-10 h-10 rounded-full bg-[#C8321F] text-white flex items-center justify-center font-serif-italic text-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
            C
          </span>
          <span>
            Bistrot <span className={`font-serif-italic ${isScrolled ? 'text-[#C8321F]' : 'text-[#E9B44C]'}`}>Chérie</span>
          </span>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium tracking-wide uppercase">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(link.href);
              }}
              className={`relative transition-colors py-1 group ${
                isScrolled ? 'text-[#1A1A1A]/80 hover:text-[#C8321F]' : 'text-[#F6EFE3]/80 hover:text-[#E9B44C]'
              }`}
              data-cursor="Explore"
            >
              {link.label}
              <span className={`absolute bottom-0 left-0 w-0 h-[2px] transition-all duration-300 group-hover:w-full ${
                isScrolled ? 'bg-[#C8321F]' : 'bg-[#E9B44C]'
              }`} />
            </a>
          ))}
        </nav>

        {/* Right CTA / Menu Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenReservationModal}
            className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1F3D2B] text-[#F6EFE3] font-medium text-xs tracking-wider uppercase btn-sweep hover:text-white transition-all shadow-md"
            data-cursor="Reserve"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E9B44C]" />
            <span>Reserve Table</span>
          </button>

          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#C8321F] text-white font-medium text-xs tracking-wider uppercase hover:bg-[#1A1A1A] transition-colors shadow-md btn-sweep"
            data-cursor="Open Menu"
            data-cursor-variant="hover"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Menu</span>
          </button>
        </div>
      </header>

      {/* Fullscreen Overlay Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] bg-[#1A1A1A] text-[#F6EFE3] overflow-y-auto overflow-x-hidden flex flex-col"
          >
            {/* Modal Header */}
            <div className="px-6 md:px-12 py-6 flex items-center justify-between border-b border-white/10 bg-[#1A1A1A] sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-[#C8321F] text-white flex items-center justify-center font-serif-italic">
                  C
                </span>
                <span className="text-xl font-serif-display text-[#F6EFE3]">
                  Bistrot <span className="italic text-[#E9B44C]">Chérie</span> — Full Menu
                </span>
              </div>

              <button
                onClick={() => setIsMenuOpen(false)}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-[#C8321F] text-white flex items-center justify-center transition-colors border border-white/10"
                data-cursor="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Main Menu Body */}
            <div className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Staggered Category Links */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#E9B44C] mb-4 font-semibold">
                    Explore Our Culinary Craft
                  </p>
                  <div className="space-y-4">
                    {menuCategories.map((cat, idx) => (
                      <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.08 + 0.1, duration: 0.5 }}
                      >
                        <button
                          onClick={() => handleMenuCategoryClick(cat.id)}
                          onMouseEnter={() => setActiveMenuCategory(cat.id)}
                          className={`group w-full text-left flex items-center justify-between py-3 border-b transition-all ${
                            activeMenuCategory === cat.id
                              ? 'border-[#C8321F] text-[#C8321F] pl-4'
                              : 'border-white/10 text-white/80 hover:text-white hover:pl-2'
                          }`}
                          data-cursor="Select"
                        >
                          <span className="text-2xl md:text-4xl font-serif-display tracking-tight font-medium">
                            {cat.label}
                          </span>
                          <span className="text-xs uppercase font-sans tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/10">
                            {cat.count}
                          </span>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Additional Quick Links */}
                <div className="pt-8 border-t border-white/10 space-y-4">
                  <p className="text-xs uppercase tracking-widest text-white/50">Navigation</p>
                  <div className="flex flex-wrap gap-4 text-sm font-medium">
                    {navLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToSection(link.href);
                        }}
                        className="hover:text-[#E9B44C] transition-colors"
                      >
                        {link.label} →
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Featured Dish Showcase for Selected Category */}
              <div className="lg:col-span-6 bg-white/5 rounded-3xl p-6 md:p-8 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
                    <span className="text-xs font-semibold uppercase tracking-widest text-[#E9B44C]">
                      Category Preview
                    </span>
                    <Wine className="w-5 h-5 text-[#E9B44C]" />
                  </div>

                  <div className="space-y-6 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredDishes.map((dish) => (
                      <motion.div
                        key={dish.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-4 p-4 rounded-2xl bg-black/30 hover:bg-black/50 transition-all border border-white/5 group"
                      >
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between">
                              <h4 className="font-serif-display text-lg md:text-xl text-white font-semibold">
                                {dish.name}
                              </h4>
                              <span className="font-serif-italic text-lg text-[#E9B44C] font-bold">
                                {dish.price}
                              </span>
                            </div>
                            {dish.frenchName && (
                              <p className="text-xs text-[#E9B44C]/80 italic mb-1">
                                {dish.frenchName}
                              </p>
                            )}
                            <p className="text-xs text-white/70 line-clamp-2 mt-1">
                              {dish.description}
                            </p>
                          </div>
                          {dish.dietary && (
                            <div className="flex gap-1.5 mt-2">
                              {dish.dietary.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80"
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
                </div>

                {/* Bottom Modal CTA */}
                <div className="mt-8 pt-6 border-t border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="text-xs text-white/60 space-y-1">
                    <p className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#E9B44C]" /> Kitchen closes 11:30 PM
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-[#E9B44C]" /> Paris • Milano • New York
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onOpenReservationModal) onOpenReservationModal();
                    }}
                    className="w-full md:w-auto px-8 py-3 rounded-full bg-[#C8321F] text-white font-medium text-xs uppercase tracking-widest hover:bg-[#E9B44C] hover:text-[#1A1A1A] transition-colors shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>Book a Table Now</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
