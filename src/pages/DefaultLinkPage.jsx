import { useEffect, useRef, useState } from 'react';
import { Copy, Link2, RefreshCw } from 'lucide-react';
import api, { assetUrl } from '../lib/api';
import PageHeader from '../components/PageHeader';
import { useUi } from '../state/ui-store';
import useStagger from '../hooks/useStagger';

export default function DefaultLinkPage() {
  const rootRef = useRef(null);
  const { toast } = useUi();
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ label: '', minAmount: '', maxAmount: '' });
  const [busy, setBusy] = useState(false);
  useStagger(rootRef, '.panel', { dependency: Boolean(link) });

  const load = () => {
    setLoading(true);
    api.get('/dashboard/default-link').then(({ data }) => {
      setLink(data.link);
      if (data.link) setForm({ label: data.link.label || '', minAmount: data.link.minAmount ?? '', maxAmount: data.link.maxAmount ?? '' });
    }).catch(() => toast('Could not load default link', 'error')).finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const payload = () => ({
    label: form.label || undefined,
    minAmount: form.minAmount === '' ? null : Number(form.minAmount),
    maxAmount: form.maxAmount === '' ? null : Number(form.maxAmount),
  });

  const create = async event => {
    event.preventDefault(); setBusy(true);
    try { const { data } = await api.post('/dashboard/default-link', payload()); setLink(data.link); toast('Default link created'); }
    catch (err) { toast(err.response?.data?.message || 'Could not create default link', 'error'); }
    finally { setBusy(false); }
  };

  const save = async event => {
    event.preventDefault(); setBusy(true);
    try { const { data } = await api.patch('/dashboard/default-link', payload()); setLink(data.link); toast('Default link updated'); }
    catch (err) { toast(err.response?.data?.message || 'Could not update default link', 'error'); }
    finally { setBusy(false); }
  };

  const toggleActive = async () => {
    setBusy(true);
    try { const { data } = await api.patch('/dashboard/default-link', { active: !link.active }); setLink(data.link); toast(data.link.active ? 'Link enabled' : 'Link disabled'); }
    catch (err) { toast(err.response?.data?.message || 'Could not update link', 'error'); }
    finally { setBusy(false); }
  };

  const copy = async () => { await navigator.clipboard.writeText(link.url); toast('Link copied'); };

  if (loading) return <div className="empty-cell"><RefreshCw className="spin"/> Loading…</div>;

  return <div ref={rootRef}>
    <PageHeader eyebrow="Payments" title="Default payment link" description="A reusable link where customers enter their own amount and pay." />
    <div className="create-grid">
      <section className="panel form-panel">
        <div className="panel-heading"><div><h3>{link ? 'Link settings' : 'Always-on payment link'}</h3><p>Customers open this link, enter their own amount, and pay.</p></div></div>
        <form onSubmit={link ? save : create}>
          <label>Link label<input placeholder="Store counter, donations, etc." value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}/></label>
          <div className="form-grid">
            <label>Minimum amount (₹)<input type="number" min="1" placeholder="No minimum" value={form.minAmount} onChange={e => setForm({ ...form, minAmount: e.target.value })}/></label>
            <label>Maximum amount (₹)<input type="number" min="1" placeholder="No maximum" value={form.maxAmount} onChange={e => setForm({ ...form, maxAmount: e.target.value })}/></label>
          </div>
          <button className="primary-button" disabled={busy}><Link2 />{link ? (busy ? 'Saving…' : 'Save changes') : (busy ? 'Generating…' : 'Generate default link')}</button>
        </form>
      </section>
      <aside className="panel result-panel">
        {link ? <>
          <p className="eyebrow accent">Your link</p>
          <img className="result-qr" src={assetUrl(`/api/public/link/${link.slug}/qr`)} alt="Default link QR"/>
          <div className="link-box"><code>{link.url}</code><button type="button" onClick={copy}><Copy/></button></div>
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>This link stays active until you disable it, unlike order-specific payment sessions.</p>
          <button type="button" className={link.active ? 'risk-button' : 'info-button'} onClick={toggleActive} disabled={busy} style={{ marginTop: 14 }}>{link.active ? 'Disable link' : 'Enable link'}</button>
        </> : <div className="empty-state"><Link2/><h4>No default link yet</h4><p>Generate one to start accepting flexible-amount payments.</p></div>}
      </aside>
    </div>
  </div>;
}
