import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

type NavLink = { label: string; hash?: string; to?: string };

const navLinks: NavLink[] = [
  { label: 'Services', to: '/services' },
  { label: 'Projects', hash: 'projects' },
  { label: 'About', to: '/about' },
  { label: 'Climate-Ready', to: '/climate-ready' },
  { label: 'Journal', hash: 'journal' },
  { label: 'Quote', hash: 'quote' },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (location.pathname !== '/' && !scrolled) setScrolled(true);
  }, [location.pathname, scrolled]);

  useEffect(() => {
    if (location.pathname !== '/' || !location.hash) return;
    const id = location.hash.slice(1);
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [location.hash, location.pathname]);

  const isHome = location.pathname === '/';
  const showSolid = scrolled || !isHome;

  const handleNavClick = (hash: string) => {
    setOpen(false);
    navigate({ pathname: '/', hash });
  };

  const handleLinkClick = (to: string) => {
    setOpen(false);
    navigate(to);
    window.scrollTo({ top: 0 });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
        showSolid
          ? 'bg-cream-100/95 backdrop-blur-md shadow-[0_1px_0_rgba(26,60,46,0.08)]'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Link to="/" className="flex items-center gap-3" aria-label="Cambridge Garden Services home">
          <img
            src="/WhatsApp_Image_2026-09-03_at_12.01.32_PM.jpeg"
            alt="Cambridge Garden Services logo"
            className="h-11 w-11 rounded-full object-cover ring-1 ring-forest-700/20"
          />
          <span className={`font-serif text-lg font-medium leading-none tracking-wide transition-colors duration-500 ${showSolid ? 'text-forest-800' : 'text-cream-100'}`}>
            Cambridge
            <span className="block text-xs uppercase tracking-widest-2 font-sans font-normal mt-0.5">
              Garden Services
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <li key={link.hash || link.to}>
              {link.to ? (
                <button
                  onClick={() => handleLinkClick(link.to!)}
                  className={`text-sm font-medium tracking-wide transition-colors duration-300 hover:text-sage-500 ${
                    showSolid ? 'text-forest-700' : 'text-cream-200'
                  }`}
                >
                  {link.label}
                </button>
              ) : (
                <button
                  onClick={() => handleNavClick(link.hash!)}
                  className={`text-sm font-medium tracking-wide transition-colors duration-300 hover:text-sage-500 ${
                    showSolid ? 'text-forest-700' : 'text-cream-200'
                  }`}
                >
                  {link.label}
                </button>
              )}
            </li>
          ))}
          <li>
            <button
              onClick={() => handleNavClick('quote')}
              className={`rounded-full px-5 py-2 text-sm font-medium tracking-wide transition-all duration-300 ${
                showSolid
                  ? 'bg-forest-700 text-cream-100 hover:bg-forest-800'
                  : 'bg-cream-100 text-forest-800 hover:bg-cream-200'
              }`}
            >
              Step Outside
            </button>
          </li>
        </ul>

        <button
          onClick={() => setOpen(!open)}
          className={`lg:hidden ${showSolid ? 'text-forest-800' : 'text-cream-100'}`}
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      <div
        className={`overflow-hidden transition-all duration-500 lg:hidden ${
          open ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <ul className="flex flex-col gap-1 bg-cream-100/98 backdrop-blur-md px-6 py-4">
          {navLinks.map((link) => (
            <li key={link.hash || link.to}>
              <button
                onClick={() => link.to ? handleLinkClick(link.to) : handleNavClick(link.hash!)}
                className="block w-full text-left py-3 text-forest-700 font-medium tracking-wide border-b border-forest-700/10 last:border-0"
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
