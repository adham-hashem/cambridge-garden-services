import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { uploadImage } from '@/lib/api';
import { validatePromoCode, calculateDiscount } from '@/lib/promoCodes';
import { submitQuoteRequest } from '@/lib/quotes';
import type { PromoCode } from '@/types/admin';
import { Upload, Check, Loader2, AlertCircle, Tag, X } from 'lucide-react';

const projectTypes = [
  'Garden Design',
  'Landscaping',
  'Patios',
  'Fencing',
  'Turfing',
  'Garden Clearance',
  'Groundworks',
  'Tree Surgery',
  'Garden Maintenance',
  'Other',
];

const budgetRanges = [
  'Under £1,000',
  '£1,000 – £5,000',
  '£5,000 – £10,000',
  '£10,000 – £25,000',
  '£25,000+',
  'Not sure yet',
];

const budgetToEstimate: Record<string, number> = {
  'Under £1,000': 750,
  '£1,000 – £5,000': 3000,
  '£5,000 – £10,000': 7500,
  '£10,000 – £25,000': 17500,
  '£25,000+': 30000,
  'Not sure yet': 0,
};

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function QuoteForm() {
  const [status, setStatus] = useState<Status>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedBudget, setSelectedBudget] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const baseEstimate = selectedBudget ? budgetToEstimate[selectedBudget] || 0 : 0;
  const discountAmount = appliedPromo ? calculateDiscount(appliedPromo, baseEstimate).discountAmount : 0;
  const finalPrice = appliedPromo ? calculateDiscount(appliedPromo, baseEstimate).finalPrice : baseEstimate;

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUploading(true);

    try {
      const publicUrl = await uploadImage(file, 'bookings');
      setAttachmentUrl(publicUrl);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
      return;
    }
    setUploading(false);
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoValidating(true);
    setPromoMessage(null);

    const result = await validatePromoCode(promoInput.trim());

    if (result.valid && result.promoCode) {
      setAppliedPromo(result.promoCode);
      setPromoMessage({ type: 'success', text: `Code "${result.promoCode.code}" applied!` });
    } else {
      setAppliedPromo(null);
      setPromoMessage({ type: 'error', text: result.error || 'Invalid code' });
    }

    setPromoValidating(false);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoMessage(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus('submitting');

    const formData = new FormData(form);
    const budget = String(formData.get('budget') || '');
    const projectType = String(formData.get('project_type') || '');

    const payload = {
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || ''),
      address: String(formData.get('address') || ''),
      project_type: projectType,
      budget: budget || null,
      project_details: String(formData.get('project_details') || ''),
      attachment_name: fileName,
      attachment_url: attachmentUrl,
      promo_code: appliedPromo?.code || null,
    };

    try {
      await submitQuoteRequest(payload);
      form.reset();
      if (fileInputRef.current) fileInputRef.current.value = '';
      setStatus('success');
      setFileName(null);
      setAttachmentUrl(null);
      setAppliedPromo(null);
      setPromoInput('');
      setPromoMessage(null);
      setSelectedBudget('');
    } catch (err) {
      console.error('Quote submission failed', err);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <section id="quote" className="relative bg-forest-800 py-24 lg:py-32">
        <div className="mx-auto max-w-2xl px-6 text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-sage-400/20">
            <Check size={36} className="text-sage-200" />
          </div>
          <h2 className="font-serif text-4xl font-light text-cream-50 sm:text-5xl">
            Thank you.
          </h2>
          <p className="mt-6 font-sans text-lg font-light text-cream-200/70">
            Your request has reached us. We will be in touch within two working days to talk about
            your garden.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-10 rounded-full border border-cream-100/30 px-8 py-3 font-sans text-sm uppercase tracking-widest-2 text-cream-50 transition-all hover:bg-cream-100 hover:text-forest-800"
          >
            Send another request
          </button>
        </div>
      </section>
    );
  }

  return (
    <section id="quote" className="relative bg-forest-800 py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-6 lg:px-10">
        <div className="mb-12 text-center">
          <p className="reveal font-sans text-xs uppercase tracking-widest-2 text-sage-300 mb-6">
            Start Your Project
          </p>
          <h2 className="reveal reveal-delay-1 font-serif text-4xl font-light text-cream-50 sm:text-5xl md:text-6xl">
            Ready to <span className="italic">Step Outside?</span>
          </h2>
          <p className="reveal reveal-delay-2 mx-auto mt-6 max-w-lg font-sans text-base font-light text-cream-200/60">
            Tell us about your garden and what you hope it might become. We will reply within two
            working days.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="reveal reveal-delay-3 space-y-6 rounded-3xl bg-cream-50 p-8 lg:p-12"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Name" name="name" required />
            <Field label="Email" name="email" type="email" required />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Phone" name="phone" type="tel" />
            <Field label="Address" name="address" />
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <SelectField
              label="Project Type"
              name="project_type"
              options={projectTypes}
              required
            />
            <SelectField
              label="Budget"
              name="budget"
              options={budgetRanges}
              onChange={(v) => setSelectedBudget(v)}
            />
          </div>
          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">
              Project Details
            </label>
            <textarea
              name="project_details"
              rows={4}
              required
              className="w-full resize-none rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 placeholder-forest-700/30 outline-none transition-colors focus:border-forest-500 focus:bg-cream-50"
              placeholder="Tell us about your garden, what you want to change, and how you hope to use the space..."
            />
          </div>

          <div>
            <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">
              Upload an Image
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-sage-400/50 bg-cream-100/30 px-4 py-6 font-sans text-sm text-forest-700/60 transition-colors hover:border-forest-500 hover:bg-cream-100 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={18} className="animate-spin text-forest-500" />
              ) : (
                <Upload size={18} />
              )}
              {fileName ? (
                <span className="text-forest-700 font-medium">{fileName}</span>
              ) : (
                <span>Click to upload a photo of your garden (optional)</span>
              )}
            </button>
          </div>

          {/* Promo Code Section */}
          <div className="rounded-xl border border-sage-200/60 bg-sage-50/30 p-4">
            <label className="mb-2 flex items-center gap-2 font-sans text-xs uppercase tracking-widest-2 text-forest-700">
              <Tag size={14} />
              Promo Code
            </label>
            {!appliedPromo ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="Enter code..."
                  className="flex-1 rounded-lg border border-sage-300/40 bg-cream-50 px-4 py-2.5 font-sans text-sm text-forest-800 placeholder-forest-400 outline-none transition-colors focus:border-forest-500"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={promoValidating || !promoInput.trim()}
                  className="flex items-center gap-2 rounded-lg bg-forest-700 px-5 py-2.5 font-sans text-sm text-cream-50 transition-all hover:bg-forest-800 disabled:opacity-50"
                >
                  {promoValidating ? <Loader2 size={14} className="animate-spin" /> : null}
                  Apply
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg bg-forest-100 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-forest-600" />
                  <span className="font-sans text-sm font-medium text-forest-700">
                    {appliedPromo.code}
                  </span>
                  <span className="font-sans text-xs text-forest-500">
                    {appliedPromo.discount_type === 'percentage'
                      ? `${appliedPromo.discount_value}% off`
                      : `£${appliedPromo.discount_value} off`}
                  </span>
                </div>
                <button type="button" onClick={handleRemovePromo} className="text-forest-500 hover:text-forest-700">
                  <X size={16} />
                </button>
              </div>
            )}
            {promoMessage && (
              <p className={`mt-2 font-sans text-xs ${promoMessage.type === 'success' ? 'text-forest-600' : 'text-red-600'}`}>
                {promoMessage.text}
              </p>
            )}
          </div>

          {/* Price Summary */}
          {baseEstimate > 0 && (
            <div className="rounded-xl bg-forest-50/50 p-4">
              <p className="mb-3 font-sans text-xs uppercase tracking-widest-2 text-forest-600">
                Estimated Price
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between font-sans text-sm text-forest-700">
                  <span>Estimated base price</span>
                  <span>£{baseEstimate.toLocaleString()}</span>
                </div>
                {appliedPromo && discountAmount > 0 && (
                  <div className="flex justify-between font-sans text-sm text-forest-600">
                    <span>Discount ({appliedPromo.code})</span>
                    <span>-£{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-sage-200 pt-1.5 font-serif text-lg font-medium text-forest-800">
                  <span>Final estimate</span>
                  <span>£{finalPrice.toLocaleString()}</span>
                </div>
              </div>
              <p className="mt-2 font-sans text-xs text-forest-400">
                Final pricing confirmed after site visit. Estimate based on selected budget range.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-center gap-3 rounded-xl bg-earth-100 px-4 py-3 text-sm text-earth-700">
              <AlertCircle size={18} />
              Something went wrong. Please try again or call us directly.
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'submitting' || uploading}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-forest-700 px-8 py-4 font-sans text-sm uppercase tracking-widest-2 text-cream-50 transition-all duration-300 hover:bg-forest-800 disabled:cursor-wait disabled:opacity-60"
          >
            {status === 'submitting' ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending...
              </>
            ) : (
              'Send Request'
            )}
          </button>
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">
        {label}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 placeholder-forest-700/30 outline-none transition-colors focus:border-forest-500 focus:bg-cream-50"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  required = false,
  onChange,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
  onChange?: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block font-sans text-xs uppercase tracking-widest-2 text-forest-700">
        {label}
      </label>
      <select
        name={name}
        required={required}
        defaultValue=""
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-xl border border-sage-300/40 bg-cream-100/50 px-4 py-3 font-sans text-sm text-forest-800 outline-none transition-colors focus:border-forest-500 focus:bg-cream-50"
      >
        <option value="" disabled>
          Select...
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
