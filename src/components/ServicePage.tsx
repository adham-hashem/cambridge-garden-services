import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getServiceById, services as servicesList } from '@/data/content';
import { fetchPublishedProjects } from '@/lib/projects';
import type { Project } from '@/types/project';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import QuoteForm from '@/components/QuoteForm';
import SEO from '@/components/SEO';
import { breadcrumbStructuredData, serviceSeo, serviceStructuredData } from '@/lib/seo';
import { ArrowLeft, ArrowRight, Eye, ClipboardList, Sprout, Loader2, Plus } from 'lucide-react';

const PAGE_SIZE = 3;

export default function ServicePage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const service = serviceId ? getServiceById(serviceId) : undefined;
  const [scrollY, setScrollY] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useScrollReveal();

  const loadProjects = useCallback(async (serviceId: string, pageNum: number, replace: boolean) => {
    if (replace) setLoading(true);
    else setLoadingMore(true);

    const { projects: newProjects, hasMore: more } = await fetchPublishedProjects(pageNum, serviceId, PAGE_SIZE);

    if (replace) {
      setProjects(newProjects);
      setLoading(false);
    } else {
      setProjects((prev) => [...prev, ...newProjects]);
      setLoadingMore(false);
    }
    setHasMore(more);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (serviceId) {
      setPage(0);
      setProjects([]);
      loadProjects(serviceId, 0, true);
    }
  }, [serviceId, loadProjects]);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!service) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <SEO
          title="Service Not Found | Cambridge Garden Services"
          description="The requested Cambridge Garden Services page could not be found."
          noIndex
        />
        <div className="text-center">
          <h1 className="font-serif text-3xl text-forest-800 mb-4">Service not found</h1>
          <Link to="/" className="font-sans text-sm text-sage-500 hover:text-forest-700">
            Return to the garden
          </Link>
        </div>
      </div>
    );
  }

  const otherServices = servicesList.filter((s) => s.id !== service.id);
  const seo = serviceSeo(service);

  const goToServices = () => {
    navigate({ pathname: '/', hash: 'services' });
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadProjects(service.id, nextPage, false);
  };

  return (
    <div className="min-h-screen bg-cream-100">
      <SEO
        title={seo.title}
        description={seo.description}
        path={seo.path}
        image={seo.image}
        structuredData={[
          serviceStructuredData(service),
          breadcrumbStructuredData([
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/#services' },
            { name: service.title, path: seo.path },
          ]),
        ]}
      />
      <Navigation />

      <section className="relative h-[70vh] w-full overflow-hidden">
        <div
          className="parallax-bg absolute inset-0"
          style={{ transform: `translateY(${scrollY * 0.4}px) scale(${1 + scrollY * 0.0003})` }}
        >
          <div
            className="absolute inset-0 bg-cover bg-center animate-ken-burns"
            style={{ backgroundImage: `url('${service.heroImage}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest-950/50 via-forest-900/30 to-forest-950/80" />
        </div>

        <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
          <button
            onClick={goToServices}
            className="opacity-0 animate-fade-in mb-6 inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest-2 text-cream-200/70 transition-colors hover:text-cream-100"
            style={{ animationDelay: '0.2s' }}
          >
            <ArrowLeft size={14} />
            All Services
          </button>
          <p
            className="opacity-0 animate-fade-in font-sans text-xs uppercase tracking-widest-2 text-cream-200/80 mb-4"
            style={{ animationDelay: '0.3s' }}
          >
            Cambridge · England
          </p>
          <h1
            className="opacity-0 animate-fade-up font-serif text-5xl font-light leading-tight text-cream-50 text-balance sm:text-6xl md:text-7xl"
            style={{ animationDelay: '0.5s' }}
          >
            {service.title}
          </h1>
          <p
            className="opacity-0 animate-fade-up mt-6 max-w-xl font-sans text-base font-light leading-relaxed text-cream-200/80 sm:text-lg"
            style={{ animationDelay: '0.8s' }}
          >
            {service.detail}
          </p>
        </div>
      </section>

      <section className="bg-cream-100 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <p className="reveal font-sans text-xs uppercase tracking-widest-2 text-sage-500 mb-6">
            What We Offer
          </p>
          <h2 className="reveal reveal-delay-1 font-serif text-3xl font-light text-forest-800 sm:text-4xl">
            {service.description}
          </h2>
          <div className="reveal reveal-delay-2 mx-auto mt-8 h-px w-16 bg-sage-400" />
          <p className="reveal reveal-delay-3 mx-auto mt-8 max-w-2xl font-sans text-base font-light leading-relaxed text-forest-700/70">
            {service.detail}
          </p>
        </div>
      </section>

      {loading ? (
        <section className="bg-forest-900 py-20 lg:py-28">
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-sage-300" />
          </div>
        </section>
      ) : projects.length > 0 ? (
        <section className="bg-forest-900 py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mb-16 text-center">
              <p className="reveal font-sans text-xs uppercase tracking-widest-2 text-sage-300 mb-6">
                {service.title} Projects
              </p>
              <h2 className="reveal reveal-delay-1 font-serif text-4xl font-light text-cream-50 sm:text-5xl">
                From Ground <span className="italic">to Garden</span>
              </h2>
              <p className="reveal reveal-delay-2 mx-auto mt-6 max-w-xl font-sans text-base font-light text-cream-200/60">
                Drag the slider to walk through each transformation.
              </p>
            </div>

            <div className="space-y-24">
              {projects.map((project, i) => (
                <div
                  key={project.id}
                  className={`reveal grid items-center gap-8 lg:gap-16 lg:grid-cols-2 ${
                    i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
                  }`}
                >
                  <div>
                    <BeforeAfterSlider
                      before={project.before_image}
                      after={project.after_image}
                      beforeAlt={project.before_alt}
                      afterAlt={project.after_alt}
                    />
                  </div>
                  <div className="reveal reveal-delay-1">
                    <p className="font-sans text-xs uppercase tracking-widest-2 text-sage-300 mb-4">
                      {project.location}
                    </p>
                    <h3 className="font-serif text-3xl font-light text-cream-50 sm:text-4xl">
                      {project.title}
                    </h3>
                    <p className="mt-6 font-sans text-base font-light leading-relaxed text-cream-200/70">
                      {project.description}
                    </p>
                    <div className="mt-8 flex flex-wrap gap-4">
                      <button className="inline-flex items-center gap-2 rounded-full bg-cream-100 px-6 py-3 font-sans text-sm uppercase tracking-widest-2 text-forest-800 transition-all hover:bg-cream-200">
                        <Eye size={16} />
                        View Project
                      </button>
                      <a
                        href="#quote"
                        className="inline-flex items-center gap-2 rounded-full border border-cream-100/30 px-6 py-3 font-sans text-sm uppercase tracking-widest-2 text-cream-50 transition-all hover:bg-cream-100 hover:text-forest-800"
                      >
                        <ClipboardList size={16} />
                        Get a Quote
                      </a>
                    </div>
                    <div className="mt-8 h-px w-12 bg-sage-400/40" />
                  </div>
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-16 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="inline-flex items-center gap-2 rounded-full border border-cream-100/30 px-8 py-4 font-sans text-sm uppercase tracking-widest-2 text-cream-50 transition-all hover:bg-cream-100 hover:text-forest-800 disabled:opacity-60"
                >
                  {loadingMore ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  Load More Projects
                </button>
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="bg-forest-900 py-20 lg:py-28">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <div className="reveal mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-sage-400/15">
              <Sprout size={36} className="text-sage-300" />
            </div>
            <h2 className="reveal reveal-delay-1 font-serif text-3xl font-light text-cream-50 sm:text-4xl">
              Projects Coming Soon
            </h2>
            <p className="reveal reveal-delay-2 mt-6 font-sans text-base font-light leading-relaxed text-cream-200/60">
              We are currently working on new {service.title.toLowerCase()} projects to share here.
              In the meantime, we would love to hear about your garden.
            </p>
            <a
              href="#quote"
              className="reveal reveal-delay-3 mt-10 inline-flex items-center gap-2 rounded-full bg-cream-100 px-8 py-4 font-sans text-sm uppercase tracking-widest-2 text-forest-800 transition-all hover:bg-cream-200"
            >
              <ClipboardList size={16} />
              Get a Quote
            </a>
          </div>
        </section>
      )}

      <section className="bg-cream-100 py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="text-center mb-12">
            <p className="reveal font-sans text-xs uppercase tracking-widest-2 text-sage-500 mb-6">
              Explore More
            </p>
            <h2 className="reveal reveal-delay-1 font-serif text-3xl font-light text-forest-800 sm:text-4xl">
              Other Services
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {otherServices.map((s) => (
              <Link
                key={s.id}
                to={`/services/${s.id}`}
                className="reveal group relative overflow-hidden rounded-xl bg-forest-800 h-40"
              >
                <img
                  src={s.image}
                  alt={s.alt}
                  className="absolute inset-0 h-full w-full object-cover opacity-50 transition-transform duration-1000 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-serif text-lg font-medium text-cream-50">{s.title}</h3>
                  <div className="mt-1 inline-flex items-center gap-1 font-sans text-xs text-cream-200/60">
                    Explore <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <QuoteForm />
      <Footer />
    </div>
  );
}
