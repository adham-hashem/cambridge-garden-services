import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { services } from '@/data/content';
import { fetchPublishedServices, type ServiceAdminItem } from '@/lib/services';
import { ArrowUpRight } from 'lucide-react';

export default function Services() {
  const [serviceItems, setServiceItems] = useState<ServiceAdminItem[]>(() =>
    services.map((service, index) => ({
      ...service,
      published: true,
      sort_order: index * 10,
      created_at: '',
      updated_at: '',
    }))
  );

  useEffect(() => {
    let cancelled = false;
    fetchPublishedServices().then((items) => {
      if (!cancelled) setServiceItems(items);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="services" className="relative bg-cream-50 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-16 text-center">
          <p className="reveal font-sans text-xs uppercase tracking-widest-2 text-sage-500 mb-6">
            What We Do
          </p>
          <h2 className="reveal reveal-delay-1 font-serif text-4xl font-light text-forest-800 sm:text-5xl md:text-6xl">
            Every Part of <span className="italic">the Garden</span>
          </h2>
          <p className="reveal reveal-delay-2 mx-auto mt-6 max-w-xl font-sans text-base font-light text-forest-700/60">
            From the first sketch to the final cut, each service is a different room in the garden —
            tended with the same care.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {serviceItems.map((service, i) => {
            const delayClass = `reveal-delay-${(i % 3) + 1}`;
            return (
              <Link
                key={service.id}
                to={`/services/${service.id}`}
                className={`reveal ${delayClass} group relative overflow-hidden rounded-2xl bg-forest-800 block transition-all duration-500 hover:shadow-2xl hover:shadow-forest-900/20`}
              >
                <div className="relative h-72 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.alt}
                    className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-forest-900/30 to-transparent" />
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6 lg:p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-2xl font-medium text-cream-50 lg:text-3xl">
                        {service.title}
                      </h3>
                      <p className="mt-2 font-sans text-sm font-light leading-relaxed text-cream-200/70 max-w-md">
                        {service.description}
                      </p>
                    </div>
                    <ArrowUpRight
                      size={20}
                      className="shrink-0 text-cream-200/60 transition-all duration-500 group-hover:translate-x-1 group-hover:-translate-y-1"
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
