import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import HomePage from '@/components/HomePage';
import ServicesPage from '@/components/ServicesPage';
import ServicePage from '@/components/ServicePage';
import ProjectPage from '@/components/ProjectPage';
import ArticlePage from '@/components/ArticlePage';
import AboutPage from '@/components/AboutPage';
import ClimatePage from '@/components/ClimatePage';
import AdminDashboard from '@/components/admin/AdminDashboard';
import TestimonialsPage from '@/components/TestimonialsPage';
import InspirationPage from '@/components/InspirationPage';
import DesignerLanding from '@/components/designer/DesignerLanding';
import ScratchWizard from '@/components/designer/ScratchWizard';
import RedesignPage from '@/components/designer/RedesignPage';
import DesignerProject from '@/components/designer/DesignerProject';
import MyVisualizations from '@/components/designer/MyVisualizations';
import NotFoundPage from '@/components/NotFoundPage';
import FloatingWhatsApp from '@/components/FloatingWhatsApp';
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
          <Route path="/inspiration" element={<InspirationPage />} />
          <Route path="/testimonials" element={<TestimonialsPage />} />
          <Route path="/journal/:id" element={<ArticlePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/climate-ready" element={<ClimatePage />} />
          <Route path="/ai-garden-designer" element={<DesignerLanding />} />
          <Route path="/ai-garden-designer/plan" element={<ScratchWizard />} />
          <Route path="/ai-garden-designer/redesign" element={<RedesignPage />} />
          <Route path="/ai-garden-designer/project/:projectId" element={<DesignerProject />} />
          <Route path="/my-visualizations" element={<MyVisualizations />} />
          <Route path="/admin" element={<Navigate to="/admin/bookings" replace />} />
          <Route path="/admin/:tab" element={<AdminDashboard />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <FloatingWhatsApp />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
