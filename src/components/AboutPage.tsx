import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Sparkles,
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { localBusinessStructuredData, pageSeo } from '@/lib/seo';

const contactDetails = [
  { icon: MapPin, label: 'Based in', value: 'Cambridge, UK' },
  { icon: Phone, label: 'Mobile', value: '07814 584 119', href: 'tel:07814584119' },
  { icon: Phone, label: 'Phone', value: '01223 864 703', href: 'tel:01223864703' },
  { icon: Mail, label: 'Email', value: 'info@cambridgegardenservices.co.uk', href: 'mailto:info@cambridgegardenservices.co.uk' },
  { icon: MapPin, label: 'Serving', value: 'Cambridge and surrounding villages' },
  { icon: Clock3, label: 'Open', value: 'Monday–Sunday, 8:00 AM–8:00 PM' },
];

const WHATSAPP_NUMBER = '447814584119';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-cream-100">
      <SEO
        title={pageSeo.about.title}
        description={pageSeo.about.description}
        path="/about"
        structuredData={localBusinessStructuredData()}
      />
      <Navigation />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-forest-950 pb-20 pt-40 sm:pb-28 sm:pt-48">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(139,168,136,0.24),transparent_38%),linear-gradient(135deg,#102c22_0%,#1a3c2e_58%,#294b3a_100%)]" />
          <div className="absolute -right-32 top-24 h-80 w-80 rounded-full border border-cream-100/10 sm:h-[30rem] sm:w-[30rem]" />
          <div className="absolute -right-20 top-36 h-64 w-64 rounded-full border border-cream-100/10 sm:h-96 sm:w-96" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
            <Link
              to="/"
              className="mb-12 inline-flex items-center gap-2 font-sans text-sm text-cream-100/70 transition-colors hover:text-cream-50"
            >
              <ArrowLeft size={16} />
              Back to home
            </Link>
            <div className="max-w-4xl">
              <p className="mb-6 font-sans text-xs uppercase tracking-[0.28em] text-sage-300">About Cambridge Garden Services</p>
              <h1 className="font-serif text-5xl font-light leading-[1.08] text-cream-50 sm:text-6xl lg:text-8xl">
                Gardens made for <span className="italic text-sage-200">living.</span>
              </h1>
              <p className="mt-8 max-w-2xl font-sans text-base font-light leading-relaxed text-cream-100/70 sm:text-lg">
                A trusted local garden company creating thoughtful, beautifully finished outdoor spaces across Cambridge and its surrounding villages.
              </p>
            </div>
          </div>
        </section>

        {/* 1. Who We Are */}
        <section className="bg-cream-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mb-14 max-w-2xl">
              <p className="mb-5 font-sans text-xs uppercase tracking-[0.28em] text-sage-500">Who We Are</p>
              <h2 className="font-serif text-4xl font-light leading-tight text-forest-800 sm:text-5xl">
                Professional care, <span className="italic">personal attention.</span>
              </h2>
            </div>

            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">
              {/* Company Image */}
              <div className="relative overflow-hidden rounded-2xl shadow-lg shadow-forest-900/10">
                <img
                  src="/WhatsApp_Image_2026-09-03_at_12.01.32_PM.jpeg"
                  alt="Cambridge Garden Services at work in a Cambridge garden"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/20 to-transparent" />
              </div>

              {/* Description */}
              <div className="space-y-7 font-sans text-lg font-light leading-[1.8] text-forest-700/80 sm:text-xl">
                <p>
                  Cambridge Garden Services is a well established garden company based in Cambridge with a great reputation built up over many years. We pride ourselves on our commitment to provide a professional and speedy service whilst making sure we maintain the highest quality of work.
                </p>
                <p>
                  We believe that the garden needs to be not only an extension of the house, an ‘outdoor room’, a space whose potential is fully realised, but also a place that offers a relaxing and inspirational environment.
                </p>
                <div className="flex items-center gap-3 pt-2 text-sage-500">
                  <Sparkles size={18} />
                  <span className="font-sans text-xs uppercase tracking-widest-2">Rooted in Cambridge</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Awards & Recognition */}
        <section className="overflow-hidden bg-forest-950 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mb-14 max-w-2xl">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-sage-300/40 bg-sage-300/10 text-sage-200">
                <Award size={27} strokeWidth={1.4} />
              </div>
              <p className="mb-5 font-sans text-xs uppercase tracking-[0.28em] text-sage-300">Awards & Recognition</p>
              <h2 className="font-serif text-4xl font-light leading-tight text-cream-50 sm:text-5xl">
                Quality that <span className="italic text-sage-200">speaks for itself.</span>
              </h2>
              <p className="mt-7 max-w-md font-sans text-base font-light leading-relaxed text-cream-100/65">
                Our work is built on reliability, care, and an uncompromising eye for detail. We are proud to be recognised for the quality and reputation we work hard to deliver in every garden.
              </p>
            </div>

            <div className="relative mx-auto max-w-3xl rounded-2xl bg-cream-50/5 p-4 shadow-2xl shadow-black/30 sm:p-8">
              <div className="overflow-hidden rounded-xl bg-black">
                <img
                  src="/quality_image.webp"
                  alt="Quality Business Awards 2024 recognition for Cambridge Garden Services Ltd"
                  className="h-auto w-full object-contain"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <p className="mt-5 text-center font-sans text-xs uppercase tracking-widest-2 text-cream-100/45">
                Quality Business Awards · 2024
              </p>
            </div>
          </div>
        </section>

        {/* 3. Contact Information */}
        <section className="bg-cream-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mb-14 max-w-2xl">
              <p className="mb-5 font-sans text-xs uppercase tracking-[0.28em] text-sage-500">Let’s talk gardens</p>
              <h2 className="font-serif text-4xl font-light text-forest-800 sm:text-5xl">
                Here when you <span className="italic">need us.</span>
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contactDetails.map(({ icon: Icon, label, value, href }) => {
                const content = (
                  <>
                    <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-full bg-sage-100 text-forest-700 transition-colors group-hover:bg-forest-700 group-hover:text-cream-50">
                      <Icon size={19} strokeWidth={1.5} />
                    </div>
                    <p className="font-sans text-[10px] uppercase tracking-widest-2 text-sage-500">{label}</p>
                    <p className="mt-2 break-words font-sans text-sm leading-relaxed text-forest-800">{value}</p>
                  </>
                );
                return href ? (
                  <a key={label} href={href} className="group rounded-2xl border border-sage-200/70 bg-cream-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-sage-300 hover:shadow-lg hover:shadow-forest-900/5">
                    {content}
                  </a>
                ) : (
                  <div key={label} className="group rounded-2xl border border-sage-200/70 bg-cream-50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-sage-300 hover:shadow-lg hover:shadow-forest-900/5">
                    {content}
                  </div>
                );
              })}
            </div>

            <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl bg-forest-700/5 px-8 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <p className="font-serif text-2xl font-light text-forest-800">Ready to make more of your outdoor space?</p>
                <p className="mt-2 font-sans text-sm text-forest-600">Request a quote or message us on WhatsApp — we reply quickly.</p>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/?quote"
                  className="inline-flex items-center gap-2 rounded-full bg-forest-700 px-7 py-3.5 font-sans text-sm font-medium text-cream-50 transition-all hover:bg-forest-800"
                >
                  Request a quote
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMBER}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="group fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-black/20 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-black/30 sm:h-16 sm:w-16"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-7 w-7 text-white sm:h-8 sm:w-8"
          aria-hidden="true"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.89-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
        <span className="absolute right-full mr-3 hidden whitespace-nowrap rounded-full bg-forest-800 px-4 py-2 font-sans text-xs text-cream-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 lg:block">
          Chat with us
        </span>
      </a>
    </div>
  );
}
