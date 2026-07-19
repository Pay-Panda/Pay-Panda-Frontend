import { useEffect, useRef, useState } from 'react';
import { Plus, X, Pencil, Archive, RefreshCw } from 'lucide-react';
import adminApi from '../../lib/adminApi';
import PageHeader from '../../components/PageHeader';
import { useUi } from '../../state/ui-store';
import useModalEnter from '../../hooks/useModalEnter';

const emptyForm = { name: '', price: '', monthlyPaymentLimit: '', features: '', isActive: true, sortOrder: 0 };

export default function AdminPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const modalRef = useRef(null);
  const { toast, confirm } = useUi();
  useModalEnter(modalRef, '.modal-card', Boolean(editing));

  const load = () => {
    setLoading(true);
    adminApi.get('/admin/plans').then(({ data }) => setPlans(data.plans))
      .catch(() => toast('Could not load plans', 'error')).finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => { setForm(emptyForm); setEditing('new'); };
  const openEdit = plan => { setForm({
    name: plan.name, price: String(plan.price), monthlyPaymentLimit: plan.monthlyPaymentLimit ?? '',
    features: (plan.features || []).join('\n'), isActive: plan.isActive, sortOrder: plan.sortOrder,
  }); setEditing(plan.id); };

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    const payload = {
      name: form.name, price: Number(form.price),
      monthlyPaymentLimit: form.monthlyPaymentLimit === '' ? null : Number(form.monthlyPaymentLimit),
      features: form.features.split('\n').map(f => f.trim()).filter(Boolean),
      isActive: form.isActive, sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      if (editing === 'new') await adminApi.post('/admin/plans', payload);
      else await adminApi.patch(`/admin/plans/${editing}`, payload);
      toast(editing === 'new' ? 'Plan created' : 'Plan updated', 'success');
      setEditing(null); load();
    } catch (err) { toast(err.response?.data?.message || 'Could not save plan', 'error'); }
    finally { setBusy(false); }
  };

  const archive = async plan => {
    const ok = await confirm({ title: 'Archive plan', message: `Archive "${plan.name}"? Businesses already on this plan keep it, but it won't be assignable to new businesses.`, confirmLabel: 'Archive', tone: 'danger' });
    if (!ok) return;
    try { await adminApi.patch(`/admin/plans/${plan.id}/archive`); toast('Plan archived', 'success'); load(); }
    catch (err) { toast(err.response?.data?.message || 'Could not archive plan', 'error'); }
  };

  return <div>
    <PageHeader eyebrow="Platform" title="Plans" description="Manage the subscription plans businesses can be assigned to."
      action={<button className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60 compact min-h-10 px-3 text-small" onClick={openCreate}><Plus size={17}/>New plan</button>} />
    <article className="panel overflow-hidden rounded-[var(--radius-lg)] border border-line bg-panel shadow-panel">
      <div className="table-wrap w-full overflow-auto"><table><thead><tr><th>Plan</th><th>Price</th><th>Monthly limit</th><th>Businesses</th><th>Status</th><th></th></tr></thead><tbody>
        {loading ? <tr><td colSpan="6" className="empty-cell px-5 py-12 text-center text-muted"><RefreshCw className="spin animate-spin"/> Loading…</td></tr>
          : plans.length ? plans.map(p => <tr key={p.id}>
            <td><strong>{p.name}</strong></td>
            <td>₹{Number(p.price).toLocaleString('en-IN')}</td>
            <td>{p.monthlyPaymentLimit ?? 'Unlimited'}</td>
            <td>{p._count.businesses}</td>
            <td><span className={`status inline-flex items-center gap-1.5 rounded-full bg-text/5 px-2 py-1 text-micro font-extrabold uppercase tracking-wide ${p.isActive ? 'status-active' : 'status-expired'}`}><i/>{p.isActive ? 'Active' : 'Archived'}</span></td>
            <td className="header-actions">
              <button className="info-button inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-line bg-panel px-3 text-small text-text transition hover:border-accent" onClick={() => openEdit(p)}><Pencil size={14}/>Edit</button>
              {p.isActive && <button className="risk-button inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-red/25 bg-red/10 px-3 text-small text-red transition hover:bg-red/15" onClick={() => archive(p)}><Archive size={14}/>Archive</button>}
            </td>
          </tr>) : <tr><td colSpan="6" className="empty-cell px-5 py-12 text-center text-muted">No plans yet. Create one to get started.</td></tr>}
      </tbody></table></div>
    </article>

    {editing && <div className="modal-backdrop fixed inset-0 z-[100] grid place-items-center bg-black/70 p-5 backdrop-blur-sm" ref={modalRef} onMouseDown={() => setEditing(null)}>
      <div className="modal-card relative max-h-[90vh] w-[min(520px,100%)] overflow-auto rounded-[19px] border border-line bg-panel p-7 shadow-elevated" onMouseDown={e => e.stopPropagation()}>
        <button className="modal-close absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-xl border border-line bg-transparent text-text transition hover:border-accent" onClick={() => setEditing(null)}><X/></button>
        <h2>{editing === 'new' ? 'New plan' : 'Edit plan'}</h2>
        <form onSubmit={submit}>
          <label>Plan name<input required maxLength={80} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></label>
          <div className="form-grid grid grid-cols-2 gap-4 max-md:grid-cols-1">
            <label>Price (₹/month)<input type="number" required min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}/></label>
            <label>Monthly payment limit<input type="number" min="0" placeholder="Unlimited" value={form.monthlyPaymentLimit} onChange={e => setForm({ ...form, monthlyPaymentLimit: e.target.value })}/></label>
          </div>
          <label>Features (one per line)<textarea className="admin-textarea w-full rounded-xl border border-line bg-panel-inset p-3 text-body text-text outline-none focus:border-accent" rows={4} value={form.features} onChange={e => setForm({ ...form, features: e.target.value })} placeholder={'Unlimited API keys\nPriority support'}/></label>
          <button className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60" disabled={busy}>{busy ? 'Saving…' : editing === 'new' ? 'Create plan' : 'Save changes'}</button>
        </form>
      </div>
    </div>}
  </div>;
}
