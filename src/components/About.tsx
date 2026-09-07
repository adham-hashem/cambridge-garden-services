import { useEffect, useState } from 'react';

export default function About() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.getElementById('about');
      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          setScrollY(window.scrollY - el.offsetTop + window.innerHeight * 0.5);
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section id="about" className="relative overflow-hidden bg-cream-100 py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="reveal font-sans text-xs uppercase tracking-widest-2 text-sage-500 mb-6">
              Our Story
            </p>
            <h2 className="reveal reveal-delay-1 font-serif text-4xl font-light leading-tight text-forest-800 sm:text-5xl">
              Rooted in <span className="italic">Cambridge</span>,
              <span className="block">grown by craft.</span>
            </h2>
            <div className="reveal reveal-delay-2 mt-8 space-y-6 font-sans text-base font-light leading-relaxed text-forest-700/80">
              <p>
                Cambridge Garden Services was born from a simple belief: that the gardens around us
                shape the way we live. For over fifteen years, we have worked alongside homeowners,
                schools, and businesses across Cambridgeshire — bringing care, craft, and a deep
                local knowledge to every project.
              </p>
              <p>
                We are not a franchise or a formula. Every garden is different, and so is every plan
                we make for it. What stays constant is our commitment to quality, reliability, and
                the kind of quiet attention that shows in the finished work.
              </p>
            </div>

            <div className="reveal reveal-delay-3 mt-10 grid grid-cols-3 gap-6">
              {[
                { number: '15+', label: 'Years' },
                { number: '300+', label: 'Projects' },
                { number: '100%', label: 'Local' },
              ].map((stat) => (
                <div key={stat.label} className="border-l border-sage-400/40 pl-4">
                  <p className="font-serif text-3xl font-medium text-forest-800">{stat.number}</p>
                  <p className="mt-1 font-sans text-xs uppercase tracking-widest text-sage-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-[28rem] lg:h-[36rem] overflow-hidden rounded-2xl">
            <div
              className="parallax-bg absolute inset-0"
              style={{ transform: `translateY(${scrollY * 0.1}px)` }}
            >
              <img
                src="https://images.pexels.com/photos/37441090/pexels-photo-37441090.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Garden archway leading to a brick English cottage"
                className="h-full w-full scale-110 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-900/30 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
