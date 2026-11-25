import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';

type ShellProps = {
  title: string;
  description: string;
  path?: string;
  noIndex?: boolean;
  children: ReactNode;
};

export default function DesignerShell({ title, description, path, noIndex, children }: ShellProps) {
  return (
    <div className="min-h-screen bg-cream-100">
      <SEO title={title} description={description} path={path} noIndex={noIndex} />
      <Navigation />
      <div className="border-b border-sage-200 bg-cream-50 pt-[72px]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 text-sm lg:px-10">
          <Link to="/ai-garden-designer" className="font-serif text-lg text-forest-800">
            AI Garden Designer
          </Link>
          <Link to="/my-visualizations" className="text-forest-600 underline-offset-4 hover:text-forest-800 hover:underline">
            My Visualizations
          </Link>
        </div>
      </div>
      <main>{children}</main>
      <Footer />
    </div>
  );
}
