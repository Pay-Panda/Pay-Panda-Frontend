import { useEffect, useRef, useState } from 'react';
import { QrCode, Smartphone, Layers, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../state/auth-store';
import { useUi } from '../state/ui-store';
import useStagger from '../hooks/useStagger';

const options = [
  { value: 'qr', icon: QrCode, title: 'QR only', description: 'Show only the amount-specific UPI QR on the hosted checkout.' },
  { value: 'button', icon: Smartphone, title: 'UPI QR share button', description: 'Share the generated QR image to mobile UPI apps instead of opening a raw intent link.' },
  { value: 'both', icon: Layers, title: 'Both (recommended)', description: 'Show the QR and the QR share button together, matching the current checkout.' },
];

export default function PaymentOptionsPage() {
  const rootRef = useRef(null);
  const { user } = useAuth();
  const { toast } = useUi();
  const [active, setActive] = useState('both');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user?.business?.checkoutLayout) setActive(user.business.checkoutLayout); }, [user]);
  useStagger(rootRef, '.toggle-row');
  const choose = async value => {
    if (value === active || busy) return;
    const previous = active;
    setActive(value); setBusy(true);
    try { await api.patch('/dashboard/payment-options', { checkoutLayout: value }); toast('Payment options saved'); }
    catch (err) { setActive(previous); toast(err.response?.data?.message || 'Could not save payment options', 'error'); }
    finally { setBusy(false); }
  };
  return <div ref={rootRef}>
    <PageHeader eyebrow="Gateway setup" title="Payment options" description="Control which QR and UPI app payment elements appear on your hosted checkout." />
    <div className="create-grid">
      <section className="panel">
        <div className="panel-heading"><div><h3>Checkout layout</h3><p>Choose what customers see when they open a payment link.</p></div>{busy && <RefreshCw className="spin" size={16}/>}</div>
        <div className="option-list">
          {options.map(option => <div className="toggle-row" key={option.value}>
            <span className="toggle-row-icon"><option.icon /></span>
            <div><strong>{option.title}</strong><p>{option.description}</p></div>
            <button type="button" className={`toggle-switch ${active === option.value ? 'on' : ''}`} onClick={() => choose(option.value)} aria-pressed={active === option.value}><i /></button>
          </div>)}
        </div>
      </section>
      <aside className="panel result-panel">
        <p className="eyebrow accent">Live preview</p>
        <div className="mini-checkout">
          <div className="mini-checkout-head"><span className="mini-avatar">P</span><div><small>Paying</small><strong>{user?.business?.name || 'Your Business'}</strong></div></div>
          {active !== 'button' && <div className="mini-qr" />}
          {active !== 'qr' && <button className="upi-pay-button" type="button" disabled><Smartphone />Pay with a UPI app</button>}
        </div>
      </aside>
    </div>
  </div>;
}
