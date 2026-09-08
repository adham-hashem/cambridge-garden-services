import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import HomePage from '@/components/HomePage';
import ServicesPage from '@/components/ServicesPage';
import ServicePage from '@/components/ServicePage';
import ProjectPage from '@/components/ProjectPage';
import ArticlePage from '@/components/ArticlePage';
import AboutPage from '@/components/AboutPage';
import ClimatePage from '@/components/ClimatePage';
import AdminDashboard from '@/components/admin/AdminDashboard';
import NotFoundPage from '@/components/NotFoundPage';
import { AuthProvider } from '@/hooks/useAuth';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:serviceId" element={<ServicePage />} />
          <Route path="/projects/:projectId" element={<ProjectPage />} />
          <Route path="/journal/:id" element={<ArticlePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/climate-ready" element={<ClimatePage />} />
          <Route path="/admin" element={<Navigate to="/admin/bookings" replace />} />
          <Route path="/admin/:tab" element={<AdminDashboard />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
