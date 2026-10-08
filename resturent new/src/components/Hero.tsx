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

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Compute aspect-fit dimensions
    const imgAspect = imgToDraw.width / imgToDraw.height;
    const canvasAspect = canvasWidth / canvasHeight;

    let drawWidth = canvasWidth;
    let drawHeight = canvasHeight;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasAspect > imgAspect) {
      // Canvas is wider than image: fit height, center horizontally
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imgAspect;
      offsetX = (canvasWidth - drawWidth) / 2;
    } else {
      // Canvas is taller than image (e.g. mobile/tablet): fit width, center vertically
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgAspect;
      offsetY = (canvasHeight - drawHeight) / 2;
    }

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
      className="relative w-full h-[360vh] bg-[#090806] text-[#F6EFE3]"
    >
      {/* Pinned Sticky Stage: Remains completely locked at top:0 until progress = 100% */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between select-none">
        {/* Background Atmospheric Light Halos */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#E9B44C]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[450px] h-[450px] bg-[#C8321F]/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-[#1F3D2B]/20 rounded-full blur-[150px] pointer-events-none" />

        {/* Ambient Vignette Overlay */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-[#090806]/40 to-[#090806]/90 pointer-events-none z-1" />

        {/* =================================================================== */}
        {/* CENTER STAGE: Canvas for 240-Frame Burger Animation                 */}
        {/* =================================================================== */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
          />
        </div>

        {/* =================================================================== */}
        {/* TOP HUD: Live Scrubbing Status & Preloader Indicator                */}
        {/* =================================================================== */}
        <div className="relative z-20 pt-28 px-6 md:px-12 flex items-center justify-between max-w-7xl mx-auto w-full">
          {/* Left: Bistro Tagline Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#1C1814]/80 backdrop-blur-md border border-white/10 text-xs uppercase tracking-widest text-[#E9B44C] shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#C8321F] animate-pulse" />
            <span className="font-medium text-[11px] md:text-xs">
              Signature Smash • Wagyu & Brioche
            </span>
          </div>

          {/* Right: Live Interactive Scrub Status */}
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#1C1814]/80 backdrop-blur-md border border-white/10 text-[11px] uppercase tracking-wider text-white/70 shadow-lg">
            <Flame className="w-3.5 h-3.5 text-[#C8321F]" />
            <span className="font-mono text-white">
              FRAME {String(currentFrameIndex + 1).padStart(3, '0')} / {TOTAL_FRAMES}
            </span>
            {loadedCount < TOTAL_FRAMES && (
              <span className="text-[10px] text-white/40 hidden sm:inline">
                ({Math.round((loadedCount / TOTAL_FRAMES) * 100)}% buffered)
              </span>
            )}
            <span className="text-white/30">•</span>
            <span className="font-mono text-[#E9B44C] font-semibold">
              {Math.round(scrollProgress * 100)}%
            </span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* MIDDLE LAYER: Dynamic Storytelling & Typography Transitions        */}
        {/* =================================================================== */}
        <div className="relative z-20 my-auto px-6 md:px-12 max-w-7xl mx-auto w-full pointer-events-none">
          {/* Intro Hero Text (Visible during 0% - 20% scroll) */}
          <AnimatePresence>
            {showIntro && (
              <motion.div
                key="intro-headline"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30, scale: 0.96 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="text-center max-w-4xl mx-auto pointer-events-auto"
              >
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif-display font-bold leading-[0.95] tracking-tight text-[#F6EFE3] drop-shadow-md">
                  Life is a <span className="font-serif-italic text-[#C8321F]">party</span>, <br />
                  and the table is a <span className="font-serif-italic text-[#E9B44C]">feast</span>.
                </h1>

                <p className="mt-4 md:mt-6 max-w-xl mx-auto text-sm sm:text-base md:text-lg text-[#F6EFE3]/80 font-normal leading-relaxed">
                  Handmade brioche, 45-day dry-aged Wagyu blend, fontina fondue & natural wine.
                  <br className="hidden sm:inline" />
                  <span className="text-[#E9B44C] font-medium"> Scroll down to deconstruct our masterpiece.</span>
                </p>

                {/* CTA Action Buttons */}
                <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
                  <button
                    onClick={onOpenReservation}
                    className="px-7 py-3.5 rounded-full bg-[#C8321F] hover:bg-[#a72718] text-white font-medium text-xs sm:text-sm uppercase tracking-wider shadow-xl transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-[#E9B44C]" />
                    <span>Book Your Table</span>
                  </button>

                  <button
                    onClick={scrollToMenu}
                    className="px-7 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-[#F6EFE3] font-medium text-xs sm:text-sm uppercase tracking-wider backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Utensils className="w-4 h-4 text-[#E9B44C]" />
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
                className="pointer-events-auto max-w-xs md:max-w-sm p-5 md:p-6 rounded-2xl bg-[#14120E]/85 backdrop-blur-xl border border-white/15 shadow-2xl"
              >
                <div className="flex items-center gap-2 text-[#E9B44C] text-[11px] font-mono uppercase tracking-widest font-semibold mb-1.5">
                  <span>01 • THE ARTISANAL BUN</span>
                </div>
                <h3 className="text-xl md:text-2xl font-serif text-[#F6EFE3] mb-2 font-bold">
                  Golden Brioche
                </h3>
                <p className="text-xs md:text-sm text-[#F6EFE3]/75 leading-relaxed">
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
                className="pointer-events-auto max-w-xs md:max-w-sm ml-auto p-5 md:p-6 rounded-2xl bg-[#14120E]/85 backdrop-blur-xl border border-[#C8321F]/30 shadow-2xl"
              >
                <div className="flex items-center gap-2 text-[#C8321F] text-[11px] font-mono uppercase tracking-widest font-semibold mb-1.5">
                  <span>02 • THE PATTY</span>
                </div>
                <h3 className="text-xl md:text-2xl font-serif text-[#F6EFE3] mb-2 font-bold">
                  Wagyu & Black Angus
                </h3>
                <p className="text-xs md:text-sm text-[#F6EFE3]/75 leading-relaxed">
                  Double smashed 200g custom grind, seared on screaming-hot cast iron to lock in smoke and juices.
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
                className="pointer-events-auto max-w-xs md:max-w-sm p-5 md:p-6 rounded-2xl bg-[#14120E]/85 backdrop-blur-xl border border-white/15 shadow-2xl"
              >
                <div className="flex items-center gap-2 text-[#E9B44C] text-[11px] font-mono uppercase tracking-widest font-semibold mb-1.5">
                  <span>03 • THE GLORY</span>
                </div>
                <h3 className="text-xl md:text-2xl font-serif text-[#F6EFE3] mb-2 font-bold">
                  Fontina & Truffle Aioli
                </h3>
                <p className="text-xs md:text-sm text-[#F6EFE3]/75 leading-relaxed">
                  Molten Alpine Fontina d'Aosta cheese, caramelized shallots, and rich black summer truffle emulsion.
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
                className="text-center max-w-2xl mx-auto pointer-events-auto"
              >
                <div className="inline-flex items-center gap-2 text-[#E9B44C] text-xs font-mono uppercase tracking-widest mb-3 bg-[#E9B44C]/10 px-4 py-1.5 rounded-full border border-[#E9B44C]/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Masterpiece Assembled</span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-serif-display font-bold text-[#F6EFE3] mb-3">
                  Ready to Feast?
                </h2>
                <p className="text-xs sm:text-sm text-[#F6EFE3]/80 max-w-md mx-auto mb-5 leading-relaxed">
                  Scroll forward to explore our full culinary menu, drinks list, and bistro locations.
                </p>
                <button
                  onClick={scrollToMenu}
                  className="px-6 py-3 rounded-full bg-[#E9B44C] hover:bg-[#d6a23a] text-[#14120E] font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <span>Continue to Menu</span>
                  <ChevronDown className="w-4 h-4 animate-bounce" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* =================================================================== */}
        {/* BOTTOM HUD: Visual Scrub Track & Scroll Indicator                   */}
        {/* =================================================================== */}
        <div className="relative z-20 pb-8 px-6 md:px-12 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Scroll Indicator Prompt */}
            <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-white/60">
              <div className="w-6 h-9 rounded-full border-2 border-white/20 flex items-start justify-center p-1.5">
                <div
                  className="w-1.5 h-2.5 bg-[#E9B44C] rounded-full animate-bounce"
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
              <span className="text-[10px] font-mono text-white/50 tracking-wider">
                SCRUB
              </span>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#C8321F] via-[#E9B44C] to-[#E9B44C] rounded-full transition-all duration-75"
                  style={{ width: `${Math.max(4, Math.round(scrollProgress * 100))}%` }}
                />
              </div>
              <span className="text-[11px] font-mono font-bold text-[#E9B44C]">
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
