import { useScrollReveal } from '@/hooks/useScrollReveal';
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Intro from '@/components/Intro';
import Services from '@/components/Services';
import Projects from '@/components/Projects';
import ClimateSection from '@/components/ClimateSection';
import About from '@/components/About';
import Journal from '@/components/Journal';
import QuoteForm from '@/components/QuoteForm';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { localBusinessStructuredData, pageSeo, websiteStructuredData } from '@/lib/seo';

export default function HomePage() {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-cream-100">
      <SEO
        title={pageSeo.home.title}
        description={pageSeo.home.description}
        path="/"
        structuredData={[localBusinessStructuredData(), websiteStructuredData()]}
      />
      <Navigation />
      <main>
        <Hero />
        <Intro />
        <Services />
        <Projects />
        <ClimateSection />
        <About />
        <Journal />
        <QuoteForm />
      </main>
      <Footer />
    </div>
  );
}
