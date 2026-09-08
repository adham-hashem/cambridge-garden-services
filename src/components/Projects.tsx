import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { services } from '@/data/content';
import { fetchPublishedServices, type ServiceAdminItem } from '@/lib/services';
import { fetchPublishedProjects } from '@/lib/projects';
import type { Project } from '@/types/project';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import { Eye, ClipboardList, Loader2, Plus } from 'lucide-react';

const PAGE_SIZE = 3;

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [serviceItems, setServiceItems] = useState<ServiceAdminItem[]>(() =>
    services.map((service, index) => ({
      ...service,
      published: true,
      sort_order: index * 10,
      created_at: '',
      updated_at: '',
    }))
  );

  const loadProjects = useCallback(async (pageNum: number, replace: boolean) => {
    if (replace) setLoading(true);
    else setLoadingMore(true);

    const { projects: newProjects, hasMore: more } = await fetchPublishedProjects(pageNum, undefined, PAGE_SIZE);

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
    loadProjects(0, true);
  }, [loadProjects]);

  useEffect(() => {
    fetchPublishedServices().then(setServiceItems);
  }, []);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadProjects(nextPage, false);
  };

  return (
    <section id="projects" className="relative bg-forest-900 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-16 text-center">
          <p className="reveal font-sans text-xs uppercase tracking-widest-2 text-sage-300 mb-6">
            Real Transformations
          </p>
          <h2 className="reveal reveal-delay-1 font-serif text-4xl font-light text-cream-50 sm:text-5xl md:text-6xl">
            From Ground <span className="italic">to Garden</span>
          </h2>
          <p className="reveal reveal-delay-2 mx-auto mt-6 max-w-xl font-sans text-base font-light text-cream-200/60">
            Drag the slider to walk through each transformation. Every project begins with earth
            and ends with a place you will not want to leave.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-sage-300" />
          </div>
        ) : projects.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-sans text-sm text-cream-200/40">Projects coming soon.</p>
          </div>
        ) : (
          <>
            <div className="space-y-20">
              {projects.map((project, i) => {
                const service = serviceItems.find((s) => s.id === project.service_id);
                return (
                  <div
                    key={project.id}
                    className={`reveal grid items-center gap-8 lg:gap-16 lg:grid-cols-2 ${
                      i % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''
                    }`}
                  >
                    <div className="reveal">
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
                        {service && (
                          <Link
                            to={`/services/${service.id}`}
                            className="inline-flex items-center gap-2 rounded-full bg-cream-100 px-6 py-3 font-sans text-sm uppercase tracking-widest-2 text-forest-800 transition-all hover:bg-cream-200"
                          >
                            <Eye size={16} />
                            View {service.title}
                          </Link>
                        )}
                        <Link
                          to={`/projects/${project.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-cream-100/30 px-6 py-3 font-sans text-sm uppercase tracking-widest-2 text-cream-50 transition-all hover:bg-cream-100 hover:text-forest-800"
                        >
                          <Eye size={16} />
                          View Project
                        </Link>
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
                );
              })}
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
          </>
        )}
      </div>
    </section>
  );
}
