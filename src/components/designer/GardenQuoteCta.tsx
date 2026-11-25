import { Link } from 'react-router-dom';

export default function GardenQuoteCta({ reference }: { reference?: string }) {
  return (
    <section className="rounded-3xl bg-forest-800 px-8 py-12 text-center text-cream-100">
      <h2 className="mx-auto max-w-2xl font-serif text-3xl leading-tight sm:text-4xl">Love Your New Garden? Let Cambridge Garden Services Make It Real.</h2>
      <p className="mx-auto mt-4 max-w-xl text-cream-200/90">Turn your AI garden design into a real outdoor transformation with our professional garden services.</p>
      {reference && <p className="mt-3 text-sm text-cream-300">Mention your reference {reference} when you get in touch.</p>}
      <Link
        to={{ pathname: '/', hash: '#quote' }}
        className="mt-8 inline-block rounded-full bg-cream-100 px-8 py-3.5 text-sm font-medium tracking-wide text-forest-800 transition hover:bg-cream-200"
      >
        Get a Garden Quote
      </Link>
    </section>
  );
}
