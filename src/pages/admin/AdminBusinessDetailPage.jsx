import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldOff, ShieldCheck, RefreshCw, X, Layers, Landmark, Building2, KeyRound, Link2, ReceiptIndianRupee, Store, ToggleLeft, ToggleRight } from 'lucide-react';
import adminApi from '../../lib/adminApi';
import PageHeader from '../../components/PageHeader';
import TrendChart from '../../components/charts/TrendChart';
import RankedBars from '../../components/charts/RankedBars';
import { useUi } from '../../state/ui-store';
import useModalEnter from '../../hooks/useModalEnter';

export default function AdminBusinessDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [paymentTotals, setPaymentTotals] = useState(null);
  const [paymentStatusBreakdown, setPaymentStatusBreakdown] = useState({});
  const [mainUnitTotals, setMainUnitTotals] = useState(null);
  const [trend, setTrend] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [providerTransactions, setProviderTransactions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuspend, setShowSuspend] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [unitBusy, setUnitBusy] = useState(false);
  const [unitForm, setUnitForm] = useState({ name: '', code: '', description: '' });
  const modalRef = useRef(null);
  const { toast, confirm } = useUi();
  useModalEnter(modalRef, '.modal-card', showSuspend);

  const load = () => {
    setLoading(true);
    Promise.all([adminApi.get(`/admin/businesses/${id}`), adminApi.get('/admin/plans')])
      .then(([b, p]) => {
        setBusiness(b.data.business);
        setPaymentTotals(b.data.paymentTotals);
        setPaymentStatusBreakdown(b.data.paymentStatusBreakdown || {});
        setMainUnitTotals(b.data.mainUnitTotals || null);
        setTrend(b.data.trend || []);
        setRecentPayments(b.data.recentPayments || []);
        setProviderTransactions(b.data.recentProviderTransactions || []);
        setPlans(p.data.plans);
      })
      .catch(() => toast('Could not load business', 'error')).finally(() => setLoading(false));
  };
  useEffect(load, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitSuspend = async event => {
    event.preventDefault();
    if (!reason.trim()) return;
    setBusy(true);
    try {
      await adminApi.patch(`/admin/businesses/${id}/suspend`, { reason });
      toast(`${business.name} has been suspended`, 'success');
      setShowSuspend(false); setReason(''); load();
    } catch (err) { toast(err.response?.data?.message || 'Could not suspend business', 'error'); }
    finally { setBusy(false); }
  };

  const unsuspend = async () => {
    const ok = await confirm({ title: 'Unsuspend business', message: `Restore access for ${business.name}?`, confirmLabel: 'Unsuspend', tone: 'warning' });
    if (!ok) return;
    try {
      await adminApi.patch(`/admin/businesses/${id}/unsuspend`);
      toast(`${business.name} has been unsuspended`, 'success');
      load();
    } catch (err) { toast(err.response?.data?.message || 'Could not unsuspend business', 'error'); }
  };

  const changePlan = async event => {
    const planId = event.target.value || null;
    try {
      const { data } = await adminApi.patch(`/admin/businesses/${id}/plan`, { planId });
      setBusiness(data.business);
      toast('Plan updated', 'success');
    } catch (err) { toast(err.response?.data?.message || 'Could not update plan', 'error'); }
  };

  const togglePlatform = async () => {
    const next = !business.isPlatform;
    const ok = await confirm({
      title: next ? 'Set as platform account' : 'Unset platform account',
      message: next
        ? `${business.name}'s active BharatPe connection will start collecting Pay-Panda's platform fee payments from every business. Only one business can hold this role at a time.`
        : `${business.name} will stop collecting platform fee payments.`,
      confirmLabel: next ? 'Set as platform' : 'Unset',
      tone: 'warning',
    });
    if (!ok) return;
    try {
      const { data } = await adminApi.patch(`/admin/businesses/${id}/platform`, { isPlatform: next });
      setBusiness(data.business);
      toast(next ? 'This business now collects platform fees' : 'Platform designation removed', 'success');
    } catch (err) { toast(err.response?.data?.message || 'Could not update platform designation', 'error'); }
  };

  const createUnit = async event => {
    event.preventDefault();
    setUnitBusy(true);
    try {
      await adminApi.post(`/admin/businesses/${id}/business-units`, { ...unitForm, code: slug(unitForm.code || unitForm.name) });
      setUnitForm({ name: '', code: '', description: '' });
      toast('Sub-business created for this business', 'success');
      load();
    } catch (err) { toast(err.response?.data?.message || 'Could not create sub-business', 'error'); }
    finally { setUnitBusy(false); }
  };

  const toggleUnit = async unit => {
    try {
      await adminApi.patch(`/admin/businesses/${id}/business-units/${unit.id}`, { active: !unit.active });
      toast(!unit.active ? 'Sub-business enabled' : 'Sub-business disabled', 'success');
      load();
    } catch (err) { toast(err.response?.data?.message || 'Could not update sub-business', 'error'); }
  };

  if (loading) return <div className="empty-cell px-5 py-12 text-center text-muted"><RefreshCw className="spin animate-spin"/> Loading business…</div>;
  if (!business) return <div className="empty-state grid place-items-center px-5 py-12 text-center text-muted"><h4>Business not found</h4><p>It may have been removed.</p></div>;

  return <div>
    <button className="text-back" onClick={() => navigate('/admin/businesses')}><ArrowLeft size={14}/>Back to businesses</button>
    <PageHeader eyebrow="Business" title={business.name} description={business.supportEmail || 'No support email on file.'}
      action={business.suspendedAt
        ? <button className="info-button inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-line bg-panel px-3 text-small text-text transition hover:border-accent" onClick={unsuspend}><ShieldCheck size={16}/>Unsuspend</button>
        : <button className="risk-button inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-red/25 bg-red/10 px-3 text-small text-red transition hover:bg-red/15" onClick={() => setShowSuspend(true)}><ShieldOff size={16}/>Suspend</button>} />

    {business.suspendedAt && <div className="alert mt-4 rounded-xl px-4 py-3 text-small error border border-red/25 bg-red/10 text-red">Suspended {new Date(business.suspendedAt).toLocaleString()}{business.suspensionReason ? ` — ${business.suspensionReason}` : ''}</div>}

    <section className="metric-grid grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
      <article className="metric-card relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel p-5 shadow-panel violet"><p>Users</p><strong>{business.users.length}</strong></article>
      <article className="metric-card relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel p-5 shadow-panel blue"><p>Connections</p><strong>{business.connections.length}</strong></article>
      <article className="metric-card relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel p-5 shadow-panel amber"><p>Sub-businesses</p><strong>{business.businessUnits?.length || 0}</strong></article>
      <article className="metric-card relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel p-5 shadow-panel green"><p>Successful payments</p><strong>{paymentTotals?.count ?? 0}</strong></article>
      <article className="metric-card relative overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel p-5 shadow-panel blue"><p>Collected amount</p><strong>₹{(paymentTotals?.amount || 0).toLocaleString('en-IN')}</strong></article>
    </section>

    <section className="admin-grid grid grid-cols-2 gap-5 max-lg:grid-cols-1">
      <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
        <div className="panel-heading flex items-center justify-between gap-4 border-b border-line px-6 py-5"><div><h3>Subscription plan</h3><p>Assign or change this business's plan.</p></div></div>
        <div className="select-wrap admin-plan-select"><Layers/><select value={business.planId || ''} onChange={changePlan}><option value="">No plan</option>{plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div className="admin-platform-toggle">
          <div><strong>Platform fee collector</strong><p>{business.isPlatform ? 'This business collects Pay-Panda subscription fee payments.' : 'Not currently collecting platform fees.'}</p></div>
          <button className={business.isPlatform ? 'risk-button' : 'info-button'} onClick={togglePlatform}><Landmark size={14}/>{business.isPlatform ? 'Unset' : 'Set as platform'}</button>
        </div>
        <div className="admin-supervision-list">
          <div><KeyRound size={15}/><span>API credentials</span><strong>{business._count?.apiClients || 0}</strong></div>
          <div><ReceiptIndianRupee size={15}/><span>All sessions</span><strong>{business._count?.payments || 0}</strong></div>
          <div><Link2 size={15}/><span>Default link</span><strong>{business.defaultLink?.active ? 'Active' : 'None'}</strong></div>
        </div>
      </article>
      <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
        <div className="panel-heading flex items-center justify-between gap-4 border-b border-line px-6 py-5"><div><h3>Users</h3></div></div>
        <div className="table-wrap w-full overflow-auto"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead><tbody>
          {business.users.length ? business.users.map(u => <tr key={u.id}><td><strong>{u.name}</strong><small>{u.mobile || '—'}</small></td><td>{u.email}<small>{u.emailVerifiedAt ? 'Activated' : 'Not activated'}</small></td><td>{u.role}</td></tr>) : <tr><td colSpan="3" className="empty-cell px-5 py-12 text-center text-muted">No users yet.</td></tr>}
        </tbody></table></div>
      </article>
    </section>

    <section className="admin-grid grid grid-cols-2 gap-5 max-lg:grid-cols-1">
      <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
        <div className="panel-heading flex items-center justify-between gap-4 border-b border-line px-6 py-5"><div><h3>Payment volume</h3><p>Last 30 days, this business only.</p></div></div>
        <div className="panel-body p-6"><TrendChart data={trend} ariaLabel={`Successful payment volume for ${business.name}`} emptyMessage="No payment activity in the last 30 days." /></div>
      </article>
      <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
        <div className="panel-heading flex items-center justify-between gap-4 border-b border-line px-6 py-5"><div><h3>Sub-business comparison</h3><p>Collected amount by unit, including the main business.</p></div></div>
        <RankedBars items={[
          { id: 'main', label: 'Main business', amount: Number(mainUnitTotals?.amount || 0), count: mainUnitTotals?.count || 0, successRate: null },
          ...(business.businessUnits || []).map(unit => ({ id: unit.id, label: unit.name, amount: Number(unit.totals?.amount || 0), count: unit.totals?.count || 0, successRate: null })),
        ].filter(item => item.count > 0)} emptyMessage="No successful payments yet." />
      </article>
    </section>

    <section className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
      <div className="panel-heading flex items-center justify-between gap-4 border-b border-line px-6 py-5"><div><h3>Sub-business supervision</h3><p>Collections are still settled through the same business account, but reporting is separated by unit.</p></div><Building2/></div>
      <form className="admin-inline-create" onSubmit={createUnit}>
        <label>Name<input required placeholder="Branch A, Retail counter…" value={unitForm.name} onChange={e => setUnitForm({ ...unitForm, name: e.target.value, code: unitForm.code || slug(e.target.value) })}/></label>
        <label>Code<input required placeholder="branch-a" value={unitForm.code} onChange={e => setUnitForm({ ...unitForm, code: sanitizeCodeInput(e.target.value) })}/></label>
        <label>Description<input placeholder="Optional internal note" value={unitForm.description} onChange={e => setUnitForm({ ...unitForm, description: e.target.value })}/></label>
        <button className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60 compact min-h-10 px-3 text-small" disabled={unitBusy}>{unitBusy ? <RefreshCw className="spin animate-spin"/> : <Store/>}{unitBusy ? 'Creating…' : 'Create sub-business'}</button>
      </form>
      <div className="table-wrap w-full overflow-auto"><table><thead><tr><th>Unit</th><th>Code</th><th>Status</th><th>Payments</th><th>Total amount</th><th></th></tr></thead><tbody>
        <tr><td><strong>Main business</strong><small>Payments without a sub-business tag</small></td><td>main</td><td><span className="status inline-flex items-center gap-1.5 rounded-full bg-text/5 px-2 py-1 text-micro font-extrabold uppercase tracking-wide status-active bg-green/10 text-green"><i/>ACTIVE</span></td><td>{mainUnitTotals?.count || 0}</td><td>₹{Number(mainUnitTotals?.amount || 0).toLocaleString('en-IN')}</td><td><span className="muted-dash">—</span></td></tr>
        {business.businessUnits?.length ? business.businessUnits.map(unit => <tr key={unit.id}><td><strong>{unit.name}</strong><small>{unit.description || '—'}</small></td><td><code>{unit.code}</code></td><td><span className={`status inline-flex items-center gap-1.5 rounded-full bg-text/5 px-2 py-1 text-micro font-extrabold uppercase tracking-wide ${unit.active ? 'status-active' : 'status-failed'}`}><i/>{unit.active ? 'ACTIVE' : 'DISABLED'}</span></td><td>{unit.totals?.count || 0}</td><td>₹{Number(unit.totals?.amount || 0).toLocaleString('en-IN')}</td><td><button className="text-action" onClick={() => toggleUnit(unit)}>{unit.active ? <ToggleRight/> : <ToggleLeft/>}{unit.active ? 'Disable' : 'Enable'}</button></td></tr>) : null}
      </tbody></table></div>
    </section>

    <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
      <div className="panel-heading flex items-center justify-between gap-4 border-b border-line px-6 py-5"><div><h3>Merchant connections</h3><p>Super-admin can inspect operational setup without exposing stored tokens.</p></div></div>
      <div className="table-wrap w-full overflow-auto"><table><thead><tr><th>Provider</th><th>Label</th><th>Merchant</th><th>Bank / UPI</th><th>Status</th></tr></thead><tbody>
        {business.connections.length ? business.connections.map(c => <tr key={c.id}><td><strong>{c.provider}</strong><small>{c.mobile || '—'}</small></td><td>{c.label || '—'}<small>{c.isDefault ? 'Default account' : '—'}</small></td><td><strong>{c.legalBusinessName || c.merchantName || '—'}</strong><small>{c.merchantId || c.merchantMid || '—'}</small></td><td><strong>{c.bankName || '—'}</strong><small>{c.upiId || c.maskedAccountNumber || c.ifsc || '—'}</small></td><td><span className={`status inline-flex items-center gap-1.5 rounded-full bg-text/5 px-2 py-1 text-micro font-extrabold uppercase tracking-wide status-${c.status.toLowerCase()}`}><i/>{c.status}</span><small>{c.autoSettlement ? 'Auto settlement' : c.lastError || '—'}</small></td></tr>) : <tr><td colSpan="5" className="empty-cell px-5 py-12 text-center text-muted">No connections yet.</td></tr>}
      </tbody></table></div>
    </article>

    <section className="admin-grid grid grid-cols-2 gap-5 max-lg:grid-cols-1">
      <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
        <div className="panel-heading flex items-center justify-between gap-4 border-b border-line px-6 py-5"><div><h3>Payment status</h3><p>All Pay-Panda payment sessions for this business.</p></div></div>
        <div className="admin-status-stack">
          {['SUCCESS', 'PENDING', 'FAILED', 'EXPIRED'].map(status => <div key={status}><span className={`status inline-flex items-center gap-1.5 rounded-full bg-text/5 px-2 py-1 text-micro font-extrabold uppercase tracking-wide status-${status.toLowerCase()}`}><i/>{status}</span><strong>{paymentStatusBreakdown[status]?.count || 0}</strong><small>₹{Number(paymentStatusBreakdown[status]?.amount || 0).toLocaleString('en-IN')}</small></div>)}
        </div>
      </article>
      <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
        <div className="panel-heading flex items-center justify-between gap-4 border-b border-line px-6 py-5"><div><h3>API clients</h3><p>Server-to-server apps created by the business.</p></div></div>
        <div className="table-wrap w-full overflow-auto compact-table"><table><thead><tr><th>App</th><th>Status</th><th>Last used</th></tr></thead><tbody>
          {business.apiClients?.length ? business.apiClients.map(client => <tr key={client.id}><td><strong>{client.name}</strong><small><code>{client.appId}</code></small></td><td><span className={`status inline-flex items-center gap-1.5 rounded-full bg-text/5 px-2 py-1 text-micro font-extrabold uppercase tracking-wide ${client.active ? 'status-active' : 'status-disabled'}`}><i/>{client.active ? 'ACTIVE' : 'REVOKED'}</span></td><td>{formatDate(client.lastUsedAt)}</td></tr>) : <tr><td colSpan="3" className="empty-cell px-5 py-12 text-center text-muted">No API clients yet.</td></tr>}
        </tbody></table></div>
      </article>
    </section>

    <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
      <div className="panel-heading flex items-center justify-between gap-4 border-b border-line px-6 py-5"><div><h3>Latest Pay-Panda payments</h3><p>Only sessions created through Pay-Panda dashboard/API/default links are shown.</p></div></div>
      <div className="table-wrap w-full overflow-auto"><table><thead><tr><th>Order</th><th>Sub-business</th><th>Customer / payer</th><th>Connection</th><th>Amount</th><th>Status</th><th>Created / Paid</th><th>RRN</th></tr></thead><tbody>
        {recentPayments.length ? recentPayments.map(payment => <tr key={payment.id}><td><strong>{payment.clientOrderId}</strong><small>{payment.source}</small></td><td><strong>{payment.businessUnit?.name || 'Main'}</strong><small>{payment.businessUnit?.code || 'main'}</small></td><td><strong>{payment.payerName || payment.customerName || '—'}</strong><small>{payment.payerHandle || payment.customerMobile || payment.reason || '—'}</small></td><td><strong>{payment.connection?.provider || '—'}</strong><small>{payment.connection?.legalBusinessName || payment.connection?.merchantId || '—'}</small></td><td>₹{Number(payment.amount).toFixed(2)}</td><td><span className={`status inline-flex items-center gap-1.5 rounded-full bg-text/5 px-2 py-1 text-micro font-extrabold uppercase tracking-wide status-${payment.status.toLowerCase()}`}><i/>{payment.status}</span></td><td>{formatDate(payment.createdAt)}<small>Paid: {formatDate(payment.paidAt)}</small></td><td><code>{payment.bankReferenceNo || '—'}</code></td></tr>) : <tr><td colSpan="8" className="empty-cell px-5 py-12 text-center text-muted">No Pay-Panda payments yet.</td></tr>}
      </tbody></table></div>
    </article>

    <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
      <div className="panel-heading flex items-center justify-between gap-4 border-b border-line px-6 py-5"><div><h3>Latest provider transactions</h3><p>BharatPe transaction snapshots imported during verification/reconciliation.</p></div></div>
      <div className="table-wrap w-full overflow-auto"><table><thead><tr><th>Provider</th><th>Merchant</th><th>Payer</th><th>Amount</th><th>Status</th><th>Paid time</th><th>Bank RRN</th></tr></thead><tbody>
        {providerTransactions.length ? providerTransactions.map(txn => <tr key={txn.id}><td>{txn.provider}<small>{txn.type || '—'}</small></td><td><strong>{txn.merchantId}</strong><small>{txn.payeeIdentifier || '—'}</small></td><td><strong>{txn.payerName || '—'}</strong><small>{txn.payerHandle || '—'}</small></td><td>₹{Number(txn.amount).toFixed(2)}</td><td><span className={`status inline-flex items-center gap-1.5 rounded-full bg-text/5 px-2 py-1 text-micro font-extrabold uppercase tracking-wide status-${String(txn.status).toLowerCase()}`}><i/>{txn.status}</span></td><td>{formatDate(txn.paymentTimestamp)}</td><td><code>{txn.bankReferenceNo || txn.providerTransactionId || '—'}</code></td></tr>) : <tr><td colSpan="7" className="empty-cell px-5 py-12 text-center text-muted">No provider transactions imported yet.</td></tr>}
      </tbody></table></div>
    </article>

    {showSuspend && <div className="modal-backdrop fixed inset-0 z-[100] grid place-items-center bg-black/70 p-5 backdrop-blur-sm" ref={modalRef} onMouseDown={() => setShowSuspend(false)}>
      <div className="modal-card relative max-h-[90vh] w-[min(520px,100%)] overflow-auto rounded-[19px] border border-line bg-panel p-7 shadow-elevated" onMouseDown={e => e.stopPropagation()}>
        <button className="modal-close absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl border border-line bg-transparent text-text transition hover:border-accent" onClick={() => setShowSuspend(false)}><X/></button>
        <h2>Suspend {business.name}</h2>
        <form onSubmit={submitSuspend}>
          <label>Reason<textarea className="admin-textarea w-full rounded-xl border border-line bg-panel-inset p-3 text-body text-text outline-none focus:border-accent" required minLength={3} maxLength={500} rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why this business is being suspended…" /></label>
          <button className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60" disabled={busy}>{busy ? 'Suspending…' : 'Suspend business'}</button>
        </form>
      </div>
    </div>}
  </div>;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

// One-shot derivation from Name — safe to trim/collapse since it only runs once, not per keystroke.
function slug(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '-').replace(/^[-_]+|[-_]+$/g, '').slice(0, 40);
}

// Live typing in the Code field itself — never trims, or a trailing "-"/"_" (which is where it
// always lands while typing left-to-right) gets stripped back out before the next keystroke.
function sanitizeCodeInput(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
}
