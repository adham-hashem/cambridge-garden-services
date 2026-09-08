import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchArticleById, fetchPublishedArticles } from '@/lib/articles';
import type { Article } from '@/types/article';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { articleSeo, articleStructuredData, breadcrumbStructuredData } from '@/lib/seo';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchArticleById(id).then((data) => {
      setArticle(data);
      setLoading(false);
      if (data) {
        fetchPublishedArticles().then((all) => {
          setRelated(all.filter((a) => a.id !== id).slice(0, 2));
        });
      }
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-100">
        <div className="h-8 w-8 animate-pulse rounded-full bg-forest-300" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-cream-100">
        <SEO
          title="Article Not Found | Cambridge Garden Services"
          description="The requested Cambridge Garden Services article could not be found."
          noIndex
        />
        <Navigation />
        <div className="mx-auto max-w-2xl px-6 py-32 text-center">
          <h1 className="font-serif text-3xl font-light text-forest-800">Article Not Found</h1>
          <p className="mt-4 font-sans text-sm text-forest-500">This article may have been moved or deleted.</p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-forest-700 px-6 py-3 font-sans text-sm uppercase tracking-widest-2 text-cream-50 transition-all hover:bg-forest-800"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const seo = articleSeo(article);

  return (
    <div className="min-h-screen bg-cream-50">
      <SEO
        title={seo.title}
        description={seo.description}
        path={seo.path}
        image={seo.image}
        type="article"
        structuredData={[
          articleStructuredData(article),
          breadcrumbStructuredData([
            { name: 'Home', path: '/' },
            { name: 'Garden Journal', path: '/#journal' },
            { name: article.title, path: seo.path },
          ]),
        ]}
      />
      <Navigation />

      {/* Hero Image */}
      <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
        <img
          src={article.cover_image}
          alt={article.cover_alt}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-950/30 via-forest-950/20 to-cream-50" />
      </div>

      {/* Article Content */}
      <article className="relative z-10 mx-auto -mt-20 max-w-3xl px-6 pb-24">
        <div className="rounded-3xl bg-cream-50 p-8 shadow-xl lg:p-12">
          {/* Category + Date */}
          <div className="mb-6 flex items-center gap-4">
            <span className="rounded-full bg-forest-100 px-4 py-1.5 font-sans text-xs uppercase tracking-widest-2 text-forest-700">
              {article.category}
            </span>
            <span className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-widest-2 text-sage-500">
              <Calendar size={12} />
              {article.date}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl font-light text-forest-800 sm:text-4xl md:text-5xl">
            {article.title}
          </h1>

          {/* Excerpt */}
          <p className="mt-6 font-sans text-lg font-light leading-relaxed text-forest-700/70">
            {article.excerpt}
          </p>

          {/* Content */}
          <div className="mt-8 space-y-6">
            {article.content.split('\n').map((para, i) => (
              para.trim() ? (
                <p key={i} className="font-sans text-base font-light leading-relaxed text-forest-800">
                  {para}
                </p>
              ) : null
            ))}
          </div>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-sage-200 pt-6">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-sage-100 px-3 py-1 font-sans text-xs text-forest-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Back link */}
          <div className="mt-8">
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-sans text-sm text-forest-600 transition-colors hover:text-forest-800"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      {related.length > 0 && (
        <section className="bg-cream-100 py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <h2 className="mb-10 font-serif text-3xl font-light text-forest-800">
              More from <span className="italic">the Garden</span>
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              {related.map((entry) => (
                <Link
                  key={entry.id}
                  to={`/journal/${entry.id}`}
                  className="group cursor-pointer overflow-hidden rounded-2xl bg-cream-50 transition-all duration-500 hover:shadow-xl hover:shadow-forest-900/10"
                >
                  <div className="relative h-56 overflow-hidden">
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
                  <div className="p-6">
                    <p className="font-sans text-xs uppercase tracking-widest text-sage-500 mb-2">{entry.date}</p>
                    <h3 className="font-serif text-xl font-medium text-forest-800 group-hover:text-forest-900">{entry.title}</h3>
                    <p className="mt-3 font-sans text-sm font-light leading-relaxed text-forest-700/70">{entry.excerpt}</p>
                    <div className="mt-4 inline-flex items-center gap-2 font-sans text-sm font-medium text-forest-700 transition-colors group-hover:text-sage-500">
                      Read more
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
