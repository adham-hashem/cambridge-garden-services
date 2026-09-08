import { useScrollReveal } from '@/hooks/useScrollReveal';
import Navigation from '@/components/Navigation';
import Services from '@/components/Services';
import QuoteForm from '@/components/QuoteForm';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { breadcrumbStructuredData, pageSeo } from '@/lib/seo';

export default function ServicesPage() {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-cream-100">
      <SEO
        title="Garden Services in Cambridge | Cambridge Garden Services"
        description={pageSeo.home.description}
        path="/services"
        structuredData={[
          breadcrumbStructuredData([
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/services' },
          ]),
        ]}
      />
      <Navigation />
      <main className="pt-16">
        <Services />
        <QuoteForm />
      </main>
      <Footer />
    </div>
  );
}
