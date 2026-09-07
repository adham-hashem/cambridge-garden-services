export default function Intro() {
  return (
    <section className="relative bg-cream-100 py-24 lg:py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <p className="reveal font-sans text-xs uppercase tracking-widest-2 text-sage-500 mb-8">
          Step Into Your Garden
        </p>
        <h2 className="reveal reveal-delay-1 font-serif text-3xl font-light leading-tight text-forest-800 text-balance sm:text-4xl md:text-5xl">
          A garden is not a place.
          <span className="block italic mt-2">It is a feeling.</span>
        </h2>
        <div className="reveal reveal-delay-2 mx-auto mt-10 h-px w-16 bg-sage-400" />
        <p className="reveal reveal-delay-3 mx-auto mt-10 max-w-2xl font-sans text-lg font-light leading-relaxed text-forest-700/80">
          We have spent years learning how to coax that feeling from the earth. Not by imposing a design,
          but by listening to what a space wants to become — and then, with patience and craft, helping it get there.
        </p>
        <p className="reveal reveal-delay-4 mx-auto mt-6 max-w-2xl font-sans text-base font-light leading-relaxed text-forest-700/60">
          Every path, every border, every stone is placed with intention. The result is a garden that
          feels less like a project and more like a place you have always known.
        </p>
      </div>
    </section>
  );
}
