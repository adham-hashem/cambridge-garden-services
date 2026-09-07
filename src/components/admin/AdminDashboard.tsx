import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AdminLogin from '@/components/admin/AdminLogin';
import ProjectsPanel from '@/components/admin/ProjectsPanel';
import BookingsPanel from '@/components/admin/BookingsPanel';
import PromoCodesPanel from '@/components/admin/PromoCodesPanel';
import ArticlesPanel from '@/components/admin/ArticlesPanel';
import ClimatePanel from '@/components/admin/ClimatePanel';
import {
  LogOut,
  Loader2,
  ExternalLink,
  CalendarCheck,
  FolderKanban,
  TicketPercent,
  Newspaper,
  Leaf,
} from 'lucide-react';

type Tab = 'bookings' | 'projects' | 'promos' | 'articles' | 'climate';

const tabs: { id: Tab; label: string; icon: typeof CalendarCheck }[] = [
  { id: 'bookings', label: 'Bookings', icon: CalendarCheck },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'promos', label: 'Promo Codes', icon: TicketPercent },
  { id: 'articles', label: 'Articles', icon: Newspaper },
  { id: 'climate', label: 'Climate', icon: Leaf },
];

export default function AdminDashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab?: string }>();
  const validTab = tabs.some((item) => item.id === tab);
  const routeTab = validTab ? (tab as Tab) : 'bookings';
  const activeTab = routeTab;

  if (tab && !validTab) {
    return <Navigate to="/admin/bookings" replace />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-100">
        <Loader2 size={32} className="animate-spin text-forest-600" />
      </div>
    );
  }

  if (!user) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-sage-200 bg-cream-50/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <h1 className="font-serif text-xl font-medium text-forest-800">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 font-sans text-sm text-forest-600 transition-colors hover:text-forest-800"
            >
              <ExternalLink size={14} />
              View Site
            </Link>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-full border border-sage-300 px-4 py-2 font-sans text-sm text-forest-700 transition-all hover:bg-sage-100"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="mx-auto max-w-7xl px-6">
          <nav className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => navigate(`/admin/${tab.id}`)}
                  className={`flex items-center gap-2 border-b-2 px-5 py-3 font-sans text-sm transition-colors ${
                    isActive
                      ? 'border-forest-700 font-medium text-forest-800'
                      : 'border-transparent text-forest-500 hover:text-forest-700'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {activeTab === 'bookings' && <BookingsPanel />}
        {activeTab === 'projects' && <ProjectsPanel />}
        {activeTab === 'promos' && <PromoCodesPanel />}
        {activeTab === 'articles' && <ArticlesPanel />}
        {activeTab === 'climate' && <ClimatePanel />}
      </div>
    </div>
  );
}
