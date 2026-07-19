import { useEffect, useState } from 'react';
import { Building2, RefreshCw, Store, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../lib/api';
import PageHeader from '../components/PageHeader';
import { useUi } from '../state/ui-store';

export default function BusinessUnitsPage() {
  const { toast } = useUi();
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = () => api.get('/dashboard/business-units').then(({ data }) => setUnits(data.units)).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    try {
      await api.post('/dashboard/business-units', { ...form, code: finalizeCode(form.code || form.name) });
      setForm({ name: '', code: '', description: '' });
      toast('Sub-business created', 'success');
      load();
    } catch (err) { toast(err.response?.data?.message || 'Could not create sub-business', 'error'); }
    finally { setBusy(false); }
  };
  const toggle = async unit => {
    try {
      await api.patch(`/dashboard/business-units/${unit.id}`, { active: !unit.active });
      toast(!unit.active ? 'Sub-business enabled' : 'Sub-business disabled', 'success');
      load();
    } catch (err) { toast(err.response?.data?.message || 'Could not update sub-business', 'error'); }
  };
  return <div>
    <PageHeader eyebrow="Workspace" title="Sub-businesses" description="Group Pay-Panda payments by store, service, branch, or business line while using the same connected BharatPe account." />
    <div className="create-grid">
      <form className="panel form-panel" onSubmit={submit}>
        <div className="panel-heading"><div><h3>Create sub-business</h3><p>Payments can be tagged to this unit during API or dashboard creation.</p></div><Store/></div>
        <label>Name<input required placeholder="Studio orders, Retail counter, Branch A…" value={form.name} onChange={e => setForm({ ...form, name: e.target.value, code: form.code || slug(e.target.value) })}/></label>
        <label>Code<input required placeholder="branch-a" value={form.code} onChange={e => setForm({ ...form, code: sanitizeCodeInput(e.target.value) })}/><small className="field-help">Use this as <code>business_unit_code</code> in API calls.</small></label>
        <label>Description<input placeholder="Optional internal note" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></label>
        <button className="primary-button" disabled={busy}>{busy ? <RefreshCw className="spin"/> : <Building2/>}{busy ? 'Creating…' : 'Create sub-business'}</button>
      </form>
      <section className="panel">
        <div className="panel-heading"><div><h3>Existing units</h3><p>Disable a unit to prevent new payments while keeping history.</p></div><span>{units.filter(unit => unit.active).length} active</span></div>
        <div className="table-wrap"><table><thead><tr><th>Name</th><th>Code</th><th>Payments</th><th>Status</th><th></th></tr></thead><tbody>
          {loading ? <tr><td colSpan="5" className="empty-cell"><RefreshCw className="spin"/> Loading…</td></tr> : units.length ? units.map(unit => <tr key={unit.id}>
            <td><strong>{unit.name}</strong><small>{unit.description || '—'}</small></td>
            <td><code>{unit.code}</code></td>
            <td>{unit._count?.payments || 0}</td>
            <td><span className={`status ${unit.active ? 'status-active' : 'status-failed'}`}><i/>{unit.active ? 'ACTIVE' : 'DISABLED'}</span></td>
            <td><button className="text-action" onClick={() => toggle(unit)}>{unit.active ? <ToggleRight/> : <ToggleLeft/>}{unit.active ? 'Disable' : 'Enable'}</button></td>
          </tr>) : <tr><td colSpan="5" className="empty-cell">No sub-businesses yet.</td></tr>}
        </tbody></table></div>
      </section>
    </div>
  </div>;
}

// Used only to auto-derive a code from the Name field — collapses spaces/punctuation into
// dashes and trims the ends, since that's a one-shot derivation, not something typed live.
function slug(value) {
  return String(value || '').toLowerCase().trim().replace(/[^a-z0-9_-]+/g, '-').replace(/^[-_]+|[-_]+$/g, '').slice(0, 40);
}

// Used on every keystroke in the Code field itself: only strips characters the backend would
// reject, without collapsing or trimming anything — so typing "-" or "_" (including at the
// end, which is where they always land while typing left-to-right) never gets stripped back out.
function sanitizeCodeInput(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
}

// Final safety net at submit time: the backend requires the code to start with a letter/number,
// so strip any leading dash/underscore a user could have typed manually.
function finalizeCode(value) {
  return slug(value);
}
