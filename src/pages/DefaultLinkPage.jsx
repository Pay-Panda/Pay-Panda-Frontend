import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Copy, ExternalLink, IndianRupee, Link2, QrCode, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import api, { assetUrl } from '../lib/api';
import PageHeader from '../components/PageHeader';
import { useUi } from '../state/ui-store';
import { copyToClipboard } from '../lib/clipboard';
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

  const copy = async () => { try { await copyToClipboard(link.url); toast('Default payment link copied', 'success'); } catch { toast('Could not copy link', 'error'); } };

  if (loading) return <div className="empty-cell"><RefreshCw className="spin"/> Loading…</div>;

  return <div ref={rootRef}>
    <PageHeader eyebrow="Payments" title="Default payment link" description="A reusable link where customers enter their own amount and pay." />
    <section className={`panel default-link-hero ${link?.active ? 'active' : ''}`}>
      <div className="default-link-hero-copy">
        <span><Link2/></span>
        <div>
          <p className="eyebrow accent">Always-on collection</p>
          <h2>{link ? 'Your flexible payment link is ready' : 'Create one reusable payment link'}</h2>
          <p>Use this for counters, donations, manual orders, and quick collections where the customer enters the amount before paying.</p>
        </div>
      </div>
      <div className="default-link-state">
        {link ? <span className={`status ${link.active ? 'status-active' : 'status-failed'}`}><i/>{link.active ? 'ACTIVE' : 'DISABLED'}</span> : <span className="status status-pending"><i/>NOT CREATED</span>}
      </div>
    </section>
    <div className="default-link-grid">
      <section className="panel form-panel default-link-settings">
        <div className="panel-heading"><div><h3>{link ? 'Link settings' : 'Generate default link'}</h3><p>Set a label and optional amount boundaries for customer-entered payments.</p></div></div>
        <form onSubmit={link ? save : create}>
          <label>Link label<input placeholder="Store counter, donations, advance payment…" value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}/><small className="field-help">Shown on the customer amount-entry page.</small></label>
          <div className="default-amount-grid">
            <label><span><IndianRupee/>Minimum amount</span><input type="number" min="1" step="0.01" placeholder="No minimum" value={form.minAmount} onChange={e => setForm({ ...form, minAmount: e.target.value })}/></label>
            <label><span><IndianRupee/>Maximum amount</span><input type="number" min="1" step="0.01" placeholder="No maximum" value={form.maxAmount} onChange={e => setForm({ ...form, maxAmount: e.target.value })}/></label>
          </div>
          <div className="default-link-actions">
            <button className="primary-button" disabled={busy}><Link2 />{link ? (busy ? 'Saving…' : 'Save changes') : (busy ? 'Generating…' : 'Generate default link')}</button>
            {link && <button type="button" className={link.active ? 'risk-button' : 'info-button'} onClick={toggleActive} disabled={busy}>{link.active ? <ToggleRight/> : <ToggleLeft/>}{link.active ? 'Disable link' : 'Enable link'}</button>}
          </div>
        </form>
      </section>
      <aside className={`panel default-link-preview ${link ? 'has-link' : ''}`}>
        {link ? <>
          <div className="default-preview-top"><p className="eyebrow accent">Customer link</p><CheckCircle2/></div>
          <div className="default-qr-frame"><img src={assetUrl(`/api/public/link/${link.slug}/qr`)} alt="Default link QR"/></div>
          <h3>{link.label || 'Default payment link'}</h3>
          <div className="default-link-range">
            <div><small>Minimum</small><strong>{link.minAmount ? `₹${Number(link.minAmount).toFixed(2)}` : 'No minimum'}</strong></div>
            <div><small>Maximum</small><strong>{link.maxAmount ? `₹${Number(link.maxAmount).toFixed(2)}` : 'No maximum'}</strong></div>
          </div>
          <div className="link-box default-link-box"><code>{link.url}</code><button type="button" title="Copy link" onClick={copy}><Copy/></button></div>
          <div className="default-preview-actions">
            <a className="primary-button compact" href={link.url} target="_blank" rel="noreferrer">Open link<ExternalLink/></a>
            <button type="button" className="info-button" onClick={copy}><Copy/>Copy</button>
          </div>
          <p className="default-link-note">This reusable link stays available until you disable it. Every customer payment still creates a separate Pay-Panda checkout session.</p>
        </> : <div className="default-empty-preview"><div><QrCode/></div><h4>No default link yet</h4><p>Generate a link to get a QR, copyable URL, and flexible amount-entry page for customers.</p><ul><li>Customer enters amount</li><li>Pay-Panda creates QR checkout</li><li>Payment appears in history</li></ul></div>}
      </aside>
    </div>
  </div>;
}
