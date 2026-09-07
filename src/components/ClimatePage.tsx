import { Link } from 'react-router-dom';
import { ArrowLeft, Leaf } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import ClimateExperience from '@/components/ClimateExperience';

export default function ClimatePage() {
  return (
    <div className="min-h-screen bg-forest-950">
      <Navigation />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pb-16 pt-40 sm:pb-20 sm:pt-48">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(139,168,136,0.18),transparent_50%),radial-gradient(ellipse_at_70%_80%,rgba(41,75,58,0.5),transparent_50%)]" />
          <div className="absolute -left-32 top-24 h-80 w-80 rounded-full border border-cream-100/10 sm:h-[30rem] sm:w-[30rem]" />
          <div className="absolute -left-20 top-40 h-64 w-64 rounded-full border border-cream-100/10 sm:h-96 sm:w-96" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
            <Link
              to="/"
              className="mb-12 inline-flex items-center gap-2 font-sans text-sm text-cream-100/70 transition-colors hover:text-cream-50"
            >
              <ArrowLeft size={16} />
              Back to home
            </Link>
            <div className="max-w-4xl">
              <div className="mb-6 flex items-center gap-3 text-sage-300">
                <Leaf size={18} strokeWidth={1.5} />
                <span className="font-sans text-xs uppercase tracking-[0.28em]">Climate-Ready Garden</span>
              </div>
              <h1 className="font-serif text-5xl font-light leading-[1.08] text-cream-50 sm:text-6xl lg:text-7xl">
                Is Your Garden <span className="italic text-sage-200">Ready for the Future?</span>
              </h1>
              <p className="mt-8 max-w-2xl font-sans text-base font-light leading-relaxed text-cream-100/70 sm:text-lg">
                As our climate shifts, our gardens face new challenges — longer dry spells, sudden downpours, and changing wildlife. Explore how we help Cambridge gardens become resilient, beautiful, and ready for whatever comes next.
              </p>
            </div>
          </div>
        </section>

        {/* Full Interactive Experience */}
        <section className="relative overflow-hidden pb-24 lg:pb-32">
          <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
            <ClimateExperience />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
