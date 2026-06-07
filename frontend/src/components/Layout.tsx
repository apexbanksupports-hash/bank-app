import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { notifications as notifApi } from '../api/client';
import {
  IconHome, IconBuilding, IconSend, IconClock, IconShield, IconGamepad,
  IconCalendar, IconTags, IconFileText, IconUser, IconSettings, IconBell,
  IconSun, IconMoon, IconLogout, IconSearch, IconMenu, IconClose, IconCard,
  ApexLogo,
} from './Icons';

interface NavItem { path: string; label: string; icon: React.ReactNode; }

const topNav: NavItem[] = [
  { path: '/dashboard', label: 'Home', icon: <IconHome size={22} /> },
  { path: '/accounts', label: 'Accounts', icon: <IconBuilding size={22} /> },
  { path: '/transactions', label: 'History', icon: <IconClock size={22} /> },
  { path: '/kyc', label: 'Profile', icon: <IconUser size={22} /> },
];

const secondaryLinks: NavItem[] = [
  { path: '/safebox', label: 'SafeBox', icon: <IconShield /> },
  { path: '/scheduled', label: 'Scheduled', icon: <IconCalendar /> },
  { path: '/categories', label: 'Categories', icon: <IconTags /> },
  { path: '/statements', label: 'Statements', icon: <IconFileText /> },
  { path: '/entertainment', label: 'Entertainment', icon: <IconGamepad /> },
];

