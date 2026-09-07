import { Phone, Mail, MapPin } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

type FooterLink = { label: string; hash?: string; to?: string };

const footerLinks: FooterLink[] = [
  { label: 'Services', hash: 'services' },
  { label: 'Projects', hash: 'projects' },
  { label: 'About', to: '/about' },
  { label: 'Garden Journal', hash: 'journal' },
  { label: 'Request a Quote', hash: 'quote' },
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
        <div className="grid gap-12 md:grid-cols-3">
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
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-cream-200/10 pt-8 sm:flex-row">
          <p className="font-sans text-xs text-cream-200/40">
            © {new Date().getFullYear()} Cambridge Garden Services. All rights reserved.
          </p>
          <p className="font-sans text-xs text-cream-200/40">
            Cambridge · England
          </p>
        </div>
      </div>
    </footer>
  );
}
