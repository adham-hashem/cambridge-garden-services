import { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';

export default function Hero() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToQuote = () => {
    const el = document.getElementById('quote');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="top" className="relative h-screen min-h-[640px] w-full overflow-hidden">
      <div
        className="parallax-bg absolute inset-0"
        style={{ transform: `translateY(${scrollY * 0.4}px) scale(${1 + scrollY * 0.0003})` }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center animate-ken-burns"
          style={{
            backgroundImage: `url('https://images.pexels.com/photos/37123675/pexels-photo-37123675.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-950/40 via-forest-900/20 to-forest-950/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-cream-200/30 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex h-full -translate-y-5 flex-col items-center justify-center px-6 pt-20 text-center sm:translate-y-0 sm:pt-0">
        <h1
          aria-label="Cambridge Garden Services"
          className="opacity-0 animate-fade-up font-serif text-[clamp(3rem,15.5vw,4.25rem)] font-light leading-[1.02] text-cream-50 text-balance sm:text-6xl sm:leading-[1.1] md:text-7xl lg:text-8xl"
          style={{ animationDelay: '0.6s' }}
        >
          Cambridge Garden
          <span className="block italic font-medium">Services</span>
        </h1>

        <p
          className="opacity-0 animate-fade-up mt-5 font-serif text-xl italic text-cream-100/90 sm:mt-8 sm:text-2xl md:text-3xl lg:text-4xl"
          style={{ animationDelay: '1s' }}
        >
          Your garden. Your escape.
        </p>

        <p
          className="opacity-0 animate-fade-up mt-4 max-w-sm font-sans text-sm font-light leading-relaxed text-cream-200/80 sm:mt-6 sm:max-w-xl sm:text-base lg:text-lg"
          style={{ animationDelay: '1.3s' }}
        >
          From thoughtful garden care to complete outdoor transformations.
        </p>

        <div
          className="opacity-0 animate-fade-up mt-8 flex w-full max-w-xs flex-col items-stretch gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:justify-center sm:gap-5"
          style={{ animationDelay: '1.6s' }}
        >
          <a
            href="#services"
            className="group inline-flex items-center justify-center gap-2.5 rounded-full border border-cream-100/40 px-6 py-3.5 font-sans text-xs uppercase tracking-widest-2 text-cream-50 transition-all duration-500 hover:bg-cream-100 hover:text-forest-800 hover:border-cream-100 sm:px-8 sm:py-4 sm:text-sm"
          >
            Step Into The Garden
            <ArrowDown size={15} className="transition-transform duration-500 group-hover:translate-y-1 sm:h-4 sm:w-4" />
          </a>
          <button
            onClick={scrollToQuote}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-sage-300 px-6 py-3.5 font-sans text-xs font-medium uppercase tracking-widest-2 text-forest-900 transition-all duration-500 hover:bg-sage-200 hover:shadow-xl hover:shadow-sage-500/20 sm:px-8 sm:py-4 sm:text-sm"
          >
            Request a Free Quote
            <ArrowRight size={15} className="transition-transform duration-500 group-hover:translate-x-1 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 sm:bottom-8">
        <div className="flex flex-col items-center gap-2">
          <span className="font-sans text-[10px] uppercase tracking-widest-2 text-cream-200/60">Scroll</span>
          <div className="h-10 w-px bg-gradient-to-b from-cream-200/50 to-transparent sm:h-12" />
        </div>
      </div>
    </section>
  );
}
