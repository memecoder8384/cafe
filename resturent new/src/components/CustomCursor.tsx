import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const CustomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [cursorText, setCursorText] = useState('');
  const [cursorVariant, setCursorVariant] = useState<'default' | 'hover' | 'image' | 'button'>('default');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Disable on touch devices
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    document.body.classList.add('custom-cursor-active');

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);

      // Check hovered element for data-cursor attributes
      const target = e.target as HTMLElement | null;
      if (target) {
        const cursorTarget = target.closest('[data-cursor]');
        if (cursorTarget) {
          const text = cursorTarget.getAttribute('data-cursor') || '';
          const variant = cursorTarget.getAttribute('data-cursor-variant') as any || 'hover';
          setCursorText(text);
          setCursorVariant(variant);
          setIsHovered(true);
        } else if (target.closest('a, button, input, select, textarea, [role="button"]')) {
          setCursorText('');
          setCursorVariant('button');
          setIsHovered(true);
        } else {
          setCursorText('');
          setCursorVariant('default');
          setIsHovered(false);
        }
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.body.classList.remove('custom-cursor-active');
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const variants = {
    default: {
      width: 16,
      height: 16,
      backgroundColor: '#C8321F',
      border: '0px solid transparent',
    },
    button: {
      width: 48,
      height: 48,
      backgroundColor: 'rgba(200, 50, 31, 0.25)',
      border: '1.5px solid #C8321F',
    },
    image: {
      width: 80,
      height: 80,
      backgroundColor: '#C8321F',
      border: '0px solid transparent',
    },
    hover: {
      width: 70,
      height: 70,
      backgroundColor: '#1F3D2B',
      border: '0px solid transparent',
    }
  };

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full flex items-center justify-center text-white font-medium text-xs tracking-wider uppercase text-center shadow-lg backdrop-blur-[1px]"
      animate={{
        x: position.x - (variants[cursorVariant]?.width || 16) / 2,
        y: position.y - (variants[cursorVariant]?.height || 16) / 2,
        width: variants[cursorVariant]?.width || 16,
        height: variants[cursorVariant]?.height || 16,
        backgroundColor: variants[cursorVariant]?.backgroundColor,
        border: variants[cursorVariant]?.border,
        scale: isHovered ? 1.1 : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 28,
        mass: 0.2,
      }}
    >
      {cursorText && (
        <motion.span
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-1 truncate font-semibold"
        >
          {cursorText}
        </motion.span>
      )}
    </motion.div>
  );
};
