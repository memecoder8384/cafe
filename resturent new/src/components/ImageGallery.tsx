import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GALLERY_IMAGES } from '../data/restaurantData';
import type { GalleryItem } from '../data/restaurantData';
import { X, Maximize2, Sparkles, Heart } from 'lucide-react';

export const ImageGallery: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [likedImages, setLikedImages] = useState<Record<string, boolean>>({});

  const categories = ['All', 'Antipasti', 'Pasta Fresca', 'Principale', 'Cocktails', 'Dolci', 'Atmosphere'];

  const filteredImages = activeCategory === 'All'
    ? GALLERY_IMAGES
    : GALLERY_IMAGES.filter(img => img.category === activeCategory);

  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedImages(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <section id="gallery" className="py-24 px-6 md:px-12 bg-[#F6EFE3] relative overflow-hidden select-none">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[#1A1A1A]/10 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1F3D2B]/10 text-[#1F3D2B] text-xs font-semibold uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#C8321F]" />
            <span>Visual Feast • 12 Highlights</span>
          </div>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-serif-display font-bold text-[#1A1A1A] leading-[1.0] tracking-tight">
            Moments in <span className="font-serif-italic text-[#C8321F]">Motion</span>
          </h2>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 max-w-xl">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-medium uppercase tracking-wider transition-all border ${
                activeCategory === cat
                  ? 'bg-[#1F3D2B] text-[#F6EFE3] border-[#1F3D2B] shadow-md'
                  : 'bg-white/60 text-[#1A1A1A]/80 border-[#1A1A1A]/10 hover:bg-[#C8321F] hover:text-white hover:border-[#C8321F]'
              }`}
              data-cursor="Filter"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Staggered Masonry Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {filteredImages.map((item, index) => {
          const aspectClass =
            item.aspectRatio === 'portrait'
              ? 'h-[420px] md:h-[520px]'
              : item.aspectRatio === 'landscape'
              ? 'h-[280px] md:h-[340px]'
              : 'h-[350px] md:h-[400px]';

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.7, delay: (index % 3) * 0.15, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setSelectedImage(item)}
              className={`group relative rounded-2xl md:rounded-3xl overflow-hidden cursor-pointer bg-[#ECE3D2] border-2 border-white shadow-lg ${aspectClass}`}
              data-cursor="View"
              data-cursor-variant="image"
            >
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 p-6 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase tracking-widest font-semibold px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-md">
                    {item.category}
                  </span>

                  <button
                    onClick={(e) => toggleLike(item.id, e)}
                    className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#C8321F] transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${likedImages[item.id] ? 'fill-[#C8321F] text-[#C8321F]' : ''}`} />
                  </button>
                </div>

                <div>
                  <h3 className="text-xl md:text-2xl font-serif-display font-bold text-white mb-2 leading-tight">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[#E9B44C] font-medium uppercase tracking-wider">
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Click to enlarge</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-12 cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl w-full max-h-[90vh] bg-[#1A1A1A] rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col md:flex-row"
            >
              {/* Image Left */}
              <div className="md:w-2/3 h-[50vh] md:h-auto bg-black relative">
                <img
                  src={selectedImage.image}
                  alt={selectedImage.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Sidebar Info Right */}
              <div className="md:w-1/3 p-8 flex flex-col justify-between text-[#F6EFE3]">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full bg-[#C8321F] text-white">
                      {selectedImage.category}
                    </span>
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#C8321F] text-white flex items-center justify-center transition-colors"
                      data-cursor="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <h3 className="text-3xl font-serif-display font-bold text-white mb-4 leading-tight">
                    {selectedImage.title}
                  </h3>

                  <p className="text-sm text-white/70 leading-relaxed mb-6">
                    Captured live at Bistrot Chérie. Prepared fresh using organic regional ingredients and traditional wood-fired technique.
                  </p>
                </div>

                <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-white/60">
                  <span>Photo ID: #{selectedImage.id}</span>
                  <span className="text-[#E9B44C] font-semibold">Bistrot Chérie Archive</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
