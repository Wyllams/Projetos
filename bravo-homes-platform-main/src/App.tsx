import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import PartnerDashboard from './pages/PartnerDashboard';
import LandingPage from './pages/LandingPage';
import { LanguageProvider } from './lib/i18n';

export default function App() {
  return (
    <LanguageProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/client" element={<ClientDashboard />} />
        <Route path="/partner" element={<PartnerDashboard />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/lp/bathroom/:city" element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
    </LanguageProvider>
  );
}
