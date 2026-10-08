import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import {
  LayoutDashboard,
  CalendarDays,
  UtensilsCrossed,
  LogOut,
  ExternalLink,
  Coffee,
  User,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string>('Staff Member');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.email) {
        setUserEmail(data.user.email);
      }
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#110F0C] text-[#F6EFE3] flex flex-col font-sans selection:bg-[#C8321F] selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#16130F]/90 backdrop-blur-md border-b border-[#2D2822]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#C8321F] rounded-lg flex items-center justify-center text-white shadow-md shadow-[#C8321F]/20">
              <Coffee size={20} />
            </div>
            <div>
              <span className="font-serif font-bold tracking-wider text-base text-[#F6EFE3] block leading-none">
                CAFÉ HOST
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#A89E90] block mt-0.5">
                Admin Console
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#1C1814] p-1 rounded-xl border border-[#2D2822]">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-medium transition-all ${
                  isActive
                    ? 'bg-[#C8321F] text-white shadow-sm'
                    : 'text-[#A89E90] hover:text-[#F6EFE3] hover:bg-[#26211B]'
                }`
              }
            >
              <LayoutDashboard size={15} />
              Overview
            </NavLink>

            <NavLink
              to="/admin/bookings"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-medium transition-all ${
                  isActive
                    ? 'bg-[#C8321F] text-white shadow-sm'
                    : 'text-[#A89E90] hover:text-[#F6EFE3] hover:bg-[#26211B]'
                }`
              }
            >
              <CalendarDays size={15} />
              Bookings
            </NavLink>

            <NavLink
              to="/admin/tables"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-xs uppercase tracking-wider font-medium transition-all ${
                  isActive
                    ? 'bg-[#C8321F] text-white shadow-sm'
                    : 'text-[#A89E90] hover:text-[#F6EFE3] hover:bg-[#26211B]'
                }`
              }
            >
              <UtensilsCrossed size={15} />
              Tables
            </NavLink>
          </nav>

          {/* User & Actions */}
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 text-xs text-[#A89E90] hover:text-[#F6EFE3] px-3 py-1.5 rounded-lg border border-[#2D2822] hover:bg-[#1C1814] transition-colors"
              title="Open customer website in new tab"
            >
              <ExternalLink size={14} />
              <span className="hidden lg:inline">View Café</span>
            </a>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#1C1814] rounded-lg border border-[#2D2822] text-xs text-[#A89E90]">
              <User size={13} className="text-[#C8321F]" />
              <span className="max-w-[140px] truncate text-[#D9D1C7]">{userEmail}</span>
            </div>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#A89E90] hover:text-red-400 hover:bg-red-950/20 rounded-lg border border-[#2D2822] transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around border-t border-[#2D2822] bg-[#16130F] px-4 py-2">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] font-medium ${
                isActive ? 'text-[#C8321F]' : 'text-[#A89E90]'
              }`
            }
          >
            <LayoutDashboard size={16} />
            Overview
          </NavLink>
          <NavLink
            to="/admin/bookings"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] font-medium ${
                isActive ? 'text-[#C8321F]' : 'text-[#A89E90]'
              }`
            }
          >
            <CalendarDays size={16} />
            Bookings
          </NavLink>
          <NavLink
            to="/admin/tables"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[11px] font-medium ${
                isActive ? 'text-[#C8321F]' : 'text-[#A89E90]'
              }`
            }
          >
            <UtensilsCrossed size={16} />
            Tables
          </NavLink>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2D2822] bg-[#16130F] py-4 text-center text-xs text-[#5C5348] tracking-widest uppercase">
        Café Management System &bull; Live Supabase Synchronization
      </footer>
    </div>
  );
};
