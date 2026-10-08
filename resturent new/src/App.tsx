import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import { CustomCursor } from './components/CustomCursor';
import SplashCursor from './components/SplashCursor';
import { PageLoader } from './components/PageLoader';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Marquee } from './components/Marquee';
import { AboutSection } from './components/AboutSection';
import { FoodSection } from './components/FoodSection';
import { ImageGallery } from './components/ImageGallery';
import { Locations } from './components/Locations';
import { ReservationCTA } from './components/ReservationCTA';
import { Footer } from './components/Footer';
import { CafeChatbot } from './components/CafeChatbot';

export const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('Paris');

  // Initialize Lenis Smooth Scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  const scrollToReservation = (city?: string) => {
    if (city) setSelectedCity(city);
    const element = document.querySelector('#contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectMenuCategory = (cat: string) => {
    setSelectedCategory(cat);
    const element = document.querySelector('#menu-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#F6EFE3] text-[#1A1A1A] font-sans antialiased selection:bg-[#C8321F] selection:text-white">
      {/* Subtle Grain Texture Overlay */}
      <div className="grain-overlay" />

      {/* Custom Spring Cursor */}
      <CustomCursor />

      {/* React Bits Fluid Splash Cursor Effect */}
      <SplashCursor />

      {/* Page Intro Loader */}
      {isLoading && <PageLoader onComplete={() => setIsLoading(false)} />}

      {/* Main Page Layout */}
      {!isLoading && (
        <>
          {/* Section 1: Header + Fullscreen Overlay Menu */}
          <Header
            onOpenReservationModal={() => scrollToReservation()}
            onSelectCategory={handleSelectMenuCategory}
          />

          <main>
            {/* Section 2: Hero Collage */}
            <Hero
              onOpenReservation={() => scrollToReservation()}
            />

            {/* Section 3: Infinite Marquee */}
            <Marquee />

            {/* Editorial Story Section */}
            <AboutSection />

            {/* Section 6: Food Section (Split-Text "delizioso", 4 scaling dishes, menu tabs) */}
            <FoodSection
              initialCategory={selectedCategory}
              onOpenReservation={() => scrollToReservation()}
            />

            {/* Section 4: Image Gallery Masonry Grid */}
            <ImageGallery />

            {/* Section 5: Locations ("Our restaurants welcome you", 04 counter, hover preview) */}
            <Locations
              onReserveLocation={(city) => scrollToReservation(city)}
            />

            {/* Section 7: Reservation CTA ("Prego!", magnetic button, cursor stamp trail) */}
            <ReservationCTA
              initialCity={selectedCity}
            />
          </main>

          {/* Section 8: Footer */}
          <Footer />

          {/* Floating Café Assistant Chatbot */}
          <CafeChatbot />
        </>
      )}
    </div>
  );
};

export default App;
