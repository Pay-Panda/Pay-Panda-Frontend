import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../state/admin-auth-store';
import usePageTransition from '../../hooks/usePageTransition';
import useSmoothScroll from '../../hooks/useSmoothScroll';
import { LayoutDashboard, Building2, Layers, LogOut, Menu, X, Moon, Sun } from 'lucide-react';

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
  return <div className="shell">
    {open && <button className="sidebar-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? 'is-open' : ''}`}>
      <div className="brand"><div className="brand-mark">A</div><div className="brand-copy"><strong>Pay-Panda</strong><span>Admin console</span></div><button className="mobile-close" onClick={() => setOpen(false)}><X /></button></div>
      <nav className="nav-scroll">
        <div className="nav-section">
          <p>Platform</p>
          {items.map(({ to, icon: Icon, label }) => <NavLink to={to} key={to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'active' : ''}>
            <Icon size={18}/><span>{label}</span>
          </NavLink>)}
        </div>
      </nav>
      <div className="sidebar-bottom">
        <button onClick={logout}><LogOut size={18}/>Logout</button>
      </div>
    </aside>
    <main className="main">
      <header className="topbar">
        <div><button className="menu-button" onClick={() => setOpen(true)}><Menu /></button><p className="eyebrow">Admin</p><h1>{title}</h1></div>
        <div className="top-actions"><button className="icon-button" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button><div className="user-chip"><span>{admin?.name?.[0] || 'A'}</span><div><strong>{admin?.name}</strong><small>{admin?.email}</small></div></div></div>
      </header>
      <div className="page" ref={pageRef}><Outlet /></div>
    </main>
  </div>;
}
