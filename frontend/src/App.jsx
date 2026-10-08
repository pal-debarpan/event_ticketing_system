import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import RegistrationSuccessPage from './pages/RegistrationSuccessPage';
import OrganizerLoginPage from './pages/OrganizerLoginPage';
import OrganizerCheckInPage from './pages/OrganizerCheckInPage';
import { api, getAuthToken, clearAuthToken } from './api';

export default function App() {
  const [organizer, setOrganizer] = useState(null);

  useEffect(() => {
    // If token exists on load, validate with /api/organizers/me
    const token = getAuthToken();
    if (token) {
      api.getCurrentOrganizer().then((res) => {
        if (res.ok && res.data?.organizer) {
          setOrganizer(res.data.organizer);
        } else if (res.status === 401) {
          clearAuthToken();
          setOrganizer(null);
        }
      });
    }
  }, []);

  const handleLogout = () => {
    clearAuthToken();
    setOrganizer(null);
    window.location.href = '/organizer/login';
  };

  return (
    <BrowserRouter>
      <Layout organizer={organizer} onLogout={handleLogout}>
        <Routes>
          {/* Public Student Routes */}
          <Route path="/" element={<EventsPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/registration-success" element={<RegistrationSuccessPage />} />

          {/* Organizer Routes */}
          <Route
            path="/organizer/login"
            element={
              <OrganizerLoginPage
                onLoginSuccess={() => {
                  api.getCurrentOrganizer().then((res) => {
                    if (res.ok && res.data?.organizer) {
                      setOrganizer(res.data.organizer);
                    }
                  });
                }}
              />
            }
          />
          <Route
            path="/organizer/check-in"
            element={
              <OrganizerCheckInPage
                organizer={organizer}
                setOrganizer={setOrganizer}
              />
            }
          />

          {/* Catch-all redirect to events */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
