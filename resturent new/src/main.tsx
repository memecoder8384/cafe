import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import App from './App.tsx';
import { AdminLogin } from './admin/AdminLogin.tsx';
import { AdminGuard } from './admin/AdminGuard.tsx';
import { AdminLayout } from './admin/AdminLayout.tsx';
import { AdminOverview } from './admin/AdminOverview.tsx';
import { AdminBookings } from './admin/AdminBookings.tsx';
import { AdminTables } from './admin/AdminTables.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Main Customer Website */}
        <Route path="/" element={<App />} />

        {/* Admin Login Route */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Console Routes */}
        <Route path="/admin" element={<AdminGuard />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="tables" element={<AdminTables />} />
          </Route>
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);

