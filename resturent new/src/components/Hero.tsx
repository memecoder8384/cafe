import React, { useEffect, useRef, useCallback } from 'react';
import { Sparkles, Flame } from 'lucide-react';

const TOTAL_FRAMES = 240;

const getFrameUrl = (index: number) => {
  const frameNum = String(index + 1).padStart(3, '0');
  return `/burger/ezgif-frame-${frameNum}.jpg`;
};

interface HeroProps {
  onOpenReservation?: () => void;
}

export const Hero: React.FC<HeroProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cached HTMLImageElement array
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const imagesLoadedRef = useRef<boolean[]>(new Array(TOTAL_FRAMES).fill(false));

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
      updateCanvasSize();
    };

    // 2. Stream in the remaining 239 frames progressively
    const loadRemainingFrames = () => {
      for (let i = 1; i < TOTAL_FRAMES; i++) {
        const img = new Image();
        img.src = getFrameUrl(i);
        img.onload = () => {
          if (isCancelled) return;
          imagesRef.current[i] = img;
          imagesLoadedRef.current[i] = true;
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

      const scrolled = -rect.top;
      const rawProgress = scrolled / totalScrollableDistance;
      const progress = Math.min(1, Math.max(0, rawProgress));

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

  return (
    /* Outer scroll runway: 360vh ensures 2.6 viewports of locked scrub before moving */
    <div
      ref={containerRef}
      className="relative w-full h-[360vh] bg-[#F8F5EE] text-[#1A1A1A]"
    >
      {/* Pinned Sticky Stage: Remains completely locked at top:0 until progress = 100% */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between items-center select-none pt-24 pb-8">
        {/* ================================================================= */}
        {/* ANIMATED BACKGROUND LAYER 1: Pulsing Ambient Warm Halos          */}
        {/* ================================================================= */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#E9B44C]/15 rounded-full blur-[140px] pointer-events-none animate-pulse-glow" />
        <div
          className="absolute top-1/4 left-1/5 w-[500px] h-[500px] bg-[#C8321F]/8 rounded-full blur-[140px] pointer-events-none animate-pulse-glow"
          style={{ animationDelay: '3s' }}
        />
        <div
          className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-[#1F3D2B]/8 rounded-full blur-[130px] pointer-events-none animate-pulse-glow"
          style={{ animationDelay: '5s' }}
        />

        {/* ================================================================= */}
        {/* ANIMATED BACKGROUND LAYER 2: Expanding Concentric Pulse Ripples   */}
        {/* ================================================================= */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
          <div className="w-[440px] h-[440px] sm:w-[500px] sm:h-[500px] rounded-full border border-[#E9B44C]/35 animate-[pulse-ring_7s_cubic-bezier(0.215,0.61,0.355,1)_infinite]" />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] sm:w-[640px] sm:h-[640px] rounded-full border border-[#E9B44C]/25 animate-[pulse-ring_7s_cubic-bezier(0.215,0.61,0.355,1)_infinite]"
            style={{ animationDelay: '2.3s' }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] sm:w-[800px] sm:h-[800px] rounded-full border border-[#E9B44C]/15 animate-[pulse-ring_7s_cubic-bezier(0.215,0.61,0.355,1)_infinite]"
            style={{ animationDelay: '4.6s' }}
          />
        </div>

        {/* ================================================================= */}
        {/* ANIMATED BACKGROUND LAYER 3: Counter-Rotating Accent Rings       */}
        {/* ================================================================= */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
          {/* Inner Golden Ring with Cardinal Accent Dots */}
          <div className="relative w-[580px] h-[580px] sm:w-[680px] sm:h-[680px] md:w-[780px] md:h-[780px] rounded-full border border-[#D4AF37]/25 animate-spin-slow">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#E9B44C]/60" />
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 rounded-full bg-[#E9B44C]/60" />
            <span className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#E9B44C]/60" />
            <span className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#E9B44C]/60" />
          </div>

          {/* Middle Dashed Ring Counter-Spinning */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] sm:w-[840px] sm:h-[840px] md:w-[960px] md:h-[960px] rounded-full border border-dashed border-[#1A1A1A]/10 animate-spin-slow-reverse" />

          {/* Outer Perimeter Ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] sm:w-[1040px] sm:h-[1040px] md:w-[1180px] md:h-[1180px] rounded-full border border-[#1A1A1A]/5 animate-spin-slow" />
        </div>

        {/* ================================================================= */}
        {/* ANIMATED BACKGROUND LAYER 4: Floating Culinary Accents & Sparkles */}
        {/* ================================================================= */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-1">
          {/* Golden Sesame Seeds & Fleur de Sel Sparkles */}
          <div
            className="absolute top-[18%] left-[16%] w-3 h-1.5 rounded-full bg-[#E9B44C]/50 rotate-45 animate-float-gentle"
            style={{ animationDuration: '6.5s' }}
          />
          <div
            className="absolute top-[34%] left-[22%] animate-float-reverse"
            style={{ animationDuration: '6s', animationDelay: '1s' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E9B44C]/70" />
          </div>
          <div
            className="absolute top-[70%] left-[18%] w-2.5 h-2.5 rounded-full bg-[#1F3D2B]/30 animate-float-gentle"
            style={{ animationDuration: '8s', animationDelay: '2s' }}
          />
          <div
            className="absolute top-[82%] left-[26%] w-2 h-2 rounded-full bg-[#E9B44C]/50 animate-float-reverse"
            style={{ animationDuration: '6.5s', animationDelay: '0.5s' }}
          />

          <div
            className="absolute top-[16%] right-[20%] animate-float-reverse"
            style={{ animationDuration: '7s', animationDelay: '1.5s' }}
          >
            <Sparkles className="w-4 h-4 text-[#A8761A]/60" />
          </div>
          <div
            className="absolute top-[32%] right-[15%] w-3 h-1.5 rounded-full bg-[#E9B44C]/50 -rotate-30 animate-float-gentle"
            style={{ animationDuration: '7.5s' }}
          />
          <div
            className="absolute top-[68%] right-[19%] w-2 h-2 rounded-full bg-[#C8321F]/35 animate-float-gentle"
            style={{ animationDuration: '6s', animationDelay: '2.5s' }}
          />
          <div
            className="absolute top-[80%] right-[24%] animate-float-reverse"
            style={{ animationDuration: '8.5s', animationDelay: '1.2s' }}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E9B44C]/65" />
          </div>

          <div
            className="absolute top-[48%] left-[7%] w-2.5 h-1.5 rounded-full bg-[#E9B44C]/40 rotate-12 animate-float-reverse"
            style={{ animationDuration: '7s', animationDelay: '3s' }}
          />
          <div
            className="absolute top-[52%] right-[7%] w-2.5 h-1.5 rounded-full bg-[#E9B44C]/40 -rotate-12 animate-float-gentle"
            style={{ animationDuration: '8s', animationDelay: '2s' }}
          />
        </div>

        {/* ================================================================= */}
        {/* ANIMATED BACKGROUND LAYER 5: Floating Parisian Culinary Badges   */}
        {/* ================================================================= */}
        <div className="hidden md:flex absolute top-[25%] left-[5%] lg:left-[9%] items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#1A1A1A]/10 shadow-[0_10px_30px_rgba(0,0,0,0.06)] pointer-events-none z-10 max-w-[210px] animate-float-gentle">
          <div className="w-8 h-8 rounded-full bg-[#C8321F]/10 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-[#C8321F]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#1A1A1A] tracking-wide uppercase">45-Day Dry Aged</p>
            <p className="text-[10px] text-[#4A453E]">Wagyu blend • Cast iron</p>
          </div>
        </div>

        <div
          className="hidden md:flex absolute top-[25%] right-[5%] lg:right-[9%] items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#1A1A1A]/10 shadow-[0_10px_30px_rgba(0,0,0,0.06)] pointer-events-none z-10 max-w-[210px] animate-float-reverse"
          style={{ animationDelay: '1s' }}
        >
          <div className="w-8 h-8 rounded-full bg-[#E9B44C]/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#A8761A]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#1A1A1A] tracking-wide uppercase">Normandy Brioche</p>
            <p className="text-[10px] text-[#4A453E]">Sweet butter • 5:00 AM</p>
          </div>
        </div>

        <div
          className="hidden lg:flex absolute bottom-[20%] left-[7%] items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#1A1A1A]/10 shadow-[0_10px_30px_rgba(0,0,0,0.06)] pointer-events-none z-10 max-w-[210px] animate-float-reverse"
          style={{ animationDelay: '0.5s' }}
        >
          <div className="w-8 h-8 rounded-full bg-[#1F3D2B]/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-serif font-bold text-[#1F3D2B]">🍷</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#1A1A1A] tracking-wide uppercase">Cellar Reserve</p>
            <p className="text-[10px] text-[#4A453E]">Natural wines & vinyl</p>
          </div>
        </div>

        <div
          className="hidden lg:flex absolute bottom-[20%] right-[7%] items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#1A1A1A]/10 shadow-[0_10px_30px_rgba(0,0,0,0.06)] pointer-events-none z-10 max-w-[210px] animate-float-gentle"
          style={{ animationDelay: '1.5s' }}
        >
          <div className="w-8 h-8 rounded-full bg-[#E9B44C]/15 flex items-center justify-center shrink-0">
            <span className="text-xs font-serif font-bold text-[#A8761A]">★</span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#1A1A1A] tracking-wide uppercase">Fait Maison</p>
            <p className="text-[10px] text-[#4A453E]">Fontina & Truffle aioli</p>
          </div>
        </div>

        {/* ================================================================= */}
        {/* EDITORIAL WATERMARK TYPOGRAPHY                                    */}
        {/* ================================================================= */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none select-none z-0">
          <span className="font-serif-display font-black text-[13vw] leading-none text-[#1A1A1A]/[0.035] tracking-tight block">
            BISTROT CHÉRIE
          </span>
        </div>

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

        {/* Empty space at top for fixed header spacing */}
        <div className="h-4" />

        {/* ================================================================= */}
        {/* CENTER STAGE: Unobstructed Smaller Platter Showcase              */}
        {/* ================================================================= */}
        <div className="relative z-20 flex-1 flex items-center justify-center px-4 w-full max-w-7xl mx-auto my-auto">
          <div className="relative w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] md:w-[420px] md:h-[420px] lg:w-[480px] lg:h-[480px] rounded-full overflow-hidden bg-black border-[3px] border-[#E9B44C]/60 shadow-[0_30px_70px_-15px_rgba(26,20,15,0.3),0_10px_25px_-5px_rgba(26,20,15,0.18)] flex items-center justify-center shrink-0">
            {/* Inner Gold Hairline Rim */}
            <div className="absolute inset-2 rounded-full border border-[#E9B44C]/25 pointer-events-none z-20" />
            <canvas
              ref={canvasRef}
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>
        </div>

        {/* ================================================================= */}
        {/* MINIMALIST BOTTOM SCROLL PROMPT (Clean, Discreet, No Progress Bar) */}
        {/* ================================================================= */}
        <div className="relative z-30 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-[#1A1A1A]/10 text-[11px] uppercase tracking-widest text-[#1A1A1A]/60 shadow-xs">
            <div className="w-4 h-6 rounded-full border border-[#1A1A1A]/30 flex items-start justify-center p-0.5">
              <div
                className="w-1 h-1.5 bg-[#C8321F] rounded-full animate-bounce"
                style={{ animationDuration: '1.4s' }}
              />
            </div>
            <span className="font-medium text-[10px] sm:text-[11px]">Scroll to deconstruct</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
