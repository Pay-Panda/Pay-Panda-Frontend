import { useEffect, useRef, useState } from 'react';
import { Check, RefreshCw, Smartphone } from 'lucide-react';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../state/auth-store';
import { useUi } from '../state/ui-store';
import useStagger from '../hooks/useStagger';

const templates = [
  { id: 'midnight', name: 'Midnight', layout: 'Centered card', description: 'The classic balanced layout — logo, QR and pay button stacked in one card.', accent: '#7c3aed', bg: '#101620', panel: '#161d2b', text: '#edf1f7', muted: '#8b94a8' },
  { id: 'daylight', name: 'Daylight', layout: 'Split details', description: 'Business and customer details sit beside the QR instead of below it.', accent: '#6d28d9', bg: '#ffffff', panel: '#f5f3ff', text: '#172033', muted: '#6b7280' },
  { id: 'emerald', name: 'Emerald', layout: 'QR-first minimal', description: 'The QR leads, chrome is stripped back to just the essentials.', accent: '#0d9c74', bg: '#0d1a16', panel: '#0d1a16', text: '#eafff6', muted: '#7fae9c' },
  { id: 'sunrise', name: 'Sunrise', layout: 'Bold banner', description: 'A full-width color banner carries your brand above the payment card.', accent: '#f59e0b', bg: '#1a1410', panel: '#221a12', text: '#fff3e0', muted: '#c9a877' },
];

export default function PaymentThemePage() {
  const rootRef = useRef(null);
  const { user } = useAuth();
  const { toast } = useUi();
  const [active, setActive] = useState('midnight');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user?.business?.theme) setActive(user.business.theme); }, [user]);
  useStagger(rootRef, '.theme-swatch');
  const t = templates.find(item => item.id === active);
  const vars = { '--swatch-bg': t.bg, '--swatch-panel': t.panel, '--swatch-accent': t.accent, '--swatch-text': t.text, '--swatch-muted': t.muted };
  const choose = async id => {
    if (id === active || busy) return;
    const previous = active;
    setActive(id); setBusy(true);
    try { await api.patch('/dashboard/theme', { theme: id }); toast('Checkout theme saved'); }
    catch (err) { setActive(previous); toast(err.response?.data?.message || 'Could not save theme', 'error'); }
    finally { setBusy(false); }
  };

  return <div ref={rootRef}>
    <PageHeader eyebrow="Gateway setup" title="Payment page theme" description="Brand the hosted checkout with your logo, colors, and an entirely different page layout — not just a recolor." />
    <div className="create-grid grid grid-cols-[minmax(0,1.1fr)_minmax(320px,.9fr)] gap-5 max-lg:grid-cols-1">
      <section className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
        <div className="panel-heading flex items-center justify-between gap-4 border-b border-line px-6 py-5"><div><h3>Theme presets</h3><p>Each preset is its own layout template, not just a different palette.</p></div>{busy && <RefreshCw className="spin animate-spin" size={16}/>}</div>
        <div className="theme-grid">
          {templates.map(item => <button type="button" className={`theme-swatch ${active === item.id ? 'active' : ''}`} key={item.id} onClick={() => choose(item.id)} style={{ '--swatch-bg': item.bg, '--swatch-accent': item.accent, '--swatch-text': item.text }}>
            <span className="theme-swatch-preview" />
            <strong>{item.name}</strong>
            <small>{item.layout}</small>
            {active === item.id && <Check className="theme-swatch-check" />}
          </button>)}
        </div>
        <p className="theme-detail">{t.description}</p>
      </section>
      <aside className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel result-panel rounded-[var(--radius-lg)] border border-line bg-panel p-6 shadow-panel theme-preview-panel">
        <p className="eyebrow mb-1 text-[var(--font-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--muted-2)] accent text-accent-contrast">Live preview — {t.layout}</p>
        <MiniCheckout template={t} vars={vars} />
      </aside>
    </div>
  </div>;
}

function MiniCheckout({ template, vars }) {
  const props = { className: `mini-checkout layout-${template.id}`, style: vars };
  if (template.id === 'daylight') {
    return <div {...props}>
      <div className="mini-split">
        <div className="mini-split-info">
          <span className="mini-avatar">P</span>
          <small>Paying</small><strong>Your Business</strong>
          <div className="mini-split-amount">₹499.00</div>
          <button className="upi-pay-button mx-auto inline-flex h-11 w-[248px] items-center justify-center gap-2 rounded-[var(--radius-md)] border border-accent/25 bg-accent/10 text-small font-bold text-accent-contrast" type="button" disabled><Smartphone />Pay with a UPI app</button>
        </div>
        <div className="mini-split-qr"><div className="mini-qr" /></div>
      </div>
    </div>;
  }
  if (template.id === 'emerald') {
    return <div {...props}>
      <div className="mini-qr mini-qr-large" />
      <strong className="mini-minimal-amount">₹499.00</strong>
      <small>Scan with any UPI app</small>
    </div>;
  }
  if (template.id === 'sunrise') {
    return <div {...props}>
      <div className="mini-banner"><span className="mini-avatar">P</span><div><small>Paying</small><strong>Your Business</strong></div><em>₹499.00</em></div>
      <div className="mini-banner-body">
        <div className="mini-qr" />
        <button className="upi-pay-button mx-auto inline-flex h-11 w-[248px] items-center justify-center gap-2 rounded-[var(--radius-md)] border border-accent/25 bg-accent/10 text-small font-bold text-accent-contrast" type="button" disabled><Smartphone />Pay with a UPI app</button>
      </div>
    </div>;
  }
  return <div {...props}>
    <div className="mini-checkout-head"><span className="mini-avatar">P</span><div><small>Paying</small><strong>Your Business</strong></div><em>₹499.00</em></div>
    <div className="mini-qr" />
    <button className="upi-pay-button mx-auto inline-flex h-11 w-[248px] items-center justify-center gap-2 rounded-[var(--radius-md)] border border-accent/25 bg-accent/10 text-small font-bold text-accent-contrast" type="button" disabled><Smartphone />Pay with a UPI app</button>
  </div>;
}
