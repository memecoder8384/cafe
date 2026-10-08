import React, { useEffect, useState } from 'react';
import {
  fetchAdminBookings,
  fetchTables,
  updateBookingStatus,
  updateBookingDetails,
  cancelBooking,
} from './adminApi';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  Edit2,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  X,
  Phone,
  Mail,
  FileText,
  UtensilsCrossed,
  Check,
} from 'lucide-react';

export const AdminBookings: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Modals
  const [viewingBooking, setViewingBooking] = useState<any | null>(null);
  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [bData, tData] = await Promise.all([
        fetchAdminBookings({
          search: search || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          date: dateFilter || undefined,
          source: sourceFilter !== 'all' ? sourceFilter : undefined,
        }),
        fetchTables().catch(() => []),
      ]);
      setBookings(bData);
      setTables(tData);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, dateFilter, sourceFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleStatusUpdate = async (bookingId: string, status: string) => {
    try {
      setActionLoadingId(bookingId);
      await updateBookingStatus(bookingId, status);
      await loadData();
      if (viewingBooking?.id === bookingId) {
        setViewingBooking((prev: any) => ({ ...prev, status }));
      }
    } catch (err: any) {
      alert(`Could not update status: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      setActionLoadingId(bookingId);
      await cancelBooking(bookingId);
      await loadData();
      if (viewingBooking?.id === bookingId) {
        setViewingBooking((prev: any) => ({ ...prev, status: 'cancelled' }));
      }
    } catch (err: any) {
      alert(`Could not cancel booking: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;
    try {
      setIsSaving(true);
      const updates = {
        customer_name: editingBooking.customer_name,
        phone: editingBooking.phone,
        email: editingBooking.email || null,
        booking_date: editingBooking.booking_date,
        booking_time: editingBooking.booking_time,
        guests: parseInt(editingBooking.guests, 10),
        table_id: editingBooking.table_id || null,
        status: editingBooking.status,
        special_request: editingBooking.special_request || null,
      };
      await updateBookingDetails(editingBooking.id, updates);
      setEditingBooking(null);
      await loadData();
    } catch (err: any) {
      alert(`Error updating booking: ${err.message}`);
    } finally {
      setIsSaving(false);
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
    <div className="space-y-6">
      {/* Title & Stats Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#F6EFE3]">
            Reservations Directory
          </h1>
          <p className="text-xs text-[#A89E90] mt-1">
            Browse, filter, edit, and update all customer reservations in real-time.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 self-start sm:self-auto px-4 py-2 bg-[#1C1814] hover:bg-[#26211B] text-xs font-medium text-[#F6EFE3] rounded-xl border border-[#2D2822] transition-colors cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#1C1814] border border-[#2D2822] rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7C7267]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, phone number, or email..."
              className="w-full bg-[#14120E] border border-[#2D2822] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#F6EFE3] placeholder-[#5C5348] focus:outline-none focus:border-[#C8321F]"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-[#C8321F] hover:bg-[#A82515] text-white rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#2D2822] text-xs">
          <div className="flex items-center gap-2 text-[#A89E90]">
            <Filter size={14} />
            <span>Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#14120E] border border-[#2D2822] rounded-lg px-3 py-1.5 text-xs text-[#D9D1C7] focus:outline-none focus:border-[#C8321F]"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-[#14120E] border border-[#2D2822] rounded-lg px-3 py-1.5 text-xs text-[#D9D1C7] focus:outline-none focus:border-[#C8321F]"
          />

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-[#14120E] border border-[#2D2822] rounded-lg px-3 py-1.5 text-xs text-[#D9D1C7] focus:outline-none focus:border-[#C8321F]"
          >
            <option value="all">All Sources</option>
            <option value="chatbot">Chatbot</option>
            <option value="admin">Admin</option>
            <option value="manual">Manual</option>
            <option value="website_form">Website Form</option>
          </select>

          {(search || statusFilter !== 'all' || dateFilter || sourceFilter !== 'all') && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setDateFilter('');
                setSourceFilter('all');
              }}
              className="text-[#A89E90] hover:text-[#F6EFE3] underline ml-auto text-[11px] cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-[#1C1814] border border-[#2D2822] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#14120E] text-[#A89E90] uppercase tracking-wider border-b border-[#2D2822]">
              <tr>
                <th className="py-3.5 px-6 font-medium">Customer</th>
                <th className="py-3.5 px-6 font-medium">Contact</th>
                <th className="py-3.5 px-6 font-medium">Date & Time</th>
                <th className="py-3.5 px-6 font-medium">Party Size</th>
                <th className="py-3.5 px-6 font-medium">Table</th>
                <th className="py-3.5 px-6 font-medium">Status</th>
                <th className="py-3.5 px-6 font-medium">Source</th>
                <th className="py-3.5 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D2822] text-[#D9D1C7]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#A89E90]">
                    <div className="inline-block w-6 h-6 border-2 border-[#C8321F] border-t-transparent rounded-full animate-spin mb-2" />
                    <div>Loading reservations...</div>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#A89E90]">
                    No reservations match the specified filters.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-[#231E19] transition-colors">
                    {/* Customer */}
                    <td className="py-4 px-6 font-medium text-[#F6EFE3]">
                      <div className="font-semibold text-sm">{booking.customer_name}</div>
                      {booking.special_request && (
                        <div className="text-[10px] text-amber-400 truncate max-w-[180px]" title={booking.special_request}>
                          Note: {booking.special_request}
                        </div>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-6 text-[#A89E90]">
                      <div>{booking.phone}</div>
                      {booking.email && <div className="text-[11px] truncate max-w-[140px]">{booking.email}</div>}
                    </td>

                    {/* Date & Time */}
                    <td className="py-4 px-6">
                      <div className="font-medium text-[#F6EFE3]">{booking.booking_time}</div>
                      <div className="text-[11px] text-[#A89E90]">{booking.booking_date}</div>
                    </td>

                    {/* Guests */}
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Users size={12} className="text-[#A89E90]" />
                        {booking.guests} {booking.guests === 1 ? 'Guest' : 'Guests'}
                      </span>
                    </td>

                    {/* Table */}
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 bg-[#14120E] border border-[#2D2822] rounded-lg font-mono font-bold text-[#F6EFE3]">
                        {booking.table?.table_number || (booking.table_id ? 'Assigned' : 'Auto')}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold border ${getStatusBadge(
                          booking.status
                        )}`}
                      >
                        {booking.status}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="py-4 px-6 capitalize text-[#A89E90]">
                      {booking.source || 'chatbot'}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingBooking(booking)}
                          className="p-1.5 text-[#A89E90] hover:text-[#F6EFE3] hover:bg-[#2D2822] rounded-lg transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={() => setEditingBooking({ ...booking })}
                          className="p-1.5 text-[#A89E90] hover:text-amber-400 hover:bg-[#2D2822] rounded-lg transition-colors cursor-pointer"
                          title="Edit Booking"
                        >
                          <Edit2 size={15} />
                        </button>

                        {booking.status === 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                            disabled={actionLoadingId === booking.id}
                            className="p-1.5 text-emerald-400 hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Confirm Booking"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}

                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'completed')}
                            disabled={actionLoadingId === booking.id}
                            className="p-1.5 text-blue-400 hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Mark as Completed"
                          >
                            <Check size={15} />
                          </button>
                        )}

                        {booking.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={actionLoadingId === booking.id}
                            className="p-1.5 text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Cancel Booking"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW BOOKING DETAILS MODAL */}
      {viewingBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1814] border border-[#2D2822] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setViewingBooking(null)}
              className="absolute top-5 right-5 text-[#A89E90] hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-serif text-[#F6EFE3] mb-1">
              Reservation Details
            </h2>
            <p className="text-xs text-[#A89E90] mb-6 font-mono">
              ID: {viewingBooking.id}
            </p>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#14120E] rounded-xl border border-[#2D2822]">
                <div>
                  <span className="text-[#7C7267] block uppercase tracking-wider text-[10px]">Customer Name</span>
                  <span className="text-sm font-semibold text-[#F6EFE3]">{viewingBooking.customer_name}</span>
                </div>
                <div>
                  <span className="text-[#7C7267] block uppercase tracking-wider text-[10px]">Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border mt-0.5 ${getStatusBadge(viewingBooking.status)}`}>
                    {viewingBooking.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-[#C8321F]" />
                  <span>{viewingBooking.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-[#C8321F]" />
                  <span>{viewingBooking.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-[#C8321F]" />
                  <span>{viewingBooking.booking_date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-[#C8321F]" />
                  <span>{viewingBooking.booking_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-[#C8321F]" />
                  <span>{viewingBooking.guests} Guests</span>
                </div>
                <div className="flex items-center gap-2">
                  <UtensilsCrossed size={14} className="text-[#C8321F]" />
                  <span>Table: {viewingBooking.table?.table_number || 'T01'}</span>
                </div>
              </div>

              {viewingBooking.special_request && (
                <div className="p-3 bg-[#14120E] rounded-xl border border-[#2D2822]">
                  <span className="text-[#7C7267] block uppercase tracking-wider text-[10px] mb-1 flex items-center gap-1">
                    <FileText size={12} /> Special Request
                  </span>
                  <p className="text-amber-200">{viewingBooking.special_request}</p>
                </div>
              )}

              <div className="pt-2 text-[10px] text-[#7C7267] flex justify-between border-t border-[#2D2822]">
                <span>Source: {viewingBooking.source}</span>
                <span>Created: {new Date(viewingBooking.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Quick Status Buttons in Modal */}
            <div className="mt-6 pt-4 border-t border-[#2D2822] flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => handleStatusUpdate(viewingBooking.id, 'confirmed')}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Confirm
              </button>
              <button
                onClick={() => handleStatusUpdate(viewingBooking.id, 'completed')}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Complete
              </button>
              <button
                onClick={() => handleStatusUpdate(viewingBooking.id, 'no_show')}
                className="px-3 py-1.5 bg-stone-700 hover:bg-stone-600 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Mark No-Show
              </button>
              <button
                onClick={() => handleCancelBooking(viewingBooking.id)}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT BOOKING MODAL */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1814] border border-[#2D2822] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingBooking(null)}
              className="absolute top-5 right-5 text-[#A89E90] hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-serif text-[#F6EFE3] mb-4">
              Edit Booking
            </h2>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#A89E90] uppercase tracking-wider mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={editingBooking.customer_name}
                  onChange={(e) => setEditingBooking({ ...editingBooking, customer_name: e.target.value })}
                  className="w-full bg-[#14120E] border border-[#2D2822] rounded-lg px-3 py-2 text-sm text-[#F6EFE3] focus:outline-none focus:border-[#C8321F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A89E90] uppercase tracking-wider mb-1">Phone</label>
                  <input
                    type="text"
                    required
                    value={editingBooking.phone}
                    onChange={(e) => setEditingBooking({ ...editingBooking, phone: e.target.value })}
                    className="w-full bg-[#14120E] border border-[#2D2822] rounded-lg px-3 py-2 text-sm text-[#F6EFE3] focus:outline-none focus:border-[#C8321F]"
                  />
                </div>
                <div>
                  <label className="block text-[#A89E90] uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    value={editingBooking.email || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, email: e.target.value })}
                    className="w-full bg-[#14120E] border border-[#2D2822] rounded-lg px-3 py-2 text-sm text-[#F6EFE3] focus:outline-none focus:border-[#C8321F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#A89E90] uppercase tracking-wider mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={editingBooking.booking_date}
                    onChange={(e) => setEditingBooking({ ...editingBooking, booking_date: e.target.value })}
                    className="w-full bg-[#14120E] border border-[#2D2822] rounded-lg px-3 py-2 text-xs text-[#F6EFE3] focus:outline-none focus:border-[#C8321F]"
                  />
                </div>
                <div>
                  <label className="block text-[#A89E90] uppercase tracking-wider mb-1">Time</label>
                  <input
                    type="text"
                    required
                    value={editingBooking.booking_time}
                    onChange={(e) => setEditingBooking({ ...editingBooking, booking_time: e.target.value })}
                    className="w-full bg-[#14120E] border border-[#2D2822] rounded-lg px-3 py-2 text-xs text-[#F6EFE3] focus:outline-none focus:border-[#C8321F]"
                  />
                </div>
                <div>
                  <label className="block text-[#A89E90] uppercase tracking-wider mb-1">Guests</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editingBooking.guests}
                    onChange={(e) => setEditingBooking({ ...editingBooking, guests: e.target.value })}
                    className="w-full bg-[#14120E] border border-[#2D2822] rounded-lg px-3 py-2 text-xs text-[#F6EFE3] focus:outline-none focus:border-[#C8321F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A89E90] uppercase tracking-wider mb-1">Assigned Table</label>
                  <select
                    value={editingBooking.table_id || ''}
                    onChange={(e) => setEditingBooking({ ...editingBooking, table_id: e.target.value || null })}
                    className="w-full bg-[#14120E] border border-[#2D2822] rounded-lg px-3 py-2 text-xs text-[#F6EFE3] focus:outline-none focus:border-[#C8321F]"
                  >
                    <option value="">Auto-Assign Smallest</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.table_number} ({t.capacity} seats - {t.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#A89E90] uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={editingBooking.status}
                    onChange={(e) => setEditingBooking({ ...editingBooking, status: e.target.value })}
                    className="w-full bg-[#14120E] border border-[#2D2822] rounded-lg px-3 py-2 text-xs text-[#F6EFE3] focus:outline-none focus:border-[#C8321F]"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#A89E90] uppercase tracking-wider mb-1">Special Request</label>
                <textarea
                  rows={2}
                  value={editingBooking.special_request || ''}
                  onChange={(e) => setEditingBooking({ ...editingBooking, special_request: e.target.value })}
                  className="w-full bg-[#14120E] border border-[#2D2822] rounded-lg px-3 py-2 text-xs text-[#F6EFE3] focus:outline-none focus:border-[#C8321F]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-[#2D2822]">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-4 py-2 bg-[#2D2822] text-[#A89E90] hover:text-white rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#C8321F] hover:bg-[#A82515] text-white rounded-xl text-xs font-medium cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
