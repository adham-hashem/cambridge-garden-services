import { useRef, useState, type FormEvent } from 'react';
import { Check, Copy, Mail, Share2, UsersRound, X } from 'lucide-react';
import { apiSend } from '@/lib/api';

type Credit = { code: string; amount: number; issued_at: string };

export default function RecommendFriend() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [reference, setReference] = useState('');
  const [code, setCode] = useState('');
  const [credits, setCredits] = useState<Credit[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const requestId = useRef(0);

  const close = () => {
    requestId.current += 1;
    setOpen(false);
    setEmail('');
    setReference('');
    setCode('');
    setCredits([]);
    setBusy(false);
    setError('');
    setCopied('');
  };

  const access = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const currentRequest = ++requestId.current;
    setBusy(true);
    setError('');
    try {
      const result = await apiSend<{ code: string; credits: Credit[] }>('/api/referrals/access', 'POST', {
        email: email.trim(), booking_reference: reference.trim(),
      });
      if (requestId.current === currentRequest) {
        setCode(result.code);
        setCredits(result.credits);
      }
    } catch (cause) {
      if (requestId.current === currentRequest) setError(cause instanceof Error ? cause.message : 'We could not find your referral code.');
    } finally { if (requestId.current === currentRequest) setBusy(false); }
  };

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(value); }
    catch { setError('Could not copy the code. Please select and copy it manually.'); }
  };
  const message = `Hi! I recommend Cambridge Garden Services. Use my referral code ${code} when booking and get a discount on your first booking.`;

  return (
    <>
      <div className="group fixed bottom-5 left-5 z-[60] sm:bottom-6 sm:left-6">
        <button type="button" onClick={() => setOpen(true)} aria-label="Recommend a Friend" className="relative flex h-11 w-11 items-center justify-center rounded-full bg-forest-700 text-cream-50 shadow-2xl ring-1 ring-cream-50/30 transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-300 sm:h-14 sm:w-14">
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 animate-pulse rounded-full ring-4 ring-sage-300/30" />
          <UsersRound size={20} className="sm:h-6 sm:w-6" />
        </button>
        <span className="pointer-events-none absolute bottom-full left-0 mb-2 hidden whitespace-nowrap rounded-lg bg-forest-950 px-3 py-2 font-sans text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 sm:block">Recommend a Friend</span>
      </div>
      {open && <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-forest-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="referral-title" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
        <div className="relative my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-cream-50 p-6 shadow-2xl sm:p-8">
          <button type="button" onClick={close} aria-label="Close referral window" className="absolute right-5 top-5 rounded-full p-2 text-forest-600 hover:bg-sage-100"><X size={20} /></button>
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-sage-100 text-forest-700"><Share2 size={22} /></div>
          <h2 id="referral-title" className="font-serif text-3xl text-forest-800">Recommend a Friend</h2>
          <p className="mt-3 font-sans text-sm leading-relaxed text-forest-600">Know someone who needs help with their garden? Share your referral code and give them a discount on their first booking.</p>
          {!code ? <form onSubmit={access} className="mt-6 space-y-3">
            <p className="font-sans text-xs text-forest-500">Existing customers: use your email and the booking reference from your confirmation email.</p>
            <label className="block font-sans text-xs text-forest-700">Your email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-sage-300 bg-cream-50 px-4 py-3 text-sm outline-none focus:border-forest-500" /></label>
            <label className="block font-sans text-xs text-forest-700">Booking reference<input type="text" required value={reference} onChange={(event) => setReference(event.target.value)} className="mt-1 w-full rounded-xl border border-sage-300 bg-cream-50 px-4 py-3 text-sm outline-none focus:border-forest-500" /></label>
            <button type="submit" disabled={busy} className="w-full rounded-full bg-forest-700 px-5 py-3 font-sans text-sm text-white hover:bg-forest-800 disabled:opacity-50">{busy ? 'Finding your code...' : 'Get My Referral Code'}</button>
          </form> : <div className="mt-6">
            <p className="font-sans text-xs uppercase tracking-widest-2 text-forest-600">Your referral code</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl bg-sage-100 p-4"><strong className="font-mono text-xl text-forest-800">{code}</strong><button type="button" onClick={() => copy(code)} className="ml-auto flex items-center gap-1 rounded-full bg-forest-700 px-3 py-2 font-sans text-xs text-white">{copied === code ? <Check size={14} /> : <Copy size={14} />}{copied === code ? 'Copied' : 'Copy Code'}</button></div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="rounded-full border border-sage-300 px-4 py-2 font-sans text-xs text-forest-700 hover:bg-sage-100">Share on WhatsApp</a>
              <a href={`mailto:?subject=${encodeURIComponent('Cambridge Garden Services referral')}&body=${encodeURIComponent(message)}`} className="flex items-center gap-1 rounded-full border border-sage-300 px-4 py-2 font-sans text-xs text-forest-700 hover:bg-sage-100"><Mail size={13} />Share by Email</a>
            </div>
            {credits.length > 0 && <div className="mt-6 border-t border-sage-200 pt-5"><h3 className="font-serif text-lg text-forest-800">Your £10 credits</h3><p className="mt-1 font-sans text-xs text-forest-500">Use one credit code in the booking form with the same email address.</p>{credits.map((credit) => <div key={credit.code} className="mt-2 flex items-center gap-3 rounded-lg bg-sage-50 px-3 py-2"><span className="font-mono text-sm text-forest-800">{credit.code}</span><button type="button" onClick={() => copy(credit.code)} className="ml-auto text-xs text-forest-700 underline">Copy</button></div>)}</div>}
          </div>}
          {error && <p role="alert" className="mt-4 font-sans text-sm text-red-700">{error}</p>}
        </div>
      </div>}
    </>
  );
}
