import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUp, Music2, Mail, Heart, CheckCircle2, Share2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#1A1A1A] text-[#F6EFE3] pt-20 pb-12 px-6 md:px-12 border-t border-white/10 relative overflow-hidden select-none">
      {/* Big Marquee Brand Strip */}
      <div className="overflow-hidden border-b border-white/10 pb-12 mb-16">
        <div className="animate-marquee flex whitespace-nowrap text-5xl sm:text-7xl md:text-9xl font-serif-display font-extrabold text-white/10 uppercase tracking-tighter">
          <span className="mr-8">Bistrot Chérie <span className="italic text-[#C8321F]/40">•</span> Italian Soul <span className="italic text-[#E9B44C]/40">•</span> French Elegance <span className="italic text-[#1F3D2B]/40">•</span></span>
          <span className="mr-8">Bistrot Chérie <span className="italic text-[#C8321F]/40">•</span> Italian Soul <span className="italic text-[#E9B44C]/40">•</span> French Elegance <span className="italic text-[#1F3D2B]/40">•</span></span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
        {/* Col 1: Brand Info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-[#C8321F] text-white flex items-center justify-center font-serif-italic font-bold text-xl">
              C
            </span>
            <span className="text-2xl font-serif-display font-bold text-white">
              Bistrot <span className="font-serif-italic text-[#E9B44C]">Chérie</span>
            </span>
          </div>

          <p className="text-sm text-white/70 leading-relaxed max-w-sm">
            An energetic fusion of Parisian bistro elegance and Italian trattoria warmth. Open daily for lunch, aperitivo, and late-night vinyl sessions.
          </p>

          <div className="pt-2 flex items-center gap-4 text-white/80">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#C8321F] hover:text-white flex items-center justify-center transition-colors border border-white/10"
              data-cursor="Instagram"
            >
              <Share2 className="w-5 h-5" />
            </a>
            <a
              href="https://spotify.com"
              target="_blank"
              rel="noreferrer"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#1F3D2B] hover:text-white flex items-center justify-center transition-colors border border-white/10"
              data-cursor="Vinyl Playlist"
            >
              <Music2 className="w-5 h-5" />
            </a>
            <a
              href="mailto:ciao@bistrotcherie.com"
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#E9B44C] hover:text-[#1A1A1A] flex items-center justify-center transition-colors border border-white/10"
              data-cursor="Email Us"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Col 2: Navigation Links */}
        <div>
          <h4 className="text-xs uppercase font-semibold tracking-widest text-[#E9B44C] mb-4">
            Navigation
          </h4>
          <ul className="space-y-2.5 text-sm font-medium">
            <li><a href="#about" className="hover:text-[#C8321F] transition-colors">Our Story & Chef</a></li>
            <li><a href="#menu-section" className="hover:text-[#C8321F] transition-colors">La Carte & Wine List</a></li>
            <li><a href="#locations" className="hover:text-[#C8321F] transition-colors">Paris • Milano • NY</a></li>
            <li><a href="#gallery" className="hover:text-[#C8321F] transition-colors">Visual Gallery</a></li>
            <li><a href="#contact" className="hover:text-[#C8321F] transition-colors">Private Dining & Events</a></li>
          </ul>
        </div>

        {/* Col 3: Experiences */}
        <div>
          <h4 className="text-xs uppercase font-semibold tracking-widest text-[#E9B44C] mb-4">
            Happenings
          </h4>
          <ul className="space-y-2.5 text-sm font-medium">
            <li><a href="#" className="hover:text-[#E9B44C] transition-colors">Vinyl DJ Nights</a></li>
            <li><a href="#" className="hover:text-[#E9B44C] transition-colors">Natural Wine Tastings</a></li>
            <li><a href="#" className="hover:text-[#E9B44C] transition-colors">Sunday Truffle Brunch</a></li>
            <li><a href="#" className="hover:text-[#E9B44C] transition-colors">Late Night Aperitivo</a></li>
            <li><a href="#" className="hover:text-[#E9B44C] transition-colors">Gift Cards & Merch</a></li>
          </ul>
        </div>

        {/* Col 4: Newsletter Signup */}
        <div>
          <h4 className="text-xs uppercase font-semibold tracking-widest text-[#E9B44C] mb-4">
            Gazette Chérie
          </h4>
          <p className="text-xs text-white/70 mb-4">
            Subscribe for secret wine drops, seasonal menu launches & vinyl playlists.
          </p>

          <form onSubmit={handleSubscribe} className="space-y-2">
            <div className="relative">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white/10 text-white placeholder-white/40 text-xs border border-white/10 focus:outline-none focus:border-[#E9B44C]"
              />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-xl bg-[#C8321F] text-white text-xs font-semibold uppercase hover:bg-[#E9B44C] hover:text-[#1A1A1A] transition-colors"
              >
                Join
              </button>
            </div>
            {subscribed && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium mt-2"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Welcome to the Chérie Circle!
              </motion.p>
            )}
          </form>
        </div>
      </div>

      {/* Bottom Legal & Back to Top */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/50">
        <div className="flex items-center gap-2">
          <span>© {new Date().getFullYear()} Bistrot Chérie. All rights reserved.</span>
          <span>•</span>
          <span className="flex items-center gap-1">Made with <Heart className="w-3 h-3 text-[#C8321F] fill-[#C8321F]" /> in Europe</span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Terms of Service</a>
          <Link to="/admin/login" className="hover:underline text-white/50 hover:text-white transition-colors" data-cursor="Admin">Staff Portal</Link>
          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 text-white hover:text-[#E9B44C] transition-colors font-semibold uppercase tracking-wider text-[11px]"
            data-cursor="Top"
          >
            <span>Back to Top</span>
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
              <ArrowUp className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </div>
    </footer>
  );
};
