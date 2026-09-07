import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPublishedArticles } from '@/lib/articles';
import type { Article } from '@/types/article';
import { ArrowRight } from 'lucide-react';

export default function Journal() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublishedArticles().then((data) => {
      setArticles(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <section id="journal" className="relative bg-cream-50 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="mb-16">
            <p className="font-sans text-xs uppercase tracking-widest-2 text-sage-500 mb-6">Garden Journal</p>
            <h2 className="font-serif text-4xl font-light text-forest-800 sm:text-5xl md:text-6xl">
              Notes from <span className="italic">the Garden</span>
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-cream-100">
                <div className="h-64 rounded-t-2xl bg-sage-200/40" />
                <div className="space-y-3 p-8">
                  <div className="h-4 w-24 rounded bg-sage-200/40" />
                  <div className="h-6 w-3/4 rounded bg-sage-200/40" />
                  <div className="h-4 w-full rounded bg-sage-200/30" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  return (
    <section id="journal" className="relative bg-cream-50 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="reveal font-sans text-xs uppercase tracking-widest-2 text-sage-500 mb-6">
              Garden Journal
            </p>
            <h2 className="reveal reveal-delay-1 font-serif text-4xl font-light text-forest-800 sm:text-5xl md:text-6xl">
              Notes from <span className="italic">the Garden</span>
            </h2>
          </div>
          <p className="reveal reveal-delay-2 max-w-sm font-sans text-base font-light text-forest-700/60">
            Seasonal care, design ideas, and stories from the garden — written by the hands
            that tend it.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {articles.map((entry, i) => (
            <Link
              key={entry.id}
              to={`/journal/${entry.id}`}
              className={`reveal reveal-delay-${(i % 2) + 1} group cursor-pointer overflow-hidden rounded-2xl bg-cream-100 transition-all duration-500 hover:shadow-xl hover:shadow-forest-900/10`}
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={entry.cover_image}
                  alt={entry.cover_alt}
                  className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute top-4 left-4 rounded-full bg-cream-50/90 px-3 py-1 font-sans text-[10px] uppercase tracking-widest-2 text-forest-700">
                  {entry.category}
                </div>
              </div>
              <div className="p-8">
                <p className="font-sans text-xs uppercase tracking-widest text-sage-500 mb-3">
                  {entry.date}
                </p>
                <h3 className="font-serif text-2xl font-medium text-forest-800 group-hover:text-forest-900">
                  {entry.title}
                </h3>
                <p className="mt-4 font-sans text-base font-light leading-relaxed text-forest-700/70">
                  {entry.excerpt}
                </p>
                <div className="mt-6 inline-flex items-center gap-2 font-sans text-sm font-medium text-forest-700 transition-colors group-hover:text-sage-500">
                  Read more
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
