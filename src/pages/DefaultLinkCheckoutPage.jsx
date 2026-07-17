import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Clock3 } from 'lucide-react';
import api from '../lib/api';

export default function DefaultLinkCheckoutPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [link, setLink] = useState(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ amount: '', customer_name: '', customer_mobile: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/public/link/${slug}`).then(({ data }) => setLink(data.link)).catch(err => setError(err.response?.data?.message || 'This payment link is not available.'));
  }, [slug]);

  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const { data } = await api.post(`/public/link/${slug}/pay`, form);
      navigate(`/pay/${data.payment.id}`, { replace: true });
    } catch (err) { setError(err.response?.data?.message || 'Could not start payment.'); setBusy(false); }
  };

  if (error) return <div className="checkout"><div className="pay-card"><div className="empty-state"><Clock3/><h2>{error}</h2></div></div></div>;
  if (!link) return <div className="checkout"><div className="checkout-loader">Loading payment link…</div></div>;

  return <div className={`checkout theme-${link.business.theme || 'midnight'}`}>
    <div className="checkout-orb one"/><div className="checkout-orb two"/>
    <main className="pay-card">
      <div className="checkout-head"><div className="checkout-brand">{link.business.name[0]}</div><div><p>Paying</p><strong>{link.business.name}</strong></div></div>
      <form onSubmit={submit} className="default-link-form">
        <label>Amount (₹)
          <input type="number" required autoFocus min={link.minAmount || 1} max={link.maxAmount || undefined} step="0.01"
            placeholder={link.minAmount || link.maxAmount ? `${link.minAmount || 1} – ${link.maxAmount || '∞'}` : 'Enter amount'}
            value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}/>
        </label>
        <label>Your name (optional)<input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })}/></label>
        <label>Mobile number (optional)<input inputMode="numeric" maxLength={15} value={form.customer_mobile} onChange={e => setForm({ ...form, customer_mobile: e.target.value.replace(/\D/g, '').slice(0, 15) })}/></label>
        {link.label && <p className="default-link-note">{link.label}</p>}
        {error && <div className="alert error">{error}</div>}
        <button className="primary-button" disabled={busy}>{busy ? 'Preparing QR…' : 'Continue to pay'}<ArrowRight size={18}/></button>
      </form>
    </main>
  </div>;
}
