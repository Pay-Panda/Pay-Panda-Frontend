import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Building2, LineChart } from 'lucide-react';
import adminApi from '../../lib/adminApi';
import { useAdminAuth } from '../../state/admin-auth-store';
import PasswordInput from '../../components/PasswordInput';
import { useUi } from '../../state/ui-store';
import payLogo from '../../assets/logo.png';

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
  return <div className="auth-layout grid min-h-screen grid-cols-[1.05fr_.95fr] bg-bg text-text max-lg:grid-cols-1">
    <section className="auth-story relative flex min-h-screen flex-col justify-between overflow-hidden p-10 max-lg:hidden">
      <div className="brand flex items-center gap-3 auth-brand"><img className="brand-mark h-10 w-10 rounded-xl object-contain" src={payLogo} alt="Pay-Panda" /><strong>Pay-Panda Admin</strong></div>
      <div>
        <p className="eyebrow mb-1 text-[var(--font-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--muted-2)] accent text-accent-contrast">Platform operations</p>
        <h1>Oversee every business on Pay-Panda.</h1>
        <p>Monitor platform-wide growth, manage subscription plans, and act on accounts that need attention.</p>
        <ul><li><Building2/>Business directory & suspension controls</li><li><LineChart/>Live platform insights</li></ul>
      </div>
      <div className="security-note"><ShieldCheck/><span>Admin sessions are separate from business accounts.</span></div>
    </section>
    <main className="auth-panel m-auto w-[min(460px,calc(100%-32px))] rounded-3xl border border-line bg-panel p-8 shadow-elevated">
      <form onSubmit={submit}>
        <p className="eyebrow mb-1 text-[var(--font-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--muted-2)] accent text-accent-contrast">Admin console</p>
        <h2>Sign in</h2>
        <p>Use your Pay-Panda admin credentials.</p>
        <label>Email address<input type="email" required autoFocus value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/></label>
        <label>Password<PasswordInput required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/></label>
        {error && <div className="alert mt-4 rounded-xl px-4 py-3 text-small error border border-red/25 bg-red/10 text-red">{error}</div>}
        <button className="primary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] border-0 bg-gradient-to-br from-violet-600 to-indigo-500 px-4 font-bold text-white shadow-[var(--shadow-glow-accent)] transition disabled:cursor-not-allowed disabled:opacity-60" disabled={busy}>{busy ? 'Please wait…' : 'Sign in'}<ArrowRight size={18}/></button>
      </form>
    </main>
  </div>;
}
