import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  fetchAdminStats,
  updateBookingStatus,
} from './adminApi';
import {
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      setUpdatingId(bookingId);
      await updateBookingStatus(bookingId, newStatus);
      await loadStats();
    } catch (err: any) {
      alert(`Could not update status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'confirmed':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80';
      case 'pending':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/80';
      case 'cancelled':
        return 'bg-red-950/60 text-red-400 border-red-800/80';
      case 'completed':
        return 'bg-blue-950/60 text-blue-400 border-blue-800/80';
      case 'no_show':
        return 'bg-stone-900 text-stone-400 border-stone-800';
      default:
        return 'bg-stone-900 text-stone-300 border-stone-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#F6EFE3]">
            Café Host Overview
          </h1>
          <p className="text-xs text-[#A89E90] mt-1 tracking-wide">
            Real-time reservations, dining floor occupancy, and guest status.
          </p>
        </div>

        <button
          onClick={loadStats}
          disabled={loading}
          className="flex items-center gap-2 self-start sm:self-auto px-4 py-2 bg-[#1C1814] hover:bg-[#26211B] text-xs font-medium text-[#F6EFE3] rounded-xl border border-[#2D2822] transition-colors cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Live Data
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={loadStats}
            className="underline hover:text-white cursor-pointer ml-4 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Today's Bookings */}
        <div className="bg-[#1C1814] border border-[#2D2822] rounded-2xl p-5 relative overflow-hidden">
          <div className="text-[#C8321F] mb-3">
            <Calendar size={22} />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-[#F6EFE3] font-bold">
            {stats?.today_bookings_count ?? '—'}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-[#A89E90] mt-1">
            Today's Bookings
          </div>
        </div>

        {/* Today's Guests */}
        <div className="bg-[#1C1814] border border-[#2D2822] rounded-2xl p-5 relative overflow-hidden">
          <div className="text-amber-500 mb-3">
            <Users size={22} />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-[#F6EFE3] font-bold">
            {stats?.today_guests_count ?? '—'}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-[#A89E90] mt-1">
            Today's Guests
          </div>
        </div>

        {/* Pending Bookings */}
        <div className="bg-[#1C1814] border border-[#2D2822] rounded-2xl p-5 relative overflow-hidden">
          <div className="text-yellow-400 mb-3">
            <Clock size={22} />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-[#F6EFE3] font-bold">
            {stats?.pending_bookings_count ?? '—'}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-[#A89E90] mt-1">
            Pending Approval
          </div>
        </div>

        {/* Available Tables */}
        <div className="bg-[#1C1814] border border-[#2D2822] rounded-2xl p-5 relative overflow-hidden">
          <div className="text-emerald-400 mb-3">
            <CheckCircle2 size={22} />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-[#F6EFE3] font-bold">
            {stats?.available_tables_count ?? '—'}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-[#A89E90] mt-1">
            Available Tables
          </div>
        </div>

        {/* Occupied Tables */}
        <div className="bg-[#1C1814] border border-[#2D2822] rounded-2xl p-5 relative overflow-hidden">
          <div className="text-indigo-400 mb-3">
            <UtensilsCrossed size={22} />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-[#F6EFE3] font-bold">
            {stats?.occupied_tables_count ?? '—'}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-[#A89E90] mt-1">
            Occupied Tables
          </div>
        </div>

        {/* Upcoming Total */}
        <div className="bg-[#1C1814] border border-[#2D2822] rounded-2xl p-5 relative overflow-hidden">
          <div className="text-[#C8321F] mb-3">
            <Sparkles size={22} />
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-[#F6EFE3] font-bold">
            {stats?.upcoming_bookings_count ?? '—'}
          </div>
          <div className="text-[11px] uppercase tracking-wider text-[#A89E90] mt-1">
            Upcoming Bookings
          </div>
        </div>
      </div>

      {/* Upcoming Bookings Section */}
      <div className="bg-[#1C1814] border border-[#2D2822] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 sm:p-6 border-b border-[#2D2822] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-serif text-[#F6EFE3]">Upcoming Bookings</h2>
            <p className="text-xs text-[#A89E90] mt-0.5">
              Next scheduled reservations across all tables
            </p>
          </div>
          <Link
            to="/admin/bookings"
            className="flex items-center gap-1.5 text-xs text-[#C8321F] hover:text-[#e04531] font-medium transition-colors"
          >
            Manage All Bookings
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#14120E] text-[#A89E90] uppercase tracking-wider border-b border-[#2D2822]">
              <tr>
                <th className="py-3.5 px-6 font-medium">Time & Date</th>
                <th className="py-3.5 px-6 font-medium">Customer</th>
                <th className="py-3.5 px-6 font-medium">Guests</th>
                <th className="py-3.5 px-6 font-medium">Assigned Table</th>
                <th className="py-3.5 px-6 font-medium">Status</th>
                <th className="py-3.5 px-6 font-medium">Source</th>
                <th className="py-3.5 px-6 font-medium text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D2822] text-[#D9D1C7]">
              {loading && !stats ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#A89E90]">
                    Loading upcoming reservations...
                  </td>
                </tr>
              ) : !stats?.recent_bookings || stats.recent_bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#A89E90]">
                    No upcoming reservations found. Bookings created via chatbot or form will appear here.
                  </td>
                </tr>
              ) : (
                stats.recent_bookings.map((booking: any) => (
                  <tr key={booking.id} className="hover:bg-[#231E19] transition-colors">
                    <td className="py-4 px-6 font-medium text-[#F6EFE3]">
                      <div className="font-semibold text-sm">{booking.booking_time}</div>
                      <div className="text-[11px] text-[#A89E90]">{booking.booking_date}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-[#F6EFE3]">{booking.customer_name}</div>
                      <div className="text-[11px] text-[#A89E90]">{booking.phone}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Users size={12} className="text-[#A89E90]" />
                        {booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-[#14120E] border border-[#2D2822] rounded-lg font-mono font-bold text-[#F6EFE3]">
                        {booking.table?.table_number || 'Auto-Assigned'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold border ${getStatusBadge(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="capitalize text-[#A89E90] text-[11px]">
                        {booking.source || 'chatbot'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {booking.status === 'pending' ? (
                        <button
                          onClick={() => handleStatusChange(booking.id, 'confirmed')}
                          disabled={updatingId === booking.id}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {updatingId === booking.id ? '...' : 'Confirm'}
                        </button>
                      ) : (
                        <Link
                          to="/admin/bookings"
                          className="text-[#A89E90] hover:text-[#F6EFE3] underline"
                        >
                          View Details
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
