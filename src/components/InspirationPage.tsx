import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import QuoteForm from '@/components/QuoteForm';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { fetchPublishedInspirations } from '@/lib/inspirations';
import { fetchPublishedServices, type ServiceAdminItem } from '@/lib/services';
import type { GardenInspiration } from '@/types/inspiration';
import {
  Sparkles,
  Loader2,
  Tag,
  ArrowRight,
  Compass,
} from 'lucide-react';

export default function InspirationPage() {
  const [inspirations, setInspirations] = useState<GardenInspiration[]>([]);
  const [services, setServices] = useState<ServiceAdminItem[]>([]);
  const [activeServiceFilter, setActiveServiceFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedItemForBooking, setSelectedItemForBooking] = useState<GardenInspiration | null>(null);

  useScrollReveal();

  useEffect(() => {
    window.scrollTo(0, 0);
    loadInitialData();
  }, []);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [fetchedServices, fetchedInspirations] = await Promise.all([
        fetchPublishedServices(),
        fetchPublishedInspirations(),
      ]);
      setServices(fetchedServices);
      setInspirations(fetchedInspirations);
    } catch (err) {
      console.error('Error loading inspiration page data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleFilterChange(serviceId: string) {
    setActiveServiceFilter(serviceId);
    setLoading(true);
    try {
      const data = await fetchPublishedInspirations(serviceId);
      setInspirations(data);
    } catch (err) {
      console.error('Error filtering inspirations:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleWantThis = (item: GardenInspiration) => {
    setSelectedItemForBooking(item);
    setBookingModalOpen(true);
  };

  const currentServiceTitle = selectedItemForBooking?.service_title || 'Garden Service';
  const prefilledProjectDetails = selectedItemForBooking
    ? `I am interested in the Garden Inspiration item: "${selectedItemForBooking.title}" (Service: ${currentServiceTitle}). Please provide a consultation and quote.`
    : '';

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      <SEO
        title="Garden Inspiration & Materials | Cambridge Garden Services"
        description="Browse standalone project features, paving, fencing, turfing, and materials crafted by Cambridge Garden Services. Click 'I Want This' to easily book your garden transformation."
      />
      <Navigation />

      <main className="flex-grow pt-24">
        {/* Hero Section */}
        <section className="relative bg-forest-900 py-20 lg:py-28 text-cream-50 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-forest-800/40 via-transparent to-transparent pointer-events-none" />
          <div className="mx-auto max-w-5xl px-6 text-center relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-sage-300/30 bg-forest-800/50 px-4 py-1.5 font-sans text-xs uppercase tracking-widest-2 text-sage-300 mb-6 backdrop-blur-sm">
              <Compass size={13} />
              Material & Project Ideas
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-cream-50 tracking-tight leading-tight">
              Garden <span className="italic">Inspiration</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl font-sans text-base sm:text-lg font-light text-cream-200/70 leading-relaxed">
              Explore individual garden features, premium paving, timber fencing, turfing, and landscaping elements. See something you love? Tap <strong className="text-cream-50 font-normal">"I Want This"</strong> to request it directly for your space.
            </p>
          </div>
        </section>

        {/* Filter Navigation Bar */}
        <section className="sticky top-20 z-30 bg-cream-50/95 backdrop-blur-md border-b border-sage-200 shadow-sm py-4">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => handleFilterChange('all')}
                className={`shrink-0 rounded-full px-5 py-2 font-sans text-xs uppercase tracking-wider transition-all ${
                  activeServiceFilter === 'all'
                    ? 'bg-forest-800 text-cream-50 font-medium shadow-sm'
                    : 'bg-cream-100 text-forest-700 hover:bg-cream-200 border border-sage-200'
                }`}
              >
                All Inspiration
              </button>
              {services.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => handleFilterChange(svc.id)}
                  className={`shrink-0 rounded-full px-5 py-2 font-sans text-xs uppercase tracking-wider transition-all ${
                    activeServiceFilter === svc.id
                      ? 'bg-forest-800 text-cream-50 font-medium shadow-sm'
                      : 'bg-cream-100 text-forest-700 hover:bg-cream-200 border border-sage-200'
                  }`}
                >
                  {svc.title}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Gallery Grid Section */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            {loading ? (
              <div className="py-24 text-center">
                <Loader2 size={36} className="animate-spin text-forest-600 mx-auto mb-4" />
                <p className="font-sans text-sm text-forest-600 font-light">Loading inspiration items...</p>
              </div>
            ) : inspirations.length > 0 ? (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {inspirations.map((item) => (
                  <article
                    key={item.id}
                    className="group rounded-3xl bg-cream-50 overflow-hidden border border-sage-200/80 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col"
                  >
                    {/* Image Container */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-forest-900">
                      <img
                        src={item.image}
                        alt={item.alt || item.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-forest-950/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Service Tag */}
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-900/80 backdrop-blur-md px-3 py-1 font-sans text-xs font-medium text-cream-50 shadow-md">
                          <Tag size={11} className="text-sage-300" />
                          {item.service_title || item.service_id}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 sm:p-8 flex flex-col flex-grow justify-between">
                      <div>
                        <h3 className="font-serif text-2xl font-light text-forest-900 tracking-tight leading-snug group-hover:text-forest-700 transition-colors">
                          {item.title}
                        </h3>
                        <p className="mt-3 font-sans text-sm font-light text-forest-700/80 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      {/* Action Button: "I Want This" */}
                      <div className="mt-6 pt-6 border-t border-sage-200/60 flex items-center justify-between">
                        <span className="font-sans text-xs text-forest-600/70">
                          {item.service_title}
                        </span>
                        <button
                          onClick={() => handleWantThis(item)}
                          className="inline-flex items-center gap-2 rounded-full bg-forest-800 px-5 py-2.5 font-sans text-xs uppercase tracking-widest-2 text-cream-50 font-medium transition-all hover:bg-forest-950 hover:shadow-md active:scale-95"
                        >
                          <Sparkles size={14} className="text-sage-300" />
                          I Want This
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="rounded-3xl border-2 border-dashed border-sage-300 bg-cream-50/50 p-12 text-center max-w-xl mx-auto my-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-200/60 text-forest-700 mb-4">
                  <Compass size={28} />
                </div>
                <h3 className="font-serif text-2xl font-light text-forest-900 mb-2">
                  No Inspiration Items Found
                </h3>
                <p className="font-sans text-sm text-forest-700/70 font-light mb-6 leading-relaxed">
                  {activeServiceFilter !== 'all'
                    ? 'No items currently catalogued under this service. Choose "All Inspiration" or explore our services.'
                    : 'Our team is actively curating photography of recent work, materials, and features. In the meantime, get in touch to discuss your dream project.'}
                </p>
                <button
                  onClick={() => {
                    setSelectedItemForBooking(null);
                    setBookingModalOpen(true);
                  }}
                  className="rounded-full bg-forest-800 px-6 py-3 font-sans text-xs uppercase tracking-widest-2 text-cream-50 font-medium hover:bg-forest-900 transition-colors inline-flex items-center gap-2"
                >
                  Book a Consultation <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Booking Modal with Pre-filled Item & Service */}
      {bookingModalOpen && (
        <QuoteForm
          isModal={true}
          onClose={() => setBookingModalOpen(false)}
          initialProjectType={currentServiceTitle}
          initialProjectDetails={prefilledProjectDetails}
          initialItemName={selectedItemForBooking?.title}
          title={selectedItemForBooking ? `I Want This: ${selectedItemForBooking.title}` : 'Book a Consultation'}
          subtitle={
            selectedItemForBooking
              ? `We have pre-filled your request with "${selectedItemForBooking.title}" under ${currentServiceTitle}. Fill in your contact info to receive your quote.`
              : undefined
          }
        />
      )}

      <Footer />
    </div>
  );
}
