import { useCallback, useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { apiGet, apiSend } from '@/lib/api';
import { formatGbp } from '@/lib/designer/shared';

type AdminPackage = {
  id: 'preview' | 'plus' | 'complete';
  name: string;
  price_pence: number;
  description: string;
  features: string[];
  concepts: number;
  pdf_level: number;
  recommended: boolean;
  active: boolean;
};

type AdminRate = { key: string; label: string; unit: string; rate_pence: number | null; note: string };

type AdminOrder = {
  id: string;
  status: string;
  amount_pence: number;
  package_id: string;
  customer_email: string | null;
  created_at: string;
  paid_at: string | null;
  designer_projects: { reference: string; kind: string; title: string } | null;
};

const BASE = '/api/admin/designer';
const input = 'w-full rounded-lg border border-sage-300 bg-white px-3 py-2 text-sm text-forest-800';

async function put(resource: string, body: unknown) {
  return apiSend(`${BASE}?resource=${resource}`, 'PATCH', body);
}

function PackageEditor({ pack, onSaved }: { pack: AdminPackage; onSaved: () => void }) {
  const [name, setName] = useState(pack.name);
  const [price, setPrice] = useState((pack.price_pence / 100).toFixed(2));
  const [description, setDescription] = useState(pack.description);
  const [features, setFeatures] = useState(pack.features.join('\n'));
  const [recommended, setRecommended] = useState(pack.recommended);
  const [active, setActive] = useState(pack.active);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const save = async () => {
    const pounds = Number(price);
    if (!Number.isFinite(pounds) || pounds < 0) {
      setState('error');
      setMessage('Enter a valid price in pounds.');
      return;
    }
    setState('saving');
    try {
      await put('packages', {
        id: pack.id,
        name,
        pricePence: Math.round(pounds * 100),
        description,
        features: features.split('\n').map((line) => line.trim()).filter(Boolean),
        recommended,
        active,
      });
      setState('saved');
      onSaved();
    } catch (err) {
      setState('error');
      setMessage(err instanceof Error ? err.message : 'Could not save');
    }
  };

  return (
    <div className="rounded-2xl border border-sage-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-xl text-forest-800">{pack.id}</h3>
        <span className="text-xs text-forest-500">
          {pack.concepts} concept{pack.concepts > 1 ? 's' : ''} · PDF level {pack.pdf_level}
        </span>
      </div>
      <div className="mt-4 space-y-3">
        <label className="block text-xs text-forest-600">
          Name
          <input className={`${input} mt-1`} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block text-xs text-forest-600">
          Price (£)
          <input className={`${input} mt-1`} type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label className="block text-xs text-forest-600">
          Description
          <textarea className={`${input} mt-1`} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="block text-xs text-forest-600">
          Included features (one per line)
          <textarea className={`${input} mt-1`} rows={7} value={features} onChange={(e) => setFeatures(e.target.value)} />
        </label>
        <div className="flex flex-wrap gap-5 text-sm text-forest-700">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={recommended} onChange={(e) => setRecommended(e.target.checked)} /> Recommended
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Available to customers
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={save} disabled={state === 'saving'} className="rounded-full bg-forest-800 px-5 py-2 text-sm text-cream-100 disabled:opacity-60">
            {state === 'saving' ? 'Saving...' : `Save (${formatGbp(Math.round((Number(price) || 0) * 100))})`}
          </button>
          {state === 'saved' && (
            <span className="flex items-center gap-1 text-sm text-forest-600">
              <Check size={14} /> Saved
            </span>
          )}
          {state === 'error' && <span className="text-sm text-red-700">{message}</span>}
        </div>
      </div>
    </div>
  );
}

function RateRow({ rate }: { rate: AdminRate }) {
  const [value, setValue] = useState(rate.rate_pence === null ? '' : (rate.rate_pence / 100).toFixed(2));
  const [note, setNote] = useState(rate.note);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const save = async () => {
    setState('saving');
    try {
      await put('rates', { key: rate.key, ratePence: value === '' ? null : Math.round(Number(value) * 100), note });
      setState('saved');
    } catch {
      setState('error');
    }
  };

  return (
    <tr className="border-t border-sage-100">
      <td className="py-2 pr-3 text-sm text-forest-800">{rate.label}</td>
      <td className="px-3 text-sm text-forest-600">per {rate.unit === 'm2' ? 'm²' : rate.unit}</td>
      <td className="px-3">
        <input className={`${input} w-28`} type="number" min={0} step={0.01} placeholder="Not set" value={value} onChange={(e) => { setValue(e.target.value); setState('idle'); }} aria-label={`${rate.label} rate in pounds`} />
      </td>
      <td className="px-3">
        <input className={input} value={note} onChange={(e) => { setNote(e.target.value); setState('idle'); }} aria-label={`${rate.label} note`} />
      </td>
      <td className="pl-3 text-right">
        <button type="button" onClick={save} className="rounded-full border border-forest-700 px-4 py-1.5 text-sm text-forest-800">
          {state === 'saving' ? '...' : state === 'saved' ? 'Saved' : state === 'error' ? 'Retry' : 'Save'}
        </button>
      </td>
    </tr>
  );
}

export default function DesignerPricingPanel() {
  const [packages, setPackages] = useState<AdminPackage[] | null>(null);
  const [rates, setRates] = useState<AdminRate[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, r, o] = await Promise.all([
        apiGet<{ packages: AdminPackage[] }>(`${BASE}?resource=packages`),
        apiGet<{ rates: AdminRate[] }>(`${BASE}?resource=rates`),
        apiGet<{ orders: AdminOrder[] }>(`${BASE}?resource=orders`),
      ]);
      setPackages(p.packages);
      setRates(r.rates);
      setOrders(o.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load AI Designer settings');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  if (!packages) return <Loader2 className="animate-spin text-forest-600" />;

  return (
    <div className="space-y-12">
      <section>
        <h2 className="font-serif text-2xl text-forest-800">AI Garden Designer packages</h2>
        <p className="mt-1 text-sm text-forest-600">Changes apply immediately to the public pricing page and to new checkouts.</p>
        <div className="mt-6 grid gap-6 xl:grid-cols-3">
          {packages.map((pack) => (
            <PackageEditor key={`${pack.id}-${pack.price_pence}`} pack={pack} onSaved={load} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-forest-800">Estimate unit rates (pounds)</h2>
        <p className="mt-1 max-w-3xl text-sm text-forest-600">
          Used for the cost estimates in Complete Garden Plan PDFs. Leave a rate empty and that item appears as &quot;To be quoted&quot; and is left out of the estimated total. No supplier prices are assumed.
        </p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-sage-200 bg-white p-4">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-sage-600">
                <th className="pb-2">Item</th>
                <th className="px-3 pb-2">Unit</th>
                <th className="px-3 pb-2">Rate (£)</th>
                <th className="px-3 pb-2">Note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => (
                <RateRow key={rate.key} rate={rate} />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl text-forest-800">Recent orders</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-sage-200 bg-white p-4">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-sage-600">
                <th className="pb-2">Reference</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Package</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Email</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-sage-100 text-forest-700">
                  <td className="py-2">{order.designer_projects?.reference || '-'}</td>
                  <td>{order.designer_projects?.kind || '-'}</td>
                  <td>{order.package_id}</td>
                  <td>{formatGbp(order.amount_pence)}</td>
                  <td>{order.status}</td>
                  <td>{order.customer_email || '-'}</td>
                  <td>{new Date(order.paid_at || order.created_at).toLocaleDateString('en-GB')}</td>
                </tr>
              ))}
              {!orders.length && (
                <tr>
                  <td colSpan={7} className="py-4 text-forest-500">
                    No orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
