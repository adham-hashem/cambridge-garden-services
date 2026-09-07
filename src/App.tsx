import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import HomePage from '@/components/HomePage';
import ServicePage from '@/components/ServicePage';
import ArticlePage from '@/components/ArticlePage';
import AboutPage from '@/components/AboutPage';
import ClimatePage from '@/components/ClimatePage';
import AdminDashboard from '@/components/admin/AdminDashboard';
import NotFoundPage from '@/components/NotFoundPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/services/:serviceId" element={<ServicePage />} />
        <Route path="/journal/:id" element={<ArticlePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/climate-ready" element={<ClimatePage />} />
        <Route path="/admin" element={<Navigate to="/admin/bookings" replace />} />
        <Route path="/admin/:tab" element={<AdminDashboard />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
