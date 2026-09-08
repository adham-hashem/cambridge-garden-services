import { ExternalLink, Mail, MapPin, Phone, Star } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FACEBOOK_URL, GOOGLE_BUSINESS_URL } from '@/lib/seo';

type FooterLink = { label: string; hash?: string; to?: string };

const footerLinks: FooterLink[] = [
  { label: 'Services', to: '/services' },
  { label: 'Projects', hash: 'projects' },
  { label: 'About', to: '/about' },
  { label: 'Garden Journal', hash: 'journal' },
  { label: 'Request a Quote', hash: 'quote' },
];

const developerLinks = [
  { label: 'Developer WhatsApp 1', href: 'https://wa.me/201013989517' },
  { label: 'Developer WhatsApp 2', href: 'https://wa.me/201101733491' },
];

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (hash: string) => {
    navigate({ pathname: '/', hash });
    if (location.pathname === '/') {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative bg-forest-950 py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <img
                src="/WhatsApp_Image_2026-09-03_at_12.01.32_PM.jpeg"
                alt="Cambridge Garden Services logo"
                className="h-12 w-12 rounded-full object-cover ring-1 ring-cream-100/20"
              />
              <span className="font-serif text-lg font-medium text-cream-50">
                Cambridge Garden Services
              </span>
            </Link>
            <p className="mt-4 max-w-xs font-sans text-sm font-light leading-relaxed text-cream-200/50">
              Your garden. Your escape. Thoughtful garden care and complete outdoor
              transformations across Cambridgeshire.
            </p>
            <div className="mt-6 flex flex-col gap-3 min-[420px]:flex-row md:flex-col lg:flex-row">
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-cream-100/15 px-4 py-2.5 font-sans text-xs text-cream-100/75 transition-colors hover:border-sage-300/50 hover:text-cream-50"
              >
                Facebook
                <ExternalLink size={13} />
              </a>
              <a
                href={GOOGLE_BUSINESS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sage-300 px-4 py-2.5 font-sans text-xs font-medium text-forest-900 transition-colors hover:bg-sage-200"
              >
                Review us on Google
                <Star size={13} />
              </a>
            </div>
          </div>

          <div>
            <p className="mb-4 font-sans text-xs uppercase tracking-widest-2 text-sage-300">
              Get in Touch
            </p>
            <ul className="space-y-3 font-sans text-sm font-light text-cream-200/60">
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-sage-400" />
                07814 584 119
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-sage-400" />
                01223 864 703
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-sage-400" />
                info@cambridgegardenservices.co.uk
              </li>
              <li className="flex items-center gap-3">
                <MapPin size={16} className="text-sage-400" />
                Cambridge, UK
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 font-sans text-xs uppercase tracking-widest-2 text-sage-300">
              Explore
            </p>
            <ul className="space-y-2 font-sans text-sm font-light text-cream-200/60">
              {footerLinks.map((link) => (
                <li key={link.hash || link.to}>
                  <button
                    onClick={() => link.to ? navigate(link.to) : handleNavClick(link.hash!)}
                    className="transition-colors hover:text-cream-100"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-4 font-sans text-xs uppercase tracking-widest-2 text-sage-300">
              Developers
            </p>
            <div className="flex gap-3">
              {developerLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="group inline-flex h-12 w-12 items-center justify-center rounded-full border border-cream-100/10 bg-cream-50/5 text-cream-100/70 transition-all hover:border-[#25D366]/50 hover:bg-[#25D366]/10 hover:text-cream-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition-transform group-hover:scale-105">
                    <WhatsAppIcon />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-cream-200/10 pt-8 sm:flex-row">
          <p className="font-sans text-xs text-cream-200/40">
            © {new Date().getFullYear()} Cambridge Garden Services. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.89-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
