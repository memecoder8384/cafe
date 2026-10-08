import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Utensils, Flame, CheckCircle2, ChevronDown } from 'lucide-react';

const TOTAL_FRAMES = 240;

const getFrameUrl = (index: number) => {
  const frameNum = String(index + 1).padStart(3, '0');
  return `/burger/ezgif-frame-${frameNum}.jpg`;
};

interface HeroProps {
  onOpenReservation?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenReservation }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cached HTMLImageElement array
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const imagesLoadedRef = useRef<boolean[]>(new Array(TOTAL_FRAMES).fill(false));

  const [loadedCount, setLoadedCount] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);

  // Animation interpolation state
  const targetFrameRef = useRef<number>(0);
  const currentRenderedFrameRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);

  // ---------------------------------------------------------------------------
  // Canvas Draw Function
  // ---------------------------------------------------------------------------
  const renderFrame = useCallback((frameIdx: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Search for the requested frame or the closest loaded neighbor
    let imgToDraw: HTMLImageElement | null = null;
    const clampedIdx = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(frameIdx)));

    if (imagesLoadedRef.current[clampedIdx] && imagesRef.current[clampedIdx]) {
      imgToDraw = imagesRef.current[clampedIdx];
    } else {
      // Find nearest loaded frame
      for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
        const left = clampedIdx - offset;
        if (left >= 0 && imagesLoadedRef.current[left] && imagesRef.current[left]) {
          imgToDraw = imagesRef.current[left];
          break;
        }
        const right = clampedIdx + offset;
        if (right < TOTAL_FRAMES && imagesLoadedRef.current[right] && imagesRef.current[right]) {
          imgToDraw = imagesRef.current[right];
          break;
        }
      }
    }

    if (!imgToDraw || !imgToDraw.complete || imgToDraw.naturalWidth === 0) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Fill background with deep solid black so zero boundary exists between canvas and frame
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Compute dimensions to fit 1280x720 inside canvasWidth x canvasHeight with a 2% inner margin
    const imgAspect = imgToDraw.width / imgToDraw.height;

    let drawWidth = canvasWidth * 0.98;
    let drawHeight = drawWidth / imgAspect;

    if (drawHeight > canvasHeight * 0.98) {
      drawHeight = canvasHeight * 0.98;
      drawWidth = drawHeight * imgAspect;
    }

    const offsetX = (canvasWidth - drawWidth) / 2;
    const offsetY = (canvasHeight - drawHeight) / 2;

    ctx.drawImage(imgToDraw, offsetX, offsetY, drawWidth, drawHeight);
  }, []);

  // ---------------------------------------------------------------------------
  // Canvas Resize Handler (HiDPI)
  // ---------------------------------------------------------------------------
  const updateCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    renderFrame(currentRenderedFrameRef.current);
  }, [renderFrame]);

  // ---------------------------------------------------------------------------
  // Progressive Image Preloading
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let isCancelled = false;

    // 1. Immediately load frame 0 to paint hero without any delay
    const firstImg = new Image();
    firstImg.src = getFrameUrl(0);
    firstImg.onload = () => {
      if (isCancelled) return;
      imagesRef.current[0] = firstImg;
      imagesLoadedRef.current[0] = true;
      setLoadedCount(1);
      updateCanvasSize();
    };

    // 2. Stream in the remaining 239 frames progressively
    const loadRemainingFrames = () => {
      let count = 1;
      for (let i = 1; i < TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = getFrameUrl(i);
        img.onload = () => {
          if (isCancelled) return;
          imagesRef.current[i] = img;
          imagesLoadedRef.current[i] = true;
          count++;
          setLoadedCount(count);
          // If the newly loaded frame is close to what we're displaying, refresh
          if (Math.abs(currentRenderedFrameRef.current - i) <= 1) {
            renderFrame(currentRenderedFrameRef.current);
          }
        };
      }
    };

    // Delay slightly to give initial paint maximum priority
    const timer = setTimeout(loadRemainingFrames, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [updateCanvasSize, renderFrame]);

  // ---------------------------------------------------------------------------
  // Handle Window Resize
  // ---------------------------------------------------------------------------
  useEffect(() => {
    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize]);

  // ---------------------------------------------------------------------------
  // Scroll Listener & Pinning Calculation
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const totalScrollableDistance = container.offsetHeight - windowHeight;

      if (totalScrollableDistance <= 0) return;

      // When rect.top is 0, we are at the top of the hero
      // When rect.top is -totalScrollableDistance, pinning is complete
      const scrolled = -rect.top;
      const rawProgress = scrolled / totalScrollableDistance;
      const progress = Math.min(1, Math.max(0, rawProgress));

      setScrollProgress(progress);

      const target = Math.min(TOTAL_FRAMES - 1, Math.max(0, progress * (TOTAL_FRAMES - 1)));
      targetFrameRef.current = target;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ---------------------------------------------------------------------------
  // RequestAnimationFrame Smooth Scrubbing Loop (Lerp Interpolation)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const tick = () => {
      const diff = targetFrameRef.current - currentRenderedFrameRef.current;

      // Smooth dampening factor
      if (Math.abs(diff) > 0.04) {
        currentRenderedFrameRef.current += diff * 0.22;
        setCurrentFrameIndex(Math.round(currentRenderedFrameRef.current));
        renderFrame(currentRenderedFrameRef.current);
      }

      animationFrameIdRef.current = requestAnimationFrame(tick);
    };

    animationFrameIdRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [renderFrame]);

  // ---------------------------------------------------------------------------
  // Dynamic Storytelling Badges based on Scroll Progress
  // ---------------------------------------------------------------------------
  const showIntro = scrollProgress < 0.18;
  const showLayer1 = scrollProgress >= 0.18 && scrollProgress < 0.42;
  const showLayer2 = scrollProgress >= 0.42 && scrollProgress < 0.68;
  const showLayer3 = scrollProgress >= 0.68 && scrollProgress < 0.88;
  const showOutro = scrollProgress >= 0.88;

  const scrollToMenu = () => {
    const el = document.querySelector('#marquee-section') || document.querySelector('#menu-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    /* Outer scroll runway: 360vh ensures 2.6 viewports of locked scrub before moving */
    <div
      ref={containerRef}
      className="relative w-full h-[360vh] bg-[#F8F5EE] text-[#1A1A1A]"
    >
      {/* Pinned Sticky Stage: Remains completely locked at top:0 until progress = 100% */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between select-none">
        {/* Background Atmospheric Light Halos */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#E9B44C]/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/4 left-1/5 w-[500px] h-[500px] bg-[#C8321F]/8 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-[#1F3D2B]/8 rounded-full blur-[130px] pointer-events-none" />

        {/* Large Editorial Typographic Watermark in Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-0">
          <span className="font-serif-display font-black text-[13vw] leading-none text-[#1A1A1A]/[0.035] tracking-tight block">
            BISTROT CHÉRIE
          </span>
        </div>

        {/* Subtle Side Editorial Coordinates / Watermarks */}
        <div className="hidden xl:flex absolute left-8 top-1/2 -translate-y-1/2 flex-col items-center gap-4 pointer-events-none select-none z-10 text-[10px] font-mono tracking-[0.3em] uppercase text-[#1A1A1A]/35 [writing-mode:vertical-rl] rotate-180">
          <span>LE MARAIS • PARIS VIII</span>
          <span className="w-8 h-px bg-[#1A1A1A]/20" />
          <span>EST. 2019</span>
        </div>

        <div className="hidden xl:flex absolute right-8 top-1/2 -translate-y-1/2 flex-col items-center gap-4 pointer-events-none select-none z-10 text-[10px] font-mono tracking-[0.3em] uppercase text-[#1A1A1A]/35 [writing-mode:vertical-rl]">
          <span>SMASH ARTISANAL • WAGYU</span>
          <span className="w-8 h-px bg-[#1A1A1A]/20" />
          <span>240 FRAMES DECONSTRUCT</span>
        </div>

        {/* Concentric Decorative Rings Centered Behind Platter */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
          <div className="w-[580px] h-[580px] sm:w-[680px] sm:h-[680px] md:w-[760px] md:h-[760px] rounded-full border border-[#D4AF37]/25 animate-[spin_160s_linear_infinite]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[740px] h-[740px] sm:w-[860px] sm:h-[860px] md:w-[940px] md:h-[940px] rounded-full border border-dashed border-[#1A1A1A]/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[920px] h-[920px] sm:w-[1060px] sm:h-[1060px] md:w-[1180px] md:h-[1180px] rounded-full border border-[#1A1A1A]/5" />
        </div>

        {/* Floating Parisian Culinary Stamps / Badges on Off-White Canvas */}
        <div className="hidden md:flex absolute top-[27%] left-[6%] lg:left-[10%] items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#1A1A1A]/10 shadow-[0_10px_30px_rgba(0,0,0,0.06)] pointer-events-none z-10 max-w-[210px]">
          <div className="w-8 h-8 rounded-full bg-[#C8321F]/10 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-[#C8321F]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#1A1A1A] tracking-wide uppercase">45-Day Dry Aged</p>
            <p className="text-[10px] text-[#4A453E]">Wagyu blend • Cast iron</p>
          </div>
        </div>

        <div className="hidden md:flex absolute top-[27%] right-[6%] lg:right-[10%] items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#1A1A1A]/10 shadow-[0_10px_30px_rgba(0,0,0,0.06)] pointer-events-none z-10 max-w-[210px]">
          <div className="w-8 h-8 rounded-full bg-[#E9B44C]/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#A8761A]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#1A1A1A] tracking-wide uppercase">Normandy Brioche</p>
            <p className="text-[10px] text-[#4A453E]">Sweet butter • 5:00 AM</p>
          </div>
        </div>

        <div className="hidden lg:flex absolute bottom-[22%] left-[8%] items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#1A1A1A]/10 shadow-[0_10px_30px_rgba(0,0,0,0.06)] pointer-events-none z-10 max-w-[210px]">
          <div className="w-8 h-8 rounded-full bg-[#1F3D2B]/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-serif font-bold text-[#1F3D2B]">🍷</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#1A1A1A] tracking-wide uppercase">Cellar Reserve</p>
            <p className="text-[10px] text-[#4A453E]">Natural wines & vinyl</p>
          </div>
        </div>

        <div className="hidden lg:flex absolute bottom-[22%] right-[8%] items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#1A1A1A]/10 shadow-[0_10px_30px_rgba(0,0,0,0.06)] pointer-events-none z-10 max-w-[210px]">
          <div className="w-8 h-8 rounded-full bg-[#E9B44C]/15 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 text-[#A8761A]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#1A1A1A] tracking-wide uppercase">Fait Maison</p>
            <p className="text-[10px] text-[#4A453E]">Fontina & Truffle aioli</p>
          </div>
        </div>

        {/* =================================================================== */}
        {/* TOP HUD: Live Scrubbing Status & Preloader Indicator                */}
        {/* =================================================================== */}
        <div className="relative z-30 pt-24 md:pt-26 px-6 md:px-12 flex items-center justify-between max-w-7xl mx-auto w-full">
          {/* Left: Bistro Tagline Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#1A1A1A]/10 text-xs uppercase tracking-widest text-[#1A1A1A] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#C8321F] animate-pulse" />
            <span className="font-semibold text-[11px] md:text-xs">
              Signature Smash • Wagyu & Brioche
            </span>
          </div>

          {/* Right: Live Interactive Scrub Status */}
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#1A1A1A]/10 text-[11px] uppercase tracking-wider text-[#1A1A1A] shadow-sm">
            <Flame className="w-3.5 h-3.5 text-[#C8321F]" />
            <span className="font-mono text-[#1A1A1A] font-semibold">
              FRAME {String(currentFrameIndex + 1).padStart(3, '0')} / {TOTAL_FRAMES}
            </span>
            {loadedCount < TOTAL_FRAMES && (
              <span className="text-[10px] text-[#1A1A1A]/50 hidden sm:inline">
                ({Math.round((loadedCount / TOTAL_FRAMES) * 100)}% buffered)
              </span>
            )}
            <span className="text-[#1A1A1A]/20">•</span>
            <span className="font-mono text-[#A8761A] font-bold">
              {Math.round(scrollProgress * 100)}%
            </span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* CENTER STAGE: Smaller Showcase Platter & Dynamic Content           */}
        {/* =================================================================== */}
        <div className="relative z-20 flex-1 flex items-center justify-center px-4 w-full max-w-7xl mx-auto">
          {/* Centered Platter (Refined Smaller Size) */}
          <div className="relative w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[420px] md:h-[420px] lg:w-[480px] lg:h-[480px] rounded-full overflow-hidden bg-black border-[3px] border-[#E9B44C]/60 shadow-[0_30px_70px_-15px_rgba(26,20,15,0.3),0_10px_25px_-5px_rgba(26,20,15,0.18)] flex items-center justify-center shrink-0">
            {/* Inner Gold Hairline Rim */}
            <div className="absolute inset-2 rounded-full border border-[#E9B44C]/25 pointer-events-none z-20" />
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>

          {/* Dynamic Storytelling / Intro / Outro Layered Around Platter */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6 md:px-12">
            {/* Intro Hero Text (Visible during 0% - 18% scroll) */}
            <AnimatePresence>
              {showIntro && (
                <motion.div
                  key="intro-headline"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -25, scale: 0.96 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center max-w-3xl mx-auto pointer-events-auto bg-[#F8F5EE]/90 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-[#1A1A1A]/10 shadow-[0_20px_50px_rgba(0,0,0,0.07)]"
                >
                  <div className="inline-block bg-white/90 px-4 py-1.5 rounded-full border border-[#1A1A1A]/10 text-xs uppercase tracking-widest font-mono text-[#C8321F] mb-3 shadow-xs font-semibold">
                    ★ Bienvenue au Bistrot Chérie ★
                  </div>

                  <h1 className="text-3xl sm:text-5xl md:text-6xl font-serif-display font-bold leading-[1.0] tracking-tight text-[#1A1A1A]">
                    Life is a <span className="font-serif-italic text-[#C8321F]">party</span>, <br />
                    and the table is a <span className="font-serif-italic text-[#A8761A]">feast</span>.
                  </h1>

                  <p className="mt-3 text-xs sm:text-sm md:text-base text-[#4A453E] max-w-lg mx-auto leading-relaxed">
                    Handmade brioche, 45-day dry-aged Wagyu blend, fontina fondue & natural wine.
                    <span className="text-[#C8321F] font-semibold block sm:inline sm:ml-1">
                      Scroll down to deconstruct our masterpiece.
                    </span>
                  </p>

                  {/* CTA Action Buttons */}
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={onOpenReservation}
                      className="px-6 py-3 rounded-full bg-[#C8321F] hover:bg-[#A32516] text-white font-medium text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#C8321F]/20 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-[#E9B44C]" />
                      <span>Book Your Table</span>
                    </button>

                    <button
                      onClick={scrollToMenu}
                      className="px-6 py-3 rounded-full bg-white/90 hover:bg-[#1A1A1A] hover:text-white border border-[#1A1A1A]/15 text-[#1A1A1A] font-medium text-xs sm:text-sm uppercase tracking-wider backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Utensils className="w-4 h-4 text-[#C8321F]" />
                      <span>Explore Menu</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Deconstructed Story Cards: Layer 1 (Brioche & Butter) */}
            <AnimatePresence>
              {showLayer1 && (
                <motion.div
                  key="layer-1"
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4 }}
                  className="pointer-events-auto max-w-xs md:max-w-sm mr-auto p-5 md:p-6 rounded-2xl bg-white/95 backdrop-blur-xl border border-[#1A1A1A]/10 shadow-[0_20px_45px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-center gap-2 text-[#A8761A] text-[11px] font-mono uppercase tracking-widest font-bold mb-1.5">
                    <span>01 • THE ARTISANAL BUN</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-serif text-[#1A1A1A] mb-2 font-bold">
                    Golden Brioche
                  </h3>
                  <p className="text-xs md:text-sm text-[#4A453E] leading-relaxed">
                    Baked fresh every morning at 5:00 AM using Normandy sweet butter and finished with toasted golden sesame seeds.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Deconstructed Story Cards: Layer 2 (The Wagyu Patty) */}
            <AnimatePresence>
              {showLayer2 && (
                <motion.div
                  key="layer-2"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.4 }}
                  className="pointer-events-auto max-w-xs md:max-w-sm ml-auto p-5 md:p-6 rounded-2xl bg-white/95 backdrop-blur-xl border border-[#C8321F]/20 shadow-[0_20px_45px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-center gap-2 text-[#C8321F] text-[11px] font-mono uppercase tracking-widest font-bold mb-1.5">
                    <span>02 • THE PATTY</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-serif text-[#1A1A1A] mb-2 font-bold">
                    Wagyu & Black Angus
                  </h3>
                  <p className="text-xs md:text-sm text-[#4A453E] leading-relaxed">
                    Double smashed 200g custom grind, seared on screaming-hot cast iron to lock in smoke, crust, and juices.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Deconstructed Story Cards: Layer 3 (Cheese & Truffle Sauce) */}
            <AnimatePresence>
              {showLayer3 && (
                <motion.div
                  key="layer-3"
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4 }}
                  className="pointer-events-auto max-w-xs md:max-w-sm mr-auto p-5 md:p-6 rounded-2xl bg-white/95 backdrop-blur-xl border border-[#1A1A1A]/10 shadow-[0_20px_45px_rgba(0,0,0,0.08)]"
                >
                  <div className="flex items-center gap-2 text-[#A8761A] text-[11px] font-mono uppercase tracking-widest font-bold mb-1.5">
                    <span>03 • THE GLORY</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-serif text-[#1A1A1A] mb-2 font-bold">
                    Fontina & Truffle Aioli
                  </h3>
                  <p className="text-xs md:text-sm text-[#4A453E] leading-relaxed">
                    Molten Alpine Fontina d'Aosta cheese, caramelized Roscoff shallots, and rich black summer truffle emulsion.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Outro Text (Visible as burger fully assembles at 90% - 100%) */}
            <AnimatePresence>
              {showOutro && (
                <motion.div
                  key="outro-headline"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5 }}
                  className="text-center max-w-md mx-auto pointer-events-auto bg-white/95 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-[#1A1A1A]/10 shadow-[0_20px_50px_rgba(0,0,0,0.09)]"
                >
                  <div className="inline-flex items-center gap-2 text-[#A8761A] text-xs font-mono uppercase tracking-widest mb-2.5 bg-[#E9B44C]/15 px-3.5 py-1.5 rounded-full border border-[#E9B44C]/30 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Masterpiece Assembled</span>
                  </div>
                  <h2 className="text-2xl sm:text-4xl font-serif-display font-bold text-[#1A1A1A] mb-2">
                    Ready to Feast?
                  </h2>
                  <p className="text-xs sm:text-sm text-[#4A453E] max-w-sm mx-auto mb-4 leading-relaxed">
                    Scroll forward to explore our full culinary menu, natural cellar list, and table reservations.
                  </p>
                  <button
                    onClick={scrollToMenu}
                    className="px-6 py-2.5 rounded-full bg-[#C8321F] hover:bg-[#A32516] text-white font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-[#C8321F]/20"
                  >
                    <span>Continue to Menu</span>
                    <ChevronDown className="w-4 h-4 animate-bounce" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* =================================================================== */}
        {/* BOTTOM HUD: Visual Scrub Track & Scroll Indicator                   */}
        {/* =================================================================== */}
        <div className="relative z-30 pb-7 px-6 md:px-12 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Scroll Indicator Prompt */}
            <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-[#1A1A1A]/70 font-medium">
              <div className="w-5 h-8 rounded-full border-2 border-[#1A1A1A]/30 flex items-start justify-center p-1">
                <div
                  className="w-1.5 h-2 bg-[#C8321F] rounded-full animate-bounce"
                  style={{ animationDuration: '1.4s' }}
                />
              </div>
              <span>
                {scrollProgress < 0.95
                  ? 'Scroll to scrub burger animation'
                  : 'Animation complete • Keep scrolling'}
              </span>
            </div>

            {/* Interactive Progress Track */}
            <div className="w-full sm:w-80 flex items-center gap-3">
              <span className="text-[10px] font-mono text-[#1A1A1A]/60 font-semibold tracking-wider">
                SCRUB
              </span>
              <div className="flex-1 h-2 bg-[#1A1A1A]/10 rounded-full overflow-hidden p-0.5 border border-[#1A1A1A]/10">
                <div
                  className="h-full bg-gradient-to-r from-[#C8321F] via-[#E9B44C] to-[#E9B44C] rounded-full transition-all duration-75"
                  style={{ width: `${Math.max(4, Math.round(scrollProgress * 100))}%` }}
                />
              </div>
              <span className="text-[11px] font-mono font-bold text-[#A8761A]">
                {Math.round(scrollProgress * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
