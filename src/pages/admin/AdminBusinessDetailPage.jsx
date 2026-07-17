import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ShieldOff, ShieldCheck, RefreshCw, X, Layers, Landmark } from 'lucide-react';
import adminApi from '../../lib/adminApi';
import PageHeader from '../../components/PageHeader';
import { useUi } from '../../state/ui-store';
import useModalEnter from '../../hooks/useModalEnter';

export default function AdminBusinessDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [paymentTotals, setPaymentTotals] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuspend, setShowSuspend] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const modalRef = useRef(null);
  const { toast, confirm } = useUi();
  useModalEnter(modalRef, '.modal-card', showSuspend);

  const load = () => {
    setLoading(true);
    Promise.all([adminApi.get(`/admin/businesses/${id}`), adminApi.get('/admin/plans')])
      .then(([b, p]) => { setBusiness(b.data.business); setPaymentTotals(b.data.paymentTotals); setPlans(p.data.plans); })
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

  if (loading) return <div className="empty-cell"><RefreshCw className="spin"/> Loading business…</div>;
  if (!business) return <div className="empty-state"><h4>Business not found</h4><p>It may have been removed.</p></div>;

  return <div>
    <button className="text-back" onClick={() => navigate('/admin/businesses')}><ArrowLeft size={14}/>Back to businesses</button>
    <PageHeader eyebrow="Business" title={business.name} description={business.supportEmail || 'No support email on file.'}
      action={business.suspendedAt
        ? <button className="info-button" onClick={unsuspend}><ShieldCheck size={16}/>Unsuspend</button>
        : <button className="risk-button" onClick={() => setShowSuspend(true)}><ShieldOff size={16}/>Suspend</button>} />

    {business.suspendedAt && <div className="alert error">Suspended {new Date(business.suspendedAt).toLocaleString()}{business.suspensionReason ? ` — ${business.suspensionReason}` : ''}</div>}

    <section className="metric-grid">
      <article className="metric-card violet"><p>Users</p><strong>{business.users.length}</strong></article>
      <article className="metric-card blue"><p>Connections</p><strong>{business.connections.length}</strong></article>
      <article className="metric-card green"><p>Successful payments</p><strong>{paymentTotals?.count ?? 0}</strong></article>
      <article className="metric-card amber"><p>Collected amount</p><strong>₹{(paymentTotals?.amount || 0).toLocaleString('en-IN')}</strong></article>
    </section>

    <section className="admin-grid">
      <article className="panel">
        <div className="panel-heading"><div><h3>Subscription plan</h3><p>Assign or change this business's plan.</p></div></div>
        <div className="select-wrap admin-plan-select"><Layers/><select value={business.planId || ''} onChange={changePlan}><option value="">No plan</option>{plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div className="admin-platform-toggle">
          <div><strong>Platform fee collector</strong><p>{business.isPlatform ? 'This business collects Pay-Panda subscription fee payments.' : 'Not currently collecting platform fees.'}</p></div>
          <button className={business.isPlatform ? 'risk-button' : 'info-button'} onClick={togglePlatform}><Landmark size={14}/>{business.isPlatform ? 'Unset' : 'Set as platform'}</button>
        </div>
      </article>
      <article className="panel">
        <div className="panel-heading"><div><h3>Users</h3></div></div>
        <div className="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead><tbody>
          {business.users.length ? business.users.map(u => <tr key={u.id}><td><strong>{u.name}</strong></td><td>{u.email}</td><td>{u.role}</td></tr>) : <tr><td colSpan="3" className="empty-cell">No users yet.</td></tr>}
        </tbody></table></div>
      </article>
    </section>

    <article className="panel">
      <div className="panel-heading"><div><h3>Merchant connections</h3></div></div>
      <div className="table-wrap"><table><thead><tr><th>Provider</th><th>Label</th><th>Merchant</th><th>Status</th></tr></thead><tbody>
        {business.connections.length ? business.connections.map(c => <tr key={c.id}><td>{c.provider}</td><td>{c.label || '—'}</td><td>{c.merchantName || '—'}</td><td><span className={`status status-${c.status.toLowerCase()}`}><i/>{c.status}</span></td></tr>) : <tr><td colSpan="4" className="empty-cell">No connections yet.</td></tr>}
      </tbody></table></div>
    </article>

    {showSuspend && <div className="modal-backdrop" ref={modalRef} onMouseDown={() => setShowSuspend(false)}>
      <div className="modal-card" onMouseDown={e => e.stopPropagation()}>
        <button className="modal-close" onClick={() => setShowSuspend(false)}><X/></button>
        <h2>Suspend {business.name}</h2>
        <form onSubmit={submitSuspend}>
          <label>Reason<textarea className="admin-textarea" required minLength={3} maxLength={500} rows={4} value={reason} onChange={e => setReason(e.target.value)} placeholder="Explain why this business is being suspended…" /></label>
          <button className="primary-button" disabled={busy}>{busy ? 'Suspending…' : 'Suspend business'}</button>
        </form>
      </div>
    </div>}
  </div>;
}
