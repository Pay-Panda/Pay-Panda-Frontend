import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Building2, LineChart } from 'lucide-react';
import adminApi from '../../lib/adminApi';
import { useAdminAuth } from '../../state/admin-auth-store';
import PasswordInput from '../../components/PasswordInput';
import { useUi } from '../../state/ui-store';

export default function AdminLoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const { token, authenticate } = useAdminAuth();
  const navigate = useNavigate(); const { toast } = useUi();
  if (token) return <Navigate to="/admin/overview" replace />;
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const { data } = await adminApi.post('/admin/auth/login', form);
      authenticate(data.token, data.admin);
      navigate('/admin/overview');
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to sign in. Please try again.';
      setError(message); toast(message, 'error');
    } finally { setBusy(false); }
  };
  return <div className="auth-layout">
    <section className="auth-story">
      <div className="brand auth-brand"><div className="brand-mark">A</div><strong>Pay-Panda Admin</strong></div>
      <div>
        <p className="eyebrow accent">Platform operations</p>
        <h1>Oversee every business on Pay-Panda.</h1>
        <p>Monitor platform-wide growth, manage subscription plans, and act on accounts that need attention.</p>
        <ul><li><Building2/>Business directory & suspension controls</li><li><LineChart/>Live platform insights</li></ul>
      </div>
      <div className="security-note"><ShieldCheck/><span>Admin sessions are separate from business accounts.</span></div>
    </section>
    <main className="auth-panel">
      <form onSubmit={submit}>
        <p className="eyebrow accent">Admin console</p>
        <h2>Sign in</h2>
        <p>Use your Pay-Panda admin credentials.</p>
        <label>Email address<input type="email" required autoFocus value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/></label>
        <label>Password<PasswordInput required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/></label>
        {error && <div className="alert error">{error}</div>}
        <button className="primary-button" disabled={busy}>{busy ? 'Please wait…' : 'Sign in'}<ArrowRight size={18}/></button>
      </form>
    </main>
  </div>;
}
