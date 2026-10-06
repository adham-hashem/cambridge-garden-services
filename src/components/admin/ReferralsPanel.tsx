import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { apiGet, apiSend } from '@/lib/api';

type ReferralRow = {
  id: string;
  referrer_name: string;
  referrer_email: string;
  referral_code: string;
  code_created_at: string;
  code_status: 'available' | 'code_used' | 'completed' | 'reward_issued';
  referred_email: string | null;
  referred_name: string | null;
  related_booking: string | null;
  booking_status: string | null;
  reward_status: 'pending' | 'issued' | 'used' | 'revoked';
  reward_amount: number;
  reward_code: string | null;
  used_at: string | null;
  created_at: string;
};
type Settings = { friend_discount_type: 'percentage' | 'fixed'; friend_discount_value: number; reward_amount: number };
type Stats = { total_referrals: number; codes_used: number; successful_referrals: number; rewards_issued: number; total_reward_value: number };
type Response = { rows: ReferralRow[]; settings: Settings; stats: Stats };

const dateText = (value: string) => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const label = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function ReferralsPanel() {
  const [data, setData] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [rewardStatus, setRewardStatus] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [selected, setSelected] = useState<ReferralRow | null>(null);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('10');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<Response>('/api/admin/referrals').then((result) => {
      setData(result);
      setDiscountType(result.settings.friend_discount_type);
      setDiscountValue(String(result.settings.friend_discount_value));
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load referrals.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => (data?.rows || []).filter((row) => {
    const term = search.trim().toLowerCase();
    if (term && ![row.referrer_name, row.referrer_email, row.referral_code, row.referred_email || '', row.referred_name || ''].some((value) => value.toLowerCase().includes(term))) return false;
    if (status && row.code_status !== status) return false;
    if (rewardStatus && row.reward_status !== rewardStatus) return false;
    const day = row.created_at.slice(0, 10);
    return (!start || day >= start) && (!end || day <= end);
  }).sort((a, b) => b.created_at.localeCompare(a.created_at)), [data, search, status, rewardStatus, start, end]);

  const saveSettings = async () => {
    setSaving(true);
    setError('');
    try {
      const result = await apiSend<{ settings: Settings }>('/api/admin/referrals', 'PATCH', { discount_type: discountType, discount_value: Number(discountValue) });
      setData((previous) => previous ? { ...previous, settings: result.settings } : previous);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save referral discount.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-forest-600" /></div>;
  return <div>
    <div className="mb-6"><h2 className="font-serif text-2xl text-forest-800">Referrals</h2><p className="mt-1 font-sans text-sm text-forest-500">Real customer recommendations, bookings and £10 credits.</p></div>
    {error && <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 font-sans text-sm text-red-700">{error}</p>}
    {data && <>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">{([
        ['Total Referrals', data.stats.total_referrals], ['Codes Used', data.stats.codes_used],
        ['Successful Referrals', data.stats.successful_referrals], ['Rewards Issued', data.stats.rewards_issued],
        ['Total Reward Value', `£${Number(data.stats.total_reward_value).toFixed(2)}`],
      ] as [string, string | number][]).map(([title, value]) => <div key={title} className="rounded-2xl bg-cream-50 p-4 shadow-sm"><p className="font-sans text-xs text-forest-600">{title}</p><p className="mt-2 font-serif text-2xl text-forest-800">{value}</p></div>)}</div>
      <section className="mb-6 rounded-2xl bg-cream-50 p-4 shadow-sm sm:p-6"><h3 className="font-serif text-xl text-forest-800">Friend's first-booking discount</h3><p className="mt-1 font-sans text-xs text-forest-500">The referrer receives a £10 credit after the friend's booking is completed.</p><div className="mt-4 flex flex-wrap items-end gap-3"><label className="font-sans text-xs text-forest-600">Discount type<select value={discountType} onChange={(event) => setDiscountType(event.target.value as 'percentage' | 'fixed')} className="mt-1 block rounded-lg border border-sage-300 bg-cream-50 px-3 py-2 text-sm"><option value="percentage">Percentage</option><option value="fixed">Fixed amount (£)</option></select></label><label className="font-sans text-xs text-forest-600">Value<input type="number" min="0.01" max={discountType === 'percentage' ? 100 : 10000} step="0.01" value={discountValue} onChange={(event) => setDiscountValue(event.target.value)} className="mt-1 block w-28 rounded-lg border border-sage-300 bg-cream-50 px-3 py-2 text-sm" /></label><button type="button" onClick={saveSettings} disabled={saving} className="rounded-full bg-forest-700 px-5 py-2.5 font-sans text-xs text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save Discount'}</button></div></section>
      <section className="rounded-2xl bg-cream-50 p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end gap-3"><div className="relative min-w-48 flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email or code" className="w-full rounded-full border border-sage-300 bg-cream-50 py-2.5 pl-10 pr-4 font-sans text-sm" /></div><label className="font-sans text-xs text-forest-600">Referral status<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-1 block rounded-lg border border-sage-300 bg-cream-50 px-3 py-2 text-sm"><option value="">All statuses</option>{['available', 'code_used', 'completed', 'reward_issued'].map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label><label className="font-sans text-xs text-forest-600">Reward status<select value={rewardStatus} onChange={(event) => setRewardStatus(event.target.value)} className="mt-1 block rounded-lg border border-sage-300 bg-cream-50 px-3 py-2 text-sm"><option value="">All rewards</option>{['pending', 'issued', 'used', 'revoked'].map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label><label className="font-sans text-xs text-forest-600">From<input type="date" value={start} max={end || undefined} onChange={(event) => setStart(event.target.value)} className="mt-1 block rounded-lg border border-sage-300 bg-cream-50 px-3 py-2 text-sm" /></label><label className="font-sans text-xs text-forest-600">To<input type="date" value={end} min={start || undefined} onChange={(event) => setEnd(event.target.value)} className="mt-1 block rounded-lg border border-sage-300 bg-cream-50 px-3 py-2 text-sm" /></label></div>
        <p className="mt-4 font-sans text-xs text-forest-500">{filtered.length} records</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{filtered.map((row) => <button key={row.id} onClick={() => setSelected(row)} className="rounded-xl border border-sage-200 bg-sage-50/30 p-4 text-left transition-colors hover:bg-sage-50"><div className="flex items-center justify-between gap-3"><p className="font-sans text-sm font-medium text-forest-800">{row.referrer_name}</p><span className="rounded-full bg-sage-100 px-2 py-1 font-sans text-[11px] text-forest-700">{label(row.code_status)}</span></div><p className="mt-1 break-all font-sans text-xs text-forest-500">{row.referrer_email}</p><p className="mt-3 font-mono text-sm text-forest-700">{row.referral_code}</p><div className="mt-3 space-y-1 font-sans text-xs text-forest-600"><p>Created: {dateText(row.code_created_at)}</p><p>Booking: {row.booking_status ? label(row.booking_status) : 'None'}</p><p>Reward: {label(row.reward_status)} · £{Number(row.reward_amount).toFixed(2)}</p></div><span className="mt-3 block font-sans text-xs text-forest-700 underline">View details</span></button>)}</div>
        {!filtered.length && <p className="py-12 text-center font-sans text-sm text-forest-500">No referrals match these filters.</p>}
      </section>
    </>}
    {selected && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-forest-950/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-cream-50 p-6 shadow-2xl"><button onClick={() => setSelected(null)} aria-label="Close referral details" className="absolute right-4 top-4 p-2 text-forest-700"><X size={20} /></button><h3 className="font-serif text-2xl text-forest-800">Referral details</h3><dl className="mt-5 space-y-3 font-sans text-sm text-forest-700">{([
      ['Referrer', selected.referrer_name], ['Referrer email', selected.referrer_email], ['Referral code', selected.referral_code], ['Code created', dateText(selected.code_created_at)], ['Code status', label(selected.code_status)], ['Referred customer', selected.referred_name || selected.referred_email || 'Not used'], ['Referred email', selected.referred_email || '—'], ['Related booking', selected.related_booking || '—'], ['Booking status', selected.booking_status ? label(selected.booking_status) : '—'], ['Reward status', label(selected.reward_status)], ['Reward amount', `£${Number(selected.reward_amount).toFixed(2)}`], ['Reward code', selected.reward_code || '—'],
    ] as [string, string][]).map(([name, value]) => <div key={name} className="grid grid-cols-[120px_1fr] gap-3 border-b border-sage-100 pb-2"><dt className="text-forest-500">{name}</dt><dd className="break-all">{value}</dd></div>)}</dl></div></div>}
  </div>;
}
