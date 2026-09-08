import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Loader2, MapPin } from 'lucide-react';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import SEO from '@/components/SEO';
import QuoteForm from '@/components/QuoteForm';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { fetchPublishedProjectById } from '@/lib/projects';
import { fetchPublishedServices, type ServiceAdminItem } from '@/lib/services';
import { breadcrumbStructuredData, SITE_NAME } from '@/lib/seo';
import type { Project } from '@/types/project';

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [service, setService] = useState<ServiceAdminItem | null>(null);
  const [loading, setLoading] = useState(true);

  useScrollReveal();

  useEffect(() => {
    let cancelled = false;
    window.scrollTo(0, 0);

    async function load() {
      if (!projectId) {
        setLoading(false);
        return;
      }

      const [projectData, services] = await Promise.all([
        fetchPublishedProjectById(projectId),
        fetchPublishedServices(),
      ]);

      if (cancelled) return;
      setProject(projectData);
      setService(projectData ? services.find((item) => item.id === projectData.service_id) || null : null);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-100">
        <SEO title={`Project | ${SITE_NAME}`} description="Cambridge Garden Services project." noIndex />
        <Loader2 size={32} className="animate-spin text-forest-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-cream-100">
        <SEO title={`Project Not Found | ${SITE_NAME}`} description="The requested project could not be found." noIndex />
        <Navigation />
        <main className="flex min-h-screen items-center justify-center px-6 pt-20 text-center">
          <div>
            <h1 className="font-serif text-3xl text-forest-800">Project not found</h1>
            <Link to="/services" className="mt-5 inline-flex items-center gap-2 font-sans text-sm text-sage-600 hover:text-forest-800">
              <ArrowLeft size={14} />
              View services
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <SEO
        title={`${project.title} | ${SITE_NAME}`}
        description={project.description}
        path={`/projects/${project.id}`}
        image={project.after_image}
        structuredData={[
          breadcrumbStructuredData([
            { name: 'Home', path: '/' },
            { name: 'Services', path: '/services' },
            ...(service ? [{ name: service.title, path: `/services/${service.id}` }] : []),
            { name: project.title, path: `/projects/${project.id}` },
          ]),
        ]}
      />
      <Navigation />
      <main>
        <section className="bg-forest-900 px-6 pb-20 pt-32 lg:px-10 lg:pb-28 lg:pt-40">
          <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
            <div className="reveal">
              <BeforeAfterSlider
                before={project.before_image}
                after={project.after_image}
                beforeAlt={project.before_alt}
                afterAlt={project.after_alt}
              />
            </div>
            <div className="reveal reveal-delay-1">
              <Link
                to={service ? `/services/${service.id}` : '/services'}
                className="mb-8 inline-flex items-center gap-2 font-sans text-xs uppercase tracking-widest-2 text-sage-300 transition-colors hover:text-cream-100"
              >
                <ArrowLeft size={14} />
                {service ? service.title : 'All Services'}
              </Link>
              <div className="mb-5 flex items-center gap-2 font-sans text-xs uppercase tracking-widest-2 text-cream-200/60">
                <MapPin size={14} />
                {project.location}
              </div>
              <h1 className="font-serif text-4xl font-light leading-tight text-cream-50 sm:text-5xl md:text-6xl">
                {project.title}
              </h1>
              <p className="mt-6 font-sans text-base font-light leading-relaxed text-cream-200/70 sm:text-lg">
                {project.description}
              </p>
              <a
                href="#quote"
                className="mt-10 inline-flex items-center gap-2 rounded-full bg-cream-100 px-8 py-4 font-sans text-sm uppercase tracking-widest-2 text-forest-800 transition-all hover:bg-cream-200"
              >
                <ClipboardList size={16} />
                Get a Quote
              </a>
            </div>
          </div>
        </section>

        <QuoteForm />
      </main>
      <Footer />
    </div>
  );
}
