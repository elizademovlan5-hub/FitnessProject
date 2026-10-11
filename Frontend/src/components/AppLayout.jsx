import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Activity, CalendarDays, BarChart3, ChevronLeft, Dumbbell, LayoutDashboard, LogOut, Menu, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react';
import { useAuth } from '../auth/AuthContext.jsx';

const navItems = [
  { to: '/', label: 'İcmal', icon: LayoutDashboard, end: true },
  { to: '/workouts', label: 'Məşqlər', icon: Dumbbell },
  { to: '/weekly-plan', label: 'Həftəlik plan', icon: CalendarDays },
  { to: '/statistics', label: 'Statistika', icon: BarChart3 },
  { to: '/recommendations', label: 'Tövsiyələr', icon: Sparkles },
  { to: '/profile', label: 'Profilim', icon: UserRound }
];

function getPageName(pathname) {
  if (pathname.startsWith('/workouts/')) return 'Məşq detalları';
  return navItems.find((item) => item.to !== '/' && pathname.startsWith(item.to))?.label || navItems.find((item) => item.to === pathname)?.label || 'FitLife';
}

export default function AppLayout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const leave = () => { logout(); navigate('/login'); };
  const initials = (user?.fullName || user?.email || 'F').split(/[\s@]/).filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join('');

  return <div className="app-shell">
    {mobileOpen && <button aria-label="Menyunu bağla" className="mobile-scrim" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="brand-row"><div className="brand-mark"><Activity size={22} strokeWidth={2.7} /></div><div className="brand-name">fit<span>life</span><small>TRAINING STUDIO</small></div><button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Bağla"><X size={20} /></button></div>
      <div className="workspace-label">İŞ MASASI</div>
      <nav className="side-nav" aria-label="Əsas menyu">
        {navItems.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18} /><span>{label}</span>{to === '/weekly-plan' && <span className="nav-pill">7</span>}</NavLink>)}
        {isAdmin && <><div className="workspace-label admin-label">İDARƏETMƏ</div><NavLink to="/admin" onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}><ShieldCheck size={18} /><span>Admin paneli</span><span className="admin-dot" /></NavLink></>}
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-tip"><div className="tip-icon"><Sparkles size={17} /></div><div><strong>Balaca addımlar.</strong><p>Davamlılıq böyük nəticələr gətirir.</p></div></div><button className="nav-link logout-link" onClick={leave}><LogOut size={18} /><span>Çıxış et</span></button><div className="sidebar-foot">FITLIFE STUDIO <span>•</span> v1.0</div></div>
    </aside>
    <div className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu" aria-label="Menyunu aç" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><span className="breadcrumb-muted">İş masası</span><span className="breadcrumb-slash">/</span><span className="breadcrumb-current">{getPageName(location.pathname)}</span></div><div className="topbar-right"><div className="date-chip"><span className="date-dot" />{new Date().toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric' })}</div><button className="profile-shortcut" onClick={() => navigate('/profile')}><div className="avatar-mini">{user?.profilePhotoUrl ? <img src={user.profilePhotoUrl} alt="Profil" /> : initials}</div><div className="profile-shortcut-copy"><strong>{user?.fullName || 'İstifadəçi'}</strong><span>{isAdmin ? 'Administrator' : 'İdmançı'}</span></div><ChevronLeft size={15} className="rotate-down" /></button></div></header>
      <main className="main-content"><Outlet /></main>
      <footer className="app-footer"><span>© {new Date().getFullYear()} FitLife Studio</span><span>Hərəkətdə qal. Öz tempində inkişaf et.</span></footer>
    </div>
  </div>;
}
