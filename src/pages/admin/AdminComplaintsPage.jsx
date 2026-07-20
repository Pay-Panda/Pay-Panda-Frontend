import { useEffect, useRef, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import adminApi from '../../lib/adminApi';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { useUi } from '../../state/ui-store';
import useModalEnter from '../../hooks/useModalEnter';

const statuses = ['', 'OPEN', 'INVESTIGATING', 'RESOLVED'];

export default function AdminComplaintsPage() {
  const { toast } = useUi();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState({ status: 'OPEN', adminNotes: '' });
  const [busy, setBusy] = useState(false);
  const modalRef = useRef(null);
  useModalEnter(modalRef, '.modal-card', Boolean(detail));

  const load = (page = 1) => {
    setLoading(true);
    adminApi.get('/admin/complaints', { params: { page, status: status || undefined } })
      .then(({ data }) => { setItems(data.complaints); setPagination(data.pagination); })
      .catch(() => toast('Could not load complaints', 'error')).finally(() => setLoading(false));
  };
  useEffect(() => { load(1); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const openDetail = async complaint => {
    try {
      const { data } = await adminApi.get(`/admin/complaints/${complaint.id}`);
      setDetail(data.complaint);
      setForm({ status: data.complaint.status, adminNotes: data.complaint.adminNotes || '' });
    } catch { toast('Could not load complaint detail', 'error'); }
  };

  const save = async event => {
    event.preventDefault();
    setBusy(true);
    try {
      await adminApi.patch(`/admin/complaints/${detail.id}`, form);
      toast('Complaint updated', 'success');
      setDetail(null); load(pagination.page);
    } catch (err) { toast(err.response?.data?.message || 'Could not update complaint', 'error'); }
    finally { setBusy(false); }
  };

  return <div>
    <PageHeader eyebrow="Platform" title="Complaints" description="Payment disputes filed by customers (without login) or by businesses themselves, across every business on Pay-Panda." />
    <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
      <div className="table-tools flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <select className="admin-select h-10 rounded-xl border border-line bg-panel px-3 text-small text-text" value={status} onChange={e => setStatus(e.target.value)}>
          {statuses.map(item => <option key={item} value={item}>{item || 'All statuses'}</option>)}
        </select>
        <span>{pagination.total} complaints</span>
      </div>
      <div className="table-wrap w-full overflow-auto"><table><thead><tr><th>Business</th><th>Order</th><th>Amount</th><th>Filed by</th><th>Message</th><th>Status</th><th>Filed</th></tr></thead><tbody>
        {loading ? <tr><td colSpan="7" className="empty-cell px-5 py-12 text-center text-muted"><RefreshCw className="spin animate-spin"/> Loading…</td></tr>
          : items.length ? items.map(c => <tr key={c.id} className="cursor-pointer" onClick={() => openDetail(c)}>
            <td><strong>{c.business?.name}</strong></td>
            <td>{c.payment?.clientOrderId || '—'}</td>
            <td>₹{Number(c.payment?.amount || 0).toFixed(2)}</td>
            <td>{c.filedBy === 'CUSTOMER' ? 'Customer' : 'Business'}</td>
            <td className="max-w-[280px]"><span title={c.message}>{c.message.length > 70 ? `${c.message.slice(0, 70)}…` : c.message}</span></td>
            <td><StatusBadge status={c.status} /></td>
            <td>{new Date(c.createdAt).toLocaleDateString()}</td>
          </tr>) : <tr><td colSpan="7" className="empty-cell px-5 py-12 text-center text-muted">No complaints match this filter.</td></tr>}
      </tbody></table></div>
      {pagination.pages > 1 && <div className="admin-pagination">
        <button className="secondary-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line bg-transparent px-4 text-small font-bold text-text transition hover:border-accent" disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>Previous</button>
        <span>Page {pagination.page} of {pagination.pages} · {pagination.total} complaints</span>
        <button className="secondary-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line bg-transparent px-4 text-small font-bold text-text transition hover:border-accent" disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)}>Next</button>
      </div>}
    </article>
    {detail && <div className="modal-backdrop fixed inset-0 z-[100] grid place-items-center bg-black/70 p-5 backdrop-blur-sm" ref={modalRef} onMouseDown={() => setDetail(null)}>
      <div className="modal-card relative max-h-[90vh] w-[min(560px,100%)] overflow-auto rounded-[19px] border border-line bg-panel p-7 shadow-elevated" onMouseDown={e => e.stopPropagation()}>
        <button className="modal-close absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl border border-line bg-transparent text-text transition hover:border-accent" onClick={() => setDetail(null)}><X/></button>
        <h2>Complaint on {detail.business?.name}</h2>
        <p><strong>{detail.payment?.clientOrderId}</strong> · ₹{Number(detail.payment?.amount || 0).toFixed(2)} · payment status {detail.payment?.status}</p>
        <p>Filed by {detail.filedBy === 'CUSTOMER' ? 'the customer' : 'the business'}{detail.filerName ? ` (${detail.filerName})` : ''}{detail.filerContact ? ` — ${detail.filerContact}` : ''}</p>
        <blockquote className="mt-3 rounded-xl border border-line bg-panel-inset p-3 text-small">{detail.message}</blockquote>
        <form onSubmit={save} className="mt-4">
          <label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="OPEN">Open</option><option value="INVESTIGATING">Investigating</option><option value="RESOLVED">Resolved</option>
          </select></label>
          <label>Internal notes<textarea className="admin-textarea w-full rounded-xl border border-line bg-panel-inset p-3 text-body text-text outline-none focus:border-accent" maxLength={2000} rows={4} value={form.adminNotes} onChange={e => setForm({ ...form, adminNotes: e.target.value })} placeholder="Notes visible to your team and the business…" /></label>
          <button className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </form>
      </div>
    </div>}
  </div>;
}
