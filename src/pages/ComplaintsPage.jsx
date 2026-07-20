import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { useUi } from '../state/ui-store';

const statuses = ['', 'OPEN', 'INVESTIGATING', 'RESOLVED'];

export default function ComplaintsPage() {
  const { toast } = useUi();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (page = 1) => {
    setLoading(true);
    api.get('/dashboard/complaints', { params: { page, status: status || undefined } })
      .then(({ data }) => { setItems(data.complaints); setPagination(data.pagination); })
      .catch(() => toast('Could not load complaints', 'error')).finally(() => setLoading(false));
  };
  useEffect(() => { load(1); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div>
    <PageHeader eyebrow="Payments" title="Complaints" description="Disputes raised by customers on your payments, or issues you've flagged yourself, along with Pay-Panda's resolution notes." />
    <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
      <div className="table-tools flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <select className="admin-select h-10 rounded-xl border border-line bg-panel px-3 text-small text-text" value={status} onChange={e => setStatus(e.target.value)}>
          {statuses.map(item => <option key={item} value={item}>{item || 'All statuses'}</option>)}
        </select>
        <span>{pagination.total} complaints</span>
      </div>
      <div className="table-wrap w-full overflow-auto"><table><thead><tr><th>Order</th><th>Amount</th><th>Filed by</th><th>Message</th><th>Status</th><th>Filed</th></tr></thead><tbody>
        {loading ? <tr><td colSpan="6" className="empty-cell px-5 py-12 text-center text-muted"><RefreshCw className="spin animate-spin"/> Loading…</td></tr>
          : items.length ? items.map(c => <tr key={c.id}>
            <td><strong>{c.payment?.clientOrderId || '—'}</strong></td>
            <td>₹{Number(c.payment?.amount || 0).toFixed(2)}</td>
            <td>{c.filedBy === 'CUSTOMER' ? 'Customer' : 'You'}</td>
            <td className="max-w-[320px]"><span title={c.message}>{c.message.length > 90 ? `${c.message.slice(0, 90)}…` : c.message}</span>{c.adminNotes && <small className="mt-1 block text-muted">Pay-Panda: {c.adminNotes}</small>}</td>
            <td><StatusBadge status={c.status} /></td>
            <td>{new Date(c.createdAt).toLocaleDateString()}</td>
          </tr>) : <tr><td colSpan="6" className="empty-cell px-5 py-12 text-center text-muted">No complaints filed yet.</td></tr>}
      </tbody></table></div>
      {pagination.pages > 1 && <div className="admin-pagination">
        <button className="secondary-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line bg-transparent px-4 text-small font-bold text-text transition hover:border-accent" disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>Previous</button>
        <span>Page {pagination.page} of {pagination.pages}</span>
        <button className="secondary-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line bg-transparent px-4 text-small font-bold text-text transition hover:border-accent" disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)}>Next</button>
      </div>}
    </article>
  </div>;
}