const bottomNavItems: NavItem[] = [
  { path: '/dashboard', label: 'Home', icon: <IconHome size={28} /> },
  { path: '/transfer', label: 'Transfer', icon: <IconSend size={28} /> },
  { path: '/transactions', label: 'History', icon: <IconClock size={28} /> },
];

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout: authLogout } = useAuth();
  const { theme, toggle: toggleTheme } = useTheme();
  const [notifCount, setNotifCount] = useState(0);
  const [notifList, setNotifList] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showMoreMobile, setShowMoreMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const notifRefMobile = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetch = async () => {
      try { const { count } = await notifApi.unreadCount(); setNotifCount(count); } catch {}
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showNotif) notifApi.list().then(setNotifList).catch(() => {});
  }, [showNotif]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node) && notifRefMobile.current && !notifRefMobile.current.contains(e.target as Node)) setShowNotif(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setShowMore(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => { setShowMoreMobile(false); }, [pathname]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 8);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => { authLogout(); navigate('/login'); };

  const markRead = async (id: string) => {
    await notifApi.markRead(id);
    setNotifList(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setNotifCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await notifApi.markAllRead();
    setNotifList(prev => prev.map(n => ({ ...n, isRead: true })));
    setNotifCount(0);
  };

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Mobile header */}
      <header
        className="md:hidden flex items-center justify-between px-4 h-12 shrink-0 safe-top sticky top-0 z-30"
        style={{
          background: scrolled ? 'rgba(7,11,20,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          transition: 'background 0.3s, backdrop-filter 0.3s, border-color 0.3s',
        }}
      >
        <Link to="/dashboard" className="flex items-center gap-2">
          <ApexLogo size={24} />
          <div className="flex flex-col leading-none">
            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>APEX</span>
            <span className="text-[8px] font-semibold tracking-[0.8px]" style={{ color: 'var(--text-muted)' }}>BANK</span>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <div className="relative" ref={notifRefMobile}>
            <button
              onClick={() => setShowNotif(!showNotif)}
              className="relative p-1.5 rounded-lg hover:bg-white/5 transition-all active:scale-90"
              style={{ color: 'var(--text-muted)' }}
            >
              <IconBell size={18} />
              {notifCount > 0 && (
                <motion.span
                  key={notifCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[7px] flex items-center justify-center rounded-full font-bold shadow-lg"
                >{notifCount > 9 ? '9+' : notifCount}</motion.span>
              )}
            </button>
            {showNotif && <NotifDropdown notifList={notifList} notifCount={notifCount} onMarkRead={markRead} onMarkAllRead={markAllRead} />}
          </div>
        </div>
      </header>

      {/* Mobile bottom sheet */}
      <AnimatePresence>
        {showMoreMobile && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setShowMoreMobile(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 320 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 320 }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="md:hidden fixed bottom-16 left-2 right-2 z-50 rounded-2xl border shadow-xl shadow-black/40 overflow-hidden"
              style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}
            >
              <div className="p-2">
                {secondaryLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setShowMoreMobile(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive(link.path) ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-white/5'
                    }`}
                    style={{ color: isActive(link.path) ? undefined : 'var(--text-secondary)' }}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                ))}
                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setShowMoreMobile(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive('/admin') ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-white/5'
                    }`}
                    style={{ color: isActive('/admin') ? undefined : 'var(--text-secondary)' }}
                  >
                    <IconSettings size={20} />
                    <span>Admin</span>
                  </Link>
                )}
              </div>
              <div className="p-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
                <button onClick={toggleTheme} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </button>
                <button onClick={handleLogout} className="flex items-center gap-2 text-sm" style={{ color: 'rgba(239,68,68,0.7)' }}>
                  <IconLogout size={18} /> Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop top nav */}
      <header
        className="hidden md:flex h-14 items-center shrink-0 sticky top-0 z-30"
        style={{
          background: scrolled ? 'var(--header-bg)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px) saturate(1.5)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(24px) saturate(1.5)' : 'none',
          borderBottom: scrolled ? '1px solid var(--glass-border)' : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.15)' : 'none',
          transition: 'all 0.3s',
        }}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between px-6">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
            <ApexLogo size={30} />
            <div className="flex flex-col">
              <span className="text-sm font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>APEX</span>
              <span className="text-[10px] font-semibold tracking-[1px]" style={{ color: 'var(--text-muted)' }}>BANK</span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-0.5">
            {topNav.map(item => (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                className={`p-2.5 rounded-2xl transition-all active:scale-90 ${
                  isActive(item.path)
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'hover:bg-white/5'
                }`}
                style={{ color: isActive(item.path) ? undefined : 'var(--text-muted)' }}
              >
                {item.icon}
              </Link>
            ))}
            {/* Services dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => setShowMore(!showMore)}
                title="Services"
                className={`p-2.5 rounded-2xl transition-all active:scale-90 ${
                  secondaryLinks.some(l => isActive(l.path)) || isActive('/admin')
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'hover:bg-white/5'
                }`}
                style={{ color: secondaryLinks.some(l => isActive(l.path)) ? undefined : 'var(--text-muted)' }}
              >
                <IconMenu size={22} />
              </button>
              {showMore && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  className="absolute top-full right-0 mt-2 w-52 border shadow-xl shadow-black/30 rounded-2xl overflow-hidden z-50"
                  style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}
                >
                  <div className="p-2">
                    {secondaryLinks.map(link => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setShowMore(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                          isActive(link.path) ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-white/5'
                        }`}
                        style={{ color: isActive(link.path) ? undefined : 'var(--text-secondary)' }}
                      >
                        {link.icon}
                        <span>{link.label}</span>
                      </Link>
                    ))}
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setShowMore(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                          isActive('/admin') ? 'bg-blue-500/10 text-blue-400' : 'hover:bg-white/5'
                        }`}
                        style={{ color: isActive('/admin') ? undefined : 'var(--text-secondary)' }}
                      >
                        <IconSettings size={20} />
                        <span>Admin</span>
                      </Link>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-2xl hover:bg-white/5 transition-all active:scale-90" style={{ color: 'var(--text-muted)' }}>
              <IconSearch size={16} />
            </button>
            <button onClick={toggleTheme} className="p-2 rounded-2xl hover:bg-white/5 transition-all active:scale-90" style={{ color: 'var(--text-muted)' }}>
              {theme === 'dark' ? <IconSun size={16} /> : <IconMoon size={16} />}
            </button>
            <div className="relative" ref={notifRef}>
              <button onClick={() => setShowNotif(!showNotif)} className="relative p-2 rounded-2xl hover:bg-white/5 transition-all active:scale-90" style={{ color: 'var(--text-muted)' }}>
                <IconBell size={18} />
                {notifCount > 0 && (
                  <motion.span
                    key={notifCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-lg"
                  >{notifCount > 9 ? '9+' : notifCount}</motion.span>
                )}
              </button>
              {showNotif && <NotifDropdown notifList={notifList} notifCount={notifCount} onMarkRead={markRead} onMarkAllRead={markAllRead} />}
            </div>
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="ml-1 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 flex items-center justify-center text-white text-[11px] font-bold ring-2 ring-white/10 hover:ring-blue-400/50 transition-all active:scale-90"
              >
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </button>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                  className="absolute top-full right-0 mt-2 w-56 border shadow-xl shadow-black/30 rounded-2xl overflow-hidden z-50"
                  style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}
                >
                  <div className="p-3" style={{ borderBottom: '1px solid var(--border)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <Link to="/kyc" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                      <IconUser size={18} />
                      <span>Profile</span>
                    </Link>
                    <Link to="/statements" onClick={() => setShowUserMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                      <IconFileText size={18} />
                      <span>Statements</span>
                    </Link>
                    <button onClick={() => { toggleTheme(); setShowUserMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all hover:bg-white/5" style={{ color: 'var(--text-secondary)' }}>
                      {theme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
                      <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                  </div>
                  <div className="p-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all hover:bg-white/5" style={{ color: 'rgba(239,68,68,0.7)' }}>
                      <IconLogout size={18} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main ref={mainRef} className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-4 left-3 right-3 flex items-center justify-around z-30 h-14 rounded-3xl shadow-xl shadow-black/40" style={{ background: 'var(--header-bg)', backdropFilter: 'blur(24px) saturate(1.4)', WebkitBackdropFilter: 'blur(24px) saturate(1.4)', border: '1px solid var(--glass-border)' }}>
        {bottomNavItems.map(item => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.label}
              to={item.path}
              title={item.label}
              className="flex items-center justify-center p-2.5 rounded-2xl transition-all duration-200 active:scale-90"
              style={{
                color: active ? '#3b82f6' : 'var(--text-muted)',
                background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
              }}
            >
              <span className={`transition-all duration-200 ${active ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`}>
                {item.icon}
              </span>
            </Link>
          );
        })}
        {/* More button */}
        <button
          onClick={() => setShowMoreMobile(!showMoreMobile)}
          title="More"
          className="flex items-center justify-center p-2.5 rounded-2xl transition-all duration-200 active:scale-90"
          style={{
            color: showMoreMobile ? '#3b82f6' : 'var(--text-muted)',
            background: showMoreMobile ? 'rgba(59,130,246,0.1)' : 'transparent',
          }}
        >
          <span className={`transition-all duration-200 ${showMoreMobile ? 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : ''}`}>
            {showMoreMobile ? <IconClose size={28} /> : <IconMenu size={28} />}
          </span>
        </button>
      </nav>
    </div>
  );
}

function NotifDropdown({ notifList, notifCount, onMarkRead, onMarkAllRead }: {
  notifList: any[]; notifCount: number; onMarkRead: (id: string) => void; onMarkAllRead: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full right-0 mt-2 w-72 sm:w-80 border shadow-xl shadow-black/50 z-50 max-h-96 overflow-y-auto rounded-2xl"
      style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}
    >
      <div className="p-4 flex items-center justify-between sticky top-0" style={{ background: 'var(--bg-sidebar)', borderBottom: '1px solid var(--border)' }}>
        <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Notifications</h3>
        {notifCount > 0 && <button onClick={onMarkAllRead} className="text-xs text-blue-400 hover:text-blue-300">Mark all read</button>}
      </div>
      {notifList.length === 0 ? (
        <p className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>No notifications</p>
      ) : (
        notifList.map((n) => (
          <div key={n.id} className={`p-3 sm:p-4 cursor-pointer hover:bg-white/5 transition-colors ${!n.isRead ? 'bg-blue-500/5' : ''}`} style={{ borderBottom: '1px solid var(--border)' }} onClick={() => onMarkRead(n.id)}>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{n.message}</p>
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(n.createdAt).toLocaleString()}</p>
          </div>
        ))
      )}
    </motion.div>
  );
}
