import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchClimateSection } from '@/lib/climate';
import type { ClimateSectionData, ClimateOption } from '@/types/climate';
import { ArrowRight, Leaf, Loader2 } from 'lucide-react';

export default function ClimateSection() {
  const [data, setData] = useState<ClimateSectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    fetchClimateSection().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <section className="flex items-center justify-center bg-forest-950 py-32">
        <Loader2 size={28} className="animate-spin text-sage-400" />
      </section>
    );
  }

  if (!data || data.options.length === 0) return null;

  const enabledOptions = data.options;
  const active: ClimateOption = enabledOptions[activeIndex] || enabledOptions[0];

  return (
    <section id="climate" className="relative overflow-hidden bg-forest-950 py-24 lg:py-32">
      {/* Ambient gradient backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(139,168,136,0.15),transparent_50%),radial-gradient(ellipse_at_80%_100%,rgba(41,75,58,0.4),transparent_50%)]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
        {/* Header */}
        <div className="mb-14 max-w-3xl">
          <div className="mb-6 flex items-center gap-3 text-sage-300">
            <Leaf size={18} strokeWidth={1.5} />
            <span className="font-sans text-xs uppercase tracking-[0.28em]">Climate-Ready Garden</span>
          </div>
          <h2 className="font-serif text-4xl font-light leading-tight text-cream-50 sm:text-5xl lg:text-6xl">
            {data.title}
          </h2>
          <p className="mt-6 max-w-2xl font-sans text-base font-light leading-relaxed text-cream-100/65 sm:text-lg">
            {data.description}
          </p>
        </div>

        {/* Option Selector */}
        <div className="mb-10 flex flex-wrap gap-3">
          {enabledOptions.map((option, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={option.id}
                onClick={() => setActiveIndex(i)}
                className={`flex items-center gap-2.5 rounded-full px-5 py-3 font-sans text-sm font-medium transition-all duration-500 ${
                  isActive
                    ? 'bg-cream-50 text-forest-800 shadow-lg shadow-black/20'
                    : 'border border-cream-100/15 bg-cream-50/5 text-cream-100/70 hover:border-cream-100/30 hover:bg-cream-50/10'
                }`}
              >
                <span className="text-lg">{option.icon}</span>
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Interactive Display */}
        <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-10">
          {/* Image */}
          <div className="relative h-[22rem] overflow-hidden rounded-2xl shadow-2xl shadow-black/30 sm:h-[26rem] lg:h-[32rem]">
            {enabledOptions.map((option, i) => (
              <img
                key={option.id}
                src={option.image}
                alt={option.image_alt}
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ${
                  i === activeIndex ? 'scale-100 opacity-100' : 'scale-110 opacity-0'
                }`}
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-forest-950/70 via-forest-950/10 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl drop-shadow-lg">{active.icon}</span>
                <span className="font-serif text-2xl font-light text-cream-50 drop-shadow-lg sm:text-3xl">
                  {active.label}
                </span>
              </div>
            </div>
          </div>

          {/* Solution Panel */}
          <div className="relative overflow-hidden rounded-2xl border border-cream-100/10 bg-cream-50/5 p-8 backdrop-blur-sm lg:p-10">
            {/* Progress indicator dots */}
            <div className="mb-8 flex gap-2">
              {enabledOptions.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === activeIndex ? 'w-10 bg-sage-300' : 'w-4 bg-cream-100/20'
                  }`}
                />
              ))}
            </div>

            {/* Solution content with transition */}
            <div key={active.id} className="animate-[fadeIn_0.5s_ease-out]">
              <h3 className="font-serif text-2xl font-light text-cream-50 sm:text-3xl">
                {active.solution_title}
              </h3>
              <p className="mt-5 font-sans text-base font-light leading-[1.8] text-cream-100/70">
                {active.solution_text}
              </p>
            </div>

            {/* Navigation arrows */}
            <div className="mt-8 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveIndex((p) => (p - 1 + enabledOptions.length) % enabledOptions.length)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-100/15 text-cream-100/60 transition-all hover:border-cream-100/30 hover:text-cream-50"
                  aria-label="Previous"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <button
                  onClick={() => setActiveIndex((p) => (p + 1) % enabledOptions.length)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-cream-100/15 text-cream-100/60 transition-all hover:border-cream-100/30 hover:text-cream-50"
                  aria-label="Next"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
              <span className="font-sans text-xs uppercase tracking-widest-2 text-cream-100/40">
                {activeIndex + 1} / {enabledOptions.length}
              </span>
            </div>
          </div>
        </div>

        {/* CTA to dedicated page */}
        <div className="mt-16 text-center">
          <p className="mx-auto max-w-3xl font-serif text-2xl font-light leading-relaxed text-cream-50/90 sm:text-3xl">
            {data.final_message}
          </p>
          <Link
            to="/climate-ready"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-sage-300 px-8 py-4 font-sans text-sm font-medium uppercase tracking-widest-2 text-forest-900 transition-all duration-300 hover:bg-sage-200 hover:shadow-xl hover:shadow-sage-500/20"
          >
            Explore Climate-Ready Gardens
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
