import { useEffect, useRef, useState } from 'react';
import { CalendarDays, IndianRupee, ReceiptIndianRupee, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useUi } from '../state/ui-store';
import useStagger from '../hooks/useStagger';

export default function SubscriptionHistoryPage() {
  const rootRef = useRef(null);
  const { toast } = useUi();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState('');
  useStagger(rootRef, '.table-wrap tbody tr, .history-summary article', { dependency: invoices.length });

  const load = () => {
    setLoading(true);
    api.get('/dashboard/subscription/invoices').then(({ data }) => setInvoices(data.invoices))
      .catch(() => toast('Could not load subscription history', 'error')).finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pay = async invoice => {
    setPayingId(invoice.id);
    try {
      if (invoice.checkoutUrl) { window.open(invoice.checkoutUrl, '_blank'); return; }
      const { data } = await api.post(`/dashboard/subscription/invoices/${invoice.id}/pay`);
      window.open(data.checkoutUrl, '_blank');
      load();
    } catch (err) { toast(err.response?.data?.message || 'Could not start invoice payment', 'error'); }
    finally { setPayingId(''); }
  };

  const totalPaid = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + Number(i.totalFeeAmount), 0);
  const pending = invoices.find(i => i.status === 'PENDING');

  return <div ref={rootRef}>
    <PageHeader eyebrow="Billing" title="Subscription history" description="Monthly platform fee invoices, generated from your actual payment volume." />
    <section className="history-summary">
      <article><span><IndianRupee /></span><div><small>Total paid</small><strong>₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div></article>
      <article><span><ReceiptIndianRupee /></span><div><small>Invoices</small><strong>{invoices.length}</strong></div></article>
      <article className="range-card"><span><CalendarDays /></span><div><small>Outstanding</small><strong>{pending ? `₹${Number(pending.totalFeeAmount).toFixed(2)}` : 'None'}</strong></div></article>
    </section>
    <section className="panel">
      <div className="table-wrap"><table><thead><tr><th>Period</th><th>Payments</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>
        {loading ? <tr><td colSpan="5" className="empty-cell"><RefreshCw className="spin"/> Loading…</td></tr>
          : invoices.length ? invoices.map(invoice => <tr key={invoice.id}>
            <td><strong>{new Date(invoice.periodStart).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</strong></td>
            <td>{invoice.paymentCount}</td>
            <td>₹{Number(invoice.totalFeeAmount).toFixed(2)}</td>
            <td><StatusBadge status={invoice.status === 'PAID' ? 'SUCCESS' : invoice.status === 'EXPIRED' ? 'EXPIRED' : 'PENDING'} /></td>
            <td>{invoice.status === 'PENDING' && <button className="info-button" onClick={() => pay(invoice)} disabled={payingId === invoice.id}>{payingId === invoice.id ? <RefreshCw className="spin" size={14}/> : null}Pay now</button>}</td>
          </tr>) : <tr><td colSpan="5" className="empty-cell">No invoices yet — they're generated automatically at the start of each month once you've processed payments.</td></tr>}
      </tbody></table></div>
    </section>
  </div>;
}
