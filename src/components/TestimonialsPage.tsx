import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SEO from '@/components/SEO';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import {
  fetchPublishedTestimonials,
  submitCustomerTestimonial,
  uploadTestimonialPhoto,
} from '@/lib/testimonials';
import type { Testimonial } from '@/types/testimonial';
import {
  Star,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  MessageSquareHeart,
  Quote,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Filter State
  const [selectedRatingFilter, setSelectedRatingFilter] = useState<number | 'all'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'rating'>('recent');

  useScrollReveal();

  useEffect(() => {
    window.scrollTo(0, 0);
    loadTestimonials();
  }, []);

  async function loadTestimonials() {
    setLoading(true);
    try {
      const data = await fetchPublishedTestimonials();
      setTestimonials(data);
    } catch (err) {
      console.error('Failed to load testimonials:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Please choose a valid image file (JPEG, PNG, WebP, or GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Image size must be under 10 MB.');
      return;
    }

    setErrorMessage(null);
    setPhotoFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter your name.');
      return;
    }
    if (!comment.trim()) {
      setErrorMessage('Please share your review or comments.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      let uploadedPhotoUrl = '';
      if (photoFile) {
        setPhotoUploading(true);
        uploadedPhotoUrl = await uploadTestimonialPhoto(photoFile);
        setPhotoUploading(false);
      }

      const newTestimonial = await submitCustomerTestimonial({
        name: name.trim(),
        rating,
        comment: comment.trim(),
        customer_photo: uploadedPhotoUrl,
        customer_photo_alt: `${name.trim()}'s garden project review photo`,
        published: true,
      });

      // Instantly prepend to the list so it appears immediately!
      setTestimonials((prev) => [newTestimonial, ...prev.filter((t) => t.id !== newTestimonial.id)]);

      // Reset form
      setName('');
      setRating(5);
      setComment('');
      setPhotoFile(null);
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setFormOpen(false);
      }, 3500);
    } catch (err: unknown) {
      console.error('Testimonial submission failed:', err);
      const msg = err instanceof Error ? err.message : 'Could not submit testimonial. Please try again.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
      setPhotoUploading(false);
    }
  };

  // Stats calculation
  const totalReviews = testimonials.length;
  const avgRating = totalReviews > 0
    ? (testimonials.reduce((acc, t) => acc + t.rating, 0) / totalReviews).toFixed(1)
    : '5.0';

  // Filtered and sorted testimonials
  const filtered = testimonials.filter((item) => {
    if (selectedRatingFilter === 'all') return true;
    return item.rating === selectedRatingFilter;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'rating') {
      return b.rating - a.rating || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const ratingDescriptions: Record<number, string> = {
    5: 'Exceptional — Highly Recommend',
    4: 'Great — Very Pleased',
    3: 'Good — Satisfactory',
    2: 'Fair — Needs Improvement',
    1: 'Poor',
  };

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col">
      <SEO
        title="Client Testimonials | Cambridge Garden Services"
        description="Read real client reviews and testimonials for Cambridge Garden Services. Discover our craftsmanship across landscaping, patios, fencing, and garden design."
      />
      <Navigation />

      <main className="flex-grow pt-24">
        {/* Hero Section */}
        <section className="relative bg-forest-900 py-20 lg:py-28 text-cream-50 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-forest-800/40 via-transparent to-transparent pointer-events-none" />
          <div className="mx-auto max-w-5xl px-6 text-center relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-sage-300/30 bg-forest-800/50 px-4 py-1.5 font-sans text-xs uppercase tracking-widest-2 text-sage-300 mb-6 backdrop-blur-sm">
              <Sparkles size={13} />
              Real Client Stories
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-cream-50 tracking-tight leading-tight">
              Words From Our <span className="italic">Garden Clients</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl font-sans text-base sm:text-lg font-light text-cream-200/70 leading-relaxed">
              Every garden transformation is personal. Here is what homeowners across Cambridgeshire have to say about our care, craft, and attention to detail.
            </p>

            {/* Rating Summary Bar */}
            {totalReviews > 0 && (
              <div className="mt-10 mx-auto max-w-md rounded-2xl bg-forest-800/60 border border-cream-100/10 p-6 backdrop-blur-md flex items-center justify-around">
                <div>
                  <div className="font-serif text-4xl font-light text-cream-50">{avgRating}</div>
                  <div className="mt-1 flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={16}
                        className={star <= Math.round(Number(avgRating)) ? 'fill-amber-400' : 'text-cream-100/20'}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-cream-200/60 font-sans">Overall Rating</p>
                </div>
                <div className="h-10 w-px bg-cream-100/10" />
                <div>
                  <div className="font-serif text-4xl font-light text-cream-50">{totalReviews}</div>
                  <p className="mt-1 text-xs text-cream-200/60 font-sans">Verified Reviews</p>
                  <p className="mt-1 text-[11px] text-sage-300 font-sans">100% Genuine</p>
                </div>
              </div>
            )}

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => {
                  setFormOpen(!formOpen);
                  if (!formOpen) {
                    setTimeout(() => {
                      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }
                }}
                className="rounded-full bg-cream-50 px-8 py-3.5 font-sans text-xs uppercase tracking-widest-2 text-forest-900 font-medium transition-all hover:bg-cream-200 hover:shadow-lg flex items-center gap-2"
              >
                <MessageSquareHeart size={16} />
                {formOpen ? 'Close Review Form' : 'Write a Testimonial'}
              </button>
            </div>
          </div>
        </section>

        {/* Interactive Testimonial Submission Form Section */}
        {formOpen && (
          <section ref={formRef} className="py-12 bg-cream-200/60 border-b border-sage-200 animate-fade-in">
            <div className="mx-auto max-w-2xl px-6">
              <div className="rounded-3xl bg-cream-50 p-6 sm:p-10 shadow-xl border border-sage-200">
                <div className="flex items-center justify-between pb-6 border-b border-sage-200 mb-6">
                  <div>
                    <h2 className="font-serif text-2xl sm:text-3xl font-light text-forest-900">
                      Share Your Experience
                    </h2>
                    <p className="font-sans text-xs text-forest-600/70 mt-1">
                      Your feedback will appear immediately on our website.
                    </p>
                  </div>
                  <button
                    onClick={() => setFormOpen(false)}
                    className="p-2 text-forest-600 hover:text-forest-900 rounded-full hover:bg-cream-100 transition-colors"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                {submitSuccess ? (
                  <div className="py-8 text-center animate-fade-in">
                    <CheckCircle2 size={48} className="mx-auto text-forest-600 mb-4" />
                    <h3 className="font-serif text-2xl font-light text-forest-900">Thank You!</h3>
                    <p className="mt-2 text-sm text-forest-700/80 font-sans max-w-sm mx-auto">
                      Your testimonial has been published and is now live on our Testimonials page.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {errorMessage && (
                      <div className="flex items-center gap-2 rounded-xl bg-earth-100 p-3.5 text-xs text-earth-800">
                        <AlertCircle size={16} className="shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Name */}
                    <div>
                      <label className="block font-sans text-xs uppercase tracking-widest-2 text-forest-700 mb-2">
                        Your Name <span className="text-earth-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Sarah & Mark Thompson"
                        required
                        className="w-full rounded-xl border border-sage-300/50 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-900 placeholder-forest-700/40 outline-none transition-colors focus:border-forest-600 focus:bg-cream-50"
                      />
                    </div>

                    {/* Star Rating */}
                    <div>
                      <label className="block font-sans text-xs uppercase tracking-widest-2 text-forest-700 mb-2">
                        Rating <span className="text-earth-600">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5" onMouseLeave={() => setHoverRating(0)}>
                          {[1, 2, 3, 4, 5].map((star) => {
                            const active = hoverRating ? star <= hoverRating : star <= rating;
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoverRating(star)}
                                className="p-1 rounded transition-transform hover:scale-110 focus:outline-none"
                                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                              >
                                <Star
                                  size={28}
                                  className={active ? 'fill-amber-400 text-amber-400' : 'text-sage-300 hover:text-amber-300'}
                                />
                              </button>
                            );
                          })}
                        </div>
                        <span className="text-xs font-sans text-forest-700 font-medium ml-2">
                          {ratingDescriptions[hoverRating || rating]}
                        </span>
                      </div>
                    </div>

                    {/* Comment */}
                    <div>
                      <label className="block font-sans text-xs uppercase tracking-widest-2 text-forest-700 mb-2">
                        Your Comments & Feedback <span className="text-earth-600">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Tell us about the project we completed for you, our team's work, and the final results..."
                        required
                        className="w-full resize-none rounded-xl border border-sage-300/50 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-900 placeholder-forest-700/40 outline-none transition-colors focus:border-forest-600 focus:bg-cream-50"
                      />
                    </div>

                    {/* Direct File Upload for Customer Photo (NO URLs) */}
                    <div>
                      <label className="block font-sans text-xs uppercase tracking-widest-2 text-forest-700 mb-2">
                        Optional Customer Photo
                      </label>
                      <p className="text-xs text-forest-600/70 mb-3">
                        Upload a photo of your garden or yourself (direct file upload from your device only, max 10MB).
                      </p>

                      {photoPreview ? (
                        <div className="relative inline-block rounded-2xl overflow-hidden border border-sage-300 shadow-sm bg-cream-100">
                          <img
                            src={photoPreview}
                            alt="Selected upload preview"
                            className="h-32 w-32 object-cover"
                          />
                          <button
                            type="button"
                            onClick={removePhoto}
                            className="absolute top-1.5 right-1.5 rounded-full bg-forest-900/80 p-1 text-cream-50 hover:bg-forest-900 transition-colors"
                            aria-label="Remove photo"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-sage-300/70 bg-cream-100/40 p-6 text-center cursor-pointer hover:border-forest-600 hover:bg-cream-100/80 transition-all"
                        >
                          <Upload size={24} className="text-forest-600 mb-2" />
                          <p className="font-sans text-xs font-medium text-forest-800">
                            Choose an image file from your device
                          </p>
                          <p className="font-sans text-[11px] text-forest-500 mt-1">
                            PNG, JPG, WebP or GIF up to 10MB
                          </p>
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submitting || photoUploading}
                        className="w-full rounded-full bg-forest-800 py-3.5 font-sans text-xs uppercase tracking-widest-2 text-cream-50 font-medium transition-all hover:bg-forest-900 hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submitting || photoUploading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Publishing Review...
                          </>
                        ) : (
                          'Submit Testimonial'
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Testimonials List Section */}
        <section className="py-16 lg:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-10">
            {/* Filters & Sorting */}
            {totalReviews > 0 && (
              <div className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sage-200/80 pb-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-sans uppercase tracking-widest text-forest-600 mr-2 flex items-center gap-1.5">
                    <SlidersHorizontal size={14} /> Filter:
                  </span>
                  {(['all', 5, 4, 3, 2, 1] as const).map((filterVal) => {
                    const isActive = selectedRatingFilter === filterVal;
                    return (
                      <button
                        key={String(filterVal)}
                        onClick={() => setSelectedRatingFilter(filterVal)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-sans transition-all ${
                          isActive
                            ? 'bg-forest-800 text-cream-50'
                            : 'bg-cream-50 text-forest-700 hover:bg-cream-200 border border-sage-200'
                        }`}
                      >
                        {filterVal === 'all' ? 'All Reviews' : `${filterVal} Stars`}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs font-sans text-forest-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'recent' | 'rating')}
                    className="rounded-lg border border-sage-300 bg-cream-50 px-3 py-1.5 text-xs font-sans text-forest-800 outline-none focus:border-forest-600"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>
              </div>
            )}

            {/* Testimonials Display Grid */}
            {loading ? (
              <div className="py-24 text-center">
                <Loader2 size={36} className="animate-spin text-forest-600 mx-auto mb-4" />
                <p className="font-sans text-sm text-forest-600 font-light">Loading testimonials...</p>
              </div>
            ) : sorted.length > 0 ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {sorted.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-3xl bg-cream-50 p-8 shadow-sm border border-sage-200/60 hover:shadow-md transition-all duration-300 flex flex-col justify-between relative group"
                  >
                    <Quote
                      size={44}
                      className="absolute top-6 right-6 text-sage-200/40 pointer-events-none group-hover:text-sage-300/50 transition-colors"
                    />

                    <div>
                      {/* Rating Stars */}
                      <div className="flex items-center gap-1 text-amber-400 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={16}
                            className={star <= item.rating ? 'fill-amber-400' : 'text-sage-200'}
                          />
                        ))}
                      </div>

                      {/* Comment text */}
                      <blockquote className="font-serif text-lg font-light text-forest-900 leading-relaxed italic mb-6">
                        "{item.comment}"
                      </blockquote>
                    </div>

                    {/* Author Footer */}
                    <div className="flex items-center gap-3 pt-4 border-t border-sage-200/60 mt-auto">
                      {item.customer_photo ? (
                        <img
                          src={item.customer_photo}
                          alt={item.customer_photo_alt || item.name}
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-forest-800/10"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-800 text-cream-50 font-serif text-lg font-medium ring-2 ring-forest-800/10">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-sans text-sm font-medium text-forest-900">
                          {item.name}
                        </p>
                        <p className="font-sans text-xs text-forest-600/70">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString('en-GB', {
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Verified Client'}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="rounded-3xl border-2 border-dashed border-sage-300 bg-cream-50/50 p-12 text-center max-w-xl mx-auto my-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-200/60 text-forest-700 mb-4">
                  <MessageSquareHeart size={28} />
                </div>
                <h3 className="font-serif text-2xl font-light text-forest-900 mb-2">
                  Be the First to Share Your Experience
                </h3>
                <p className="font-sans text-sm text-forest-700/70 font-light mb-6 leading-relaxed">
                  Have we worked on your garden? We would love to hear your thoughts. Your review will appear here immediately.
                </p>
                <button
                  onClick={() => {
                    setFormOpen(true);
                    setTimeout(() => {
                      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                  }}
                  className="rounded-full bg-forest-800 px-6 py-3 font-sans text-xs uppercase tracking-widest-2 text-cream-50 font-medium hover:bg-forest-900 transition-colors"
                >
                  Leave a Review
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
