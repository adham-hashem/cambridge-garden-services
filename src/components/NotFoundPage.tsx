import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-cream-100">
      <Navigation />
      <main className="flex min-h-[70vh] items-center justify-center px-6 pb-20 pt-32">
        <div className="max-w-xl text-center">
          <p className="font-sans text-xs uppercase tracking-widest-2 text-sage-500">Page Not Found</p>
          <h1 className="mt-5 font-serif text-4xl font-light text-forest-800 sm:text-5xl">
            This path does not exist.
          </h1>
          <p className="mt-5 font-sans text-base font-light leading-relaxed text-forest-700/70">
            The page may have moved, or the address may be incorrect.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-forest-700 px-6 py-3 font-sans text-sm uppercase tracking-widest-2 text-cream-50 transition-all hover:bg-forest-800"
          >
            <ArrowLeft size={16} />
            Return Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
