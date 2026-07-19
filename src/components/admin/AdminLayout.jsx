import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../state/admin-auth-store';
import usePageTransition from '../../hooks/usePageTransition';
import useSmoothScroll from '../../hooks/useSmoothScroll';
import { LayoutDashboard, Building2, Layers, LogOut, Menu, X, Moon, Sun } from 'lucide-react';
import payLogo from '../../assets/logo.png';

const items = [
  { to: '/admin/overview', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/businesses', icon: Building2, label: 'Businesses' },
  { to: '/admin/plans', icon: Layers, label: 'Plans' },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('pay_panda_theme') || 'dark');
  const { admin, logout } = useAdminAuth();
  const location = useLocation();
  const pageRef = useRef(null);
  usePageTransition(pageRef, location.pathname);
  useSmoothScroll();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('pay_panda_theme', theme);
  }, [theme]);
  const title = items.find(i => location.pathname.startsWith(i.to))?.label || 'Admin';
  return <div className="shell min-h-screen bg-bg text-text">
    {open && <button className="sidebar-backdrop fixed inset-0 z-[29] bg-black/60 lg:hidden" aria-label="Close menu" onClick={() => setOpen(false)} />}
    <aside className={`sidebar fixed left-0 top-0 z-30 flex h-screen w-[272px] flex-col border-r border-line bg-panel p-4 transition-all duration-300 ${open ? 'is-open' : ''}`}>
      <div className="brand flex items-center gap-3"><img className="brand-mark h-10 w-10 rounded-xl object-contain" src={payLogo} alt="Pay-Panda" /><div className="brand-copy min-w-0"><strong>Pay-Panda</strong><span>Admin console</span></div><button className="mobile-close" onClick={() => setOpen(false)}><X /></button></div>
      <nav className="nav-scroll mt-6 flex-1 space-y-5 overflow-y-auto pr-1">
        <div className="nav-section space-y-1">
          <p>Platform</p>
          {items.map(({ to, icon: Icon, label }) => <NavLink to={to} key={to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>
            <Icon size={18}/><span>{label}</span>
          </NavLink>)}
        </div>
      </nav>
      <div className="sidebar-bottom mt-auto border-t border-line pt-4">
        <button onClick={logout}><LogOut size={18}/>Logout</button>
      </div>
    </aside>
    <main className="main min-h-screen transition-all duration-300">
      <header className="topbar sticky top-0 z-20 flex min-h-[82px] items-center justify-between border-b border-line bg-bg/90 px-8 backdrop-blur-xl">
        <div><button className="menu-button grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel text-text lg:hidden" onClick={() => setOpen(true)}><Menu /></button><p className="eyebrow mb-1 text-[var(--font-micro)] font-extrabold uppercase tracking-[var(--tracking-wide)] text-[var(--muted-2)]">Admin</p><h1>{title}</h1></div>
        <div className="top-actions flex items-center gap-3"><button className="icon-button grid h-10 w-10 place-items-center rounded-xl border border-line bg-panel text-text transition hover:border-accent" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button><div className="user-chip flex items-center gap-3 rounded-2xl border border-line bg-panel px-3 py-2"><span>{admin?.name?.[0] || 'A'}</span><div><strong>{admin?.name}</strong><small>{admin?.email}</small></div></div></div>
      </header>
      <div className="page mx-auto w-full max-w-[1220px] px-8 py-8" ref={pageRef}><Outlet /></div>
    </main>
  </div>;
}
