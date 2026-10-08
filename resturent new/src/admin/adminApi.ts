import { supabase } from '../lib/supabaseClient';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

async function getAuthHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token || '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchAdminStats() {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/admin/stats`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch stats (${res.status})`);
  }
  return res.json();
}

export async function fetchAdminBookings(filters?: {
  date?: string;
  status?: string;
  search?: string;
  source?: string;
}) {
  const headers = await getAuthHeaders();
  const params = new URLSearchParams();
  if (filters?.date) params.append('date', filters.date);
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.source && filters.source !== 'all') params.append('source', filters.source);

  const res = await fetch(`${BACKEND_URL}/api/bookings?${params.toString()}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch bookings (${res.status})`);
  }
  const data = await res.json();
  return data.bookings || [];
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/bookings/${bookingId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to update status (${res.status})`);
  }
  return res.json();
}

export async function updateBookingDetails(bookingId: string, updates: any) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/bookings/${bookingId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to update booking (${res.status})`);
  }
  return res.json();
}

export async function cancelBooking(bookingId: string) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/bookings/${bookingId}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to cancel booking (${res.status})`);
  }
  return res.json();
}

export async function fetchTables() {
  const res = await fetch(`${BACKEND_URL}/api/tables`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to fetch tables (${res.status})`);
  }
  const data = await res.json();
  return data.tables || [];
}

export async function createTable(table: { table_number: string; capacity: number; status?: string }) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/tables`, {
    method: 'POST',
    headers,
    body: JSON.stringify(table),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to create table (${res.status})`);
  }
  return res.json();
}

export async function updateTable(tableId: string, updates: { table_number?: string; capacity?: number; status?: string }) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${BACKEND_URL}/api/tables/${tableId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Failed to update table (${res.status})`);
  }
  return res.json();
}
