import React, { useEffect, useState } from 'react';
import { fetchTables, createTable, updateTable } from './adminApi';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  CheckCircle2,
  Users,
  RefreshCw,
  X,
  AlertCircle,
  Wrench,
} from 'lucide-react';

export const AdminTables: React.FC = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<any | null>(null);
  const [newTable, setNewTable] = useState({
    table_number: '',
    capacity: 2,
    status: 'available',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTables();
      setTables(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load café tables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTable.table_number.trim()) {
      alert('Table number is required (e.g. T01)');
      return;
    }
    try {
      setIsSubmitting(true);
      await createTable({
        table_number: newTable.table_number.trim().toUpperCase(),
        capacity: Number(newTable.capacity),
        status: newTable.status,
      });
      setIsAddModalOpen(false);
      setNewTable({ table_number: '', capacity: 2, status: 'available' });
      await loadTables();
    } catch (err: any) {
      alert(`Could not create table: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;
    try {
      setIsSubmitting(true);
      await updateTable(editingTable.id, {
        table_number: editingTable.table_number.trim().toUpperCase(),
        capacity: Number(editingTable.capacity),
        status: editingTable.status,
      });
      setEditingTable(null);
      await loadTables();
    } catch (err: any) {
      alert(`Could not update table: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (table: any, newStatus: string) => {
    try {
      await updateTable(table.id, { status: newStatus });
      await loadTables();
    } catch (err: any) {
      alert(`Could not change table status: ${err.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/80';
      case 'occupied':
        return 'bg-amber-950/60 text-amber-400 border-amber-800/80';
      case 'maintenance':
        return 'bg-red-950/60 text-red-400 border-red-800/80';
      default:
        return 'bg-stone-900 text-stone-300 border-stone-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Add Table Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#F6EFE3]">
            Café Floor & Table Management
          </h1>
          <p className="text-xs text-[#A89E90] mt-1">
            Configure restaurant tables, seating capacity, and real-time floor availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadTables}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#1C1814] hover:bg-[#26211B] text-xs font-medium text-[#F6EFE3] rounded-xl border border-[#2D2822] transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#C8321F] hover:bg-[#A82515] text-xs font-medium text-white rounded-xl shadow-md transition-colors cursor-pointer"
          >
            <Plus size={16} />
            Add Table
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {loading && tables.length === 0 ? (
          <div className="col-span-full py-16 text-center text-[#A89E90]">
            <div className="w-8 h-8 border-2 border-[#C8321F] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading café tables...
          </div>
        ) : tables.length === 0 ? (
          <div className="col-span-full py-16 text-center text-[#A89E90] bg-[#1C1814] rounded-2xl border border-[#2D2822] p-8">
            <UtensilsCrossed size={36} className="mx-auto mb-3 text-[#5C5348]" />
            <h3 className="text-base font-serif text-[#F6EFE3] mb-1">No Tables Configured Yet</h3>
            <p className="text-xs text-[#7C7267] max-w-sm mx-auto mb-4">
              Add tables like T01, T02 with their seating capacities to allow real-time bookings.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-[#C8321F] text-white text-xs rounded-xl font-medium cursor-pointer"
            >
              Add First Table
            </button>
          </div>
        ) : (
          tables.map((table) => (
            <div
              key={table.id}
              className="bg-[#1C1814] border border-[#2D2822] hover:border-[#423A31] rounded-2xl p-5 shadow-lg flex flex-col justify-between transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-[#7C7267] block">
                    Table
                  </span>
                  <span className="text-2xl font-mono font-bold text-[#F6EFE3]">
                    {table.table_number}
                  </span>
                </div>

                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold border ${getStatusBadge(
                    table.status
                  )}`}
                >
                  {table.status}
                </span>
              </div>

              {/* Seating Capacity */}
              <div className="my-5 flex items-center gap-2 p-3 bg-[#14120E] rounded-xl border border-[#2D2822]">
                <Users size={16} className="text-[#C8321F]" />
                <span className="text-xs font-semibold text-[#F6EFE3]">
                  {table.capacity} {table.capacity === 1 ? 'Seat' : 'Seats'}
                </span>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-[#2D2822] flex items-center justify-between text-xs">
                <button
                  onClick={() => setEditingTable({ ...table })}
                  className="flex items-center gap-1 text-[#A89E90] hover:text-[#F6EFE3] transition-colors cursor-pointer"
                >
                  <Edit2 size={13} />
                  Edit
                </button>

                {table.status === 'maintenance' ? (
                  <button
                    onClick={() => handleQuickStatusChange(table, 'available')}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium transition-colors cursor-pointer"
                  >
                    <CheckCircle2 size={13} />
                    Make Available
                  </button>
                ) : (
                  <button
                    onClick={() => handleQuickStatusChange(table, 'maintenance')}
                    className="flex items-center gap-1 text-red-400 hover:text-red-300 font-medium transition-colors cursor-pointer"
                  >
                    <Wrench size={13} />
                    Maintenance
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ADD TABLE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1814] border border-[#2D2822] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 text-[#A89E90] hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-serif text-[#F6EFE3] mb-4">
              Add New Café Table
            </h2>

            <form onSubmit={handleAddTable} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#A89E90] uppercase tracking-wider mb-1">
                  Table Number / Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. T06"
                  value={newTable.table_number}
                  onChange={(e) => setNewTable({ ...newTable, table_number: e.target.value })}
                  className="w-full bg-[#14120E] border border-[#2D2822] rounded-lg px-3 py-2.5 text-sm font-mono text-[#F6EFE3] focus:outline-none focus:border-[#C8321F]"
                />
              </div>

              <div>
                <label className="block text-[#A89E90] uppercase tracking-wider mb-1">
                  Seating Capacity (Guests)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value, 10) })}
                  className="w-full bg-[#14120E] border border-[#2D2822] rounded-lg px-3 py-2 text-sm text-[#F6EFE3] focus:outline-none focus:border-[#C8321F]"
                />
              </div>

              <div>
                <label className="block text-[#A89E90] uppercase tracking-wider mb-1">
                  Initial Status
                </label>
                <select
                  value={newTable.status}
                  onChange={(e) => setNewTable({ ...newTable, status: e.target.value })}
                  className="w-full bg-[#14120E] border border-[#2D2822] rounded-lg px-3 py-2 text-xs text-[#F6EFE3] focus:outline-none focus:border-[#C8321F]"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-[#2D2822]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-[#2D2822] text-[#A89E90] hover:text-white rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#C8321F] hover:bg-[#A82515] text-white rounded-xl text-xs font-medium cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TABLE MODAL */}
      {editingTable && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1814] border border-[#2D2822] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingTable(null)}
              className="absolute top-5 right-5 text-[#A89E90] hover:text-white cursor-pointer"
            >
              <X size={18} />
            </button>

            <h2 className="text-xl font-serif text-[#F6EFE3] mb-4">
              Edit Table {editingTable.table_number}
            </h2>

            <form onSubmit={handleUpdateTable} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#A89E90] uppercase tracking-wider mb-1">
                  Table Number
                </label>
                <input
                  type="text"
                  required
                  value={editingTable.table_number}
                  onChange={(e) => setEditingTable({ ...editingTable, table_number: e.target.value })}
                  className="w-full bg-[#14120E] border border-[#2D2822] rounded-lg px-3 py-2 text-sm font-mono text-[#F6EFE3] focus:outline-none focus:border-[#C8321F]"
                />
              </div>

              <div>
                <label className="block text-[#A89E90] uppercase tracking-wider mb-1">
                  Capacity (Seats)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editingTable.capacity}
                  onChange={(e) => setEditingTable({ ...editingTable, capacity: parseInt(e.target.value, 10) })}
                  className="w-full bg-[#14120E] border border-[#2D2822] rounded-lg px-3 py-2 text-sm text-[#F6EFE3] focus:outline-none focus:border-[#C8321F]"
                />
              </div>

              <div>
                <label className="block text-[#A89E90] uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={editingTable.status}
                  onChange={(e) => setEditingTable({ ...editingTable, status: e.target.value })}
                  className="w-full bg-[#14120E] border border-[#2D2822] rounded-lg px-3 py-2 text-xs text-[#F6EFE3] focus:outline-none focus:border-[#C8321F]"
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-[#2D2822]">
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
                  className="px-4 py-2 bg-[#2D2822] text-[#A89E90] hover:text-white rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#C8321F] hover:bg-[#A82515] text-white rounded-xl text-xs font-medium cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
