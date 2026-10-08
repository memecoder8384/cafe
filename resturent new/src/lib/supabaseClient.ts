import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://mfnaqwyxaabawzbajomi.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbmFxd3l4YWFiYXd6YmFqb21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NTE2NjYsImV4cCI6MjEwNzAyNzY2Nn0.6jLigp-ZUYbtDH028KON8saziqOv13nl9pxRlwfW59k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ReservationData {
  guest_name?: string;
  phone?: string;
  guest_count: string | number;
  date?: string;
  time: string;
  city: string;
  event_type?: string;
  special_requests?: string;
  source?: 'website_form' | 'chatbot';
  status?: string;
}

export async function saveReservation(reservation: ReservationData) {
  try {
    const guestsNum = parseInt(String(reservation.guest_count).replace(/\D/g, ''), 10) || 2;
    const { data, error } = await supabase
      .from('Bookings')
      .insert([
        {
          customer_name: reservation.guest_name || 'Guest',
          phone: reservation.phone || null,
          guests: guestsNum,
          booking_date: reservation.date || new Date().toISOString().split('T')[0],
          booking_time: reservation.time || '19:30',
          special_request: reservation.special_requests || reservation.event_type || null,
          source: reservation.source || 'website_form',
          status: reservation.status || 'confirmed',
        },
      ])
      .select();

    if (error) {
      console.warn('Supabase Bookings insert note:', error.message);
      // Fallback try reservations table if schema differs
      const fallback = await supabase
        .from('reservations')
        .insert([
          {
            guest_name: reservation.guest_name || 'Guest',
            phone: reservation.phone || null,
            guest_count: String(reservation.guest_count),
            date: reservation.date || new Date().toISOString().split('T')[0],
            time: reservation.time,
            city: reservation.city,
            event_type: reservation.event_type || 'Casual Dinner',
            special_requests: reservation.special_requests || null,
            source: reservation.source || 'website_form',
            status: reservation.status || 'confirmed',
          },
        ])
        .select();
      if (fallback.error) {
        return { success: false, error: error.message };
      }
      return { success: true, data: fallback.data };
    }
    return { success: true, data };
  } catch (err: any) {
    console.warn('Supabase saveReservation error:', err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}
