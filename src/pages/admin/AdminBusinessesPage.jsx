import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, X, ShieldOff, ShieldCheck } from 'lucide-react';
import adminApi from '../../lib/adminApi';
import PageHeader from '../../components/PageHeader';
import { useUi } from '../../state/ui-store';
import useModalEnter from '../../hooks/useModalEnter';

export default function AdminBusinessesPage() {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const modalRef = useRef(null);
  const { toast, confirm } = useUi();
  useModalEnter(modalRef, '.modal-card', Boolean(suspendTarget));

  const load = (page = 1) => {
    setLoading(true);
    adminApi.get('/admin/businesses', { params: { page, search: search || undefined, status: status || undefined } })
      .then(({ data }) => { setItems(data.businesses); setPagination(data.pagination); })
      .catch(() => toast('Could not load businesses', 'error')).finally(() => setLoading(false));
  };
  useEffect(() => { const t = setTimeout(() => load(1), 300); return () => clearTimeout(t); }, [search, status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setReason(''); }, [suspendTarget]);

  const submitSuspend = async event => {
    event.preventDefault();
    if (!reason.trim()) return;
    setBusy(true);
    try {
      await adminApi.patch(`/admin/businesses/${suspendTarget.id}/suspend`, { reason });
      toast(`${suspendTarget.name} has been suspended`, 'success');
      setSuspendTarget(null); setReason(''); load(pagination.page);
    } catch (err) { toast(err.response?.data?.message || 'Could not suspend business', 'error'); }
    finally { setBusy(false); }
  };

  const unsuspend = async business => {
    const ok = await confirm({ title: 'Unsuspend business', message: `Restore access for ${business.name}?`, confirmLabel: 'Unsuspend', tone: 'warning' });
    if (!ok) return;
    try {
      await adminApi.patch(`/admin/businesses/${business.id}/unsuspend`);
      toast(`${business.name} has been unsuspended`, 'success');
      load(pagination.page);
    } catch (err) { toast(err.response?.data?.message || 'Could not unsuspend business', 'error'); }
  };

  return <div>
    <PageHeader eyebrow="Platform" title="Businesses" description="Search, review, and manage every business on Pay-Panda." />
    <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
      <div className="table-tools flex flex-wrap items-center justify-between gap-4 px-5 py-4">
        <div className="search-box relative w-[min(400px,70%)] max-sm:w-full"><Search/><input placeholder="Search by business name…" value={search} onChange={e => setSearch(e.target.value)} /></div>
        <select className="admin-select h-10 rounded-xl border border-line bg-panel px-3 text-small text-text" value={status} onChange={e => setStatus(e.target.value)}><option value="">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
      </div>
      <div className="table-wrap w-full overflow-auto"><table><thead><tr><th>Business</th><th>Plan</th><th>Users</th><th>Payments</th><th>Status</th><th></th></tr></thead><tbody>
        {loading ? <tr><td colSpan="6" className="empty-cell px-5 py-12 text-center text-muted"><RefreshCw className="spin animate-spin"/> Loading…</td></tr>
          : items.length ? items.map(b => <tr key={b.id}>
            <td><Link to={`/admin/businesses/${b.id}`}><strong>{b.name}</strong><small>{b.supportEmail || '—'}</small></Link></td>
            <td>{b.plan?.name || 'No plan'}</td>
            <td>{b._count.users}</td>
            <td>{b._count.payments}</td>
            <td><span className={`status inline-flex items-center gap-1.5 rounded-full bg-text/5 px-2 py-1 text-micro font-extrabold uppercase tracking-wide ${b.suspendedAt ? 'status-failed' : 'status-active'}`}><i/>{b.suspendedAt ? 'Suspended' : 'Active'}</span></td>
            <td>{b.suspendedAt
              ? <button className="info-button inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-line bg-panel px-3 text-small text-text transition hover:border-accent" onClick={() => unsuspend(b)}><ShieldCheck size={14}/>Unsuspend</button>
              : <button className="risk-button inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-red/25 bg-red/10 px-3 text-small text-red transition hover:bg-red/15" onClick={() => setSuspendTarget(b)}><ShieldOff size={14}/>Suspend</button>}</td>
          </tr>) : <tr><td colSpan="6" className="empty-cell px-5 py-12 text-center text-muted">No businesses match your filters.</td></tr>}
      </tbody></table></div>
      {pagination.pages > 1 && <div className="admin-pagination">
        <button className="secondary-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line bg-transparent px-4 text-small font-bold text-text transition hover:border-accent" disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)}>Previous</button>
        <span>Page {pagination.page} of {pagination.pages} · {pagination.total} businesses</span>
        <button className="secondary-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-line bg-transparent px-4 text-small font-bold text-text transition hover:border-accent" disabled={pagination.page >= pagination.pages} onClick={() => load(pagination.page + 1)}>Next</button>
      </div>}
    </article>
    {suspendTarget && <div className="modal-backdrop fixed inset-0 z-[100] grid place-items-center bg-black/70 p-5 backdrop-blur-sm" ref={modalRef} onMouseDown={() => setSuspendTarget(null)}>
      <div className="modal-card relative max-h-[90vh] w-[min(520px,100%)] overflow-auto rounded-[19px] border border-line bg-panel p-7 shadow-elevated" onMouseDown={e => e.stopPropagation()}>
        <button className="modal-close absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl border border-line bg-transparent text-text transition hover:border-accent" onClick={() => setSuspendTarget(null)}><X/></button>
        <h2>Suspend {suspendTarget.name}</h2>
        <form onSubmit={submitSuspend}>
          <label>Reason<textarea className="admin-textarea w-full rounded-xl border border-line bg-panel-inset p-3 text-body text-text outline-none focus:border-accent" required minLength={3} maxLength={500} rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why this business is being suspended…" /></label>
          <button className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60" disabled={busy}>{busy ? 'Suspending…' : 'Suspend business'}</button>
        </form>
      </div>
    </div>}
  </div>;
}
