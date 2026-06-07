import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  RadialBarChart, RadialBar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Sparkles, Plus, ChevronRight, ArrowRight,
  Send, Clock, Shield, Building, Eye, EyeOff,
  CreditCard as CardIcon, Cpu as ChipIcon, Lightbulb, X as Close,
  Gamepad, Calendar, Tags, FileText, User,
} from 'lucide-react';
import { accounts, transfers, schedule, notifications as notifApi, statements, safebox, entertainment } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/cn';

/* ── Constants ── */
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

const ACCOUNT_STYLES: Record<string, { gradient: string; chip: string; label: string }> = {
  checking: { gradient: 'from-blue-600 via-blue-700 to-blue-900', chip: 'text-blue-200', label: 'CHECKING' },
  savings: { gradient: 'from-emerald-500 via-emerald-600 to-emerald-800', chip: 'text-emerald-200', label: 'SAVINGS' },
  credit: { gradient: 'from-violet-500 via-violet-600 to-violet-800', chip: 'text-violet-200', label: 'CREDIT' },
  investment: { gradient: 'from-amber-500 via-amber-600 to-amber-800', chip: 'text-amber-200', label: 'INVESTMENT' },
};

const QUICK_ACTIONS = [
  { to: '/transfer', label: 'Transfer', icon: Send, desc: 'Send money' },
  { to: '/safebox', label: 'SafeBox', icon: Shield, desc: 'Locked savings' },
  { to: '/transactions', label: 'History', icon: Clock, desc: 'View activity' },
  { to: '/scheduled', label: 'Scheduled', icon: Calendar, desc: 'Future payments' },
  { to: '/entertainment', label: 'Lucky Spin', icon: Gamepad, desc: 'Win credits' },
  { to: '/statements', label: 'Statements', icon: FileText, desc: 'Monthly reports' },
  { to: '/categories', label: 'Categories', icon: Tags, desc: 'Track spending' },
  { to: '/kyc', label: 'Profile', icon: User, desc: 'Your info' },
];

const PROMOS = [
  { id: 'cc', title: 'Cash Rewards Credit Card', desc: 'Earn unlimited 3% cash back on dining', img: 'https://picsum.photos/seed/credit-card/800/200' },
  { id: 'loan', title: 'Ready for a Home Loan?', desc: 'Rates as low as 5.99% APR — get pre-approved today', img: 'https://picsum.photos/seed/home-loan/800/200' },
  { id: 'invest', title: 'Start Investing Today', desc: 'No minimum balance. Start with as little as $1', img: 'https://picsum.photos/seed/invest/800/200' },
  { id: 'student', title: 'Student Banking', desc: 'No monthly fees for 4 years. Apply now', img: 'https://picsum.photos/seed/student-life/800/200' },
];

const TIPS = [
  { id: 't1', text: 'Schedule recurring transfers for bills and savings' },
  { id: 't2', text: 'Enable two-factor authentication for extra account security' },
  { id: 't3', text: 'Use SafeBox to set aside money for specific goals' },
  { id: 't4', text: 'Download monthly statements as PDF from the Statements page' },
  { id: 't5', text: 'Set up direct deposit to get paid up to 2 days early' },
];

/* ── Chart data ── */
const MONTHLY_DATA = [
  { name: 'Jan', income: 4800, expenses: 3200, lastYear: 4100 },
  { name: 'Feb', income: 5200, expenses: 2800, lastYear: 4400 },
  { name: 'Mar', income: 6100, expenses: 3600, lastYear: 4900 },
  { name: 'Apr', income: 5800, expenses: 3100, lastYear: 4700 },
  { name: 'May', income: 6300, expenses: 3400, lastYear: 5100 },
  { name: 'Jun', income: 5900, expenses: 2900, lastYear: 4600 },
  { name: 'Jul', income: 6700, expenses: 3500, lastYear: 5300 },
  { name: 'Aug', income: 7200, expenses: 3800, lastYear: 5600 },
  { name: 'Sep', income: 6800, expenses: 3300, lastYear: 5200 },
  { name: 'Oct', income: 7100, expenses: 3700, lastYear: 5500 },
  { name: 'Nov', income: 7400, expenses: 3900, lastYear: 5800 },
  { name: 'Dec', income: 7900, expenses: 4200, lastYear: 6100 },
];

const WEEKLY_BALANCE = [
  { day: 'Mon', balance: 12400 }, { day: 'Tue', balance: 12800 },
  { day: 'Wed', balance: 12600 }, { day: 'Thu', balance: 13200 },
  { day: 'Fri', balance: 13500 }, { day: 'Sat', balance: 13800 },
  { day: 'Sun', balance: 14250 },
];

const SPENDING_DATA = [
  { name: 'Shopping', value: 3200, color: '#4F7CFF' },
  { name: 'Transport', value: 1800, color: '#7C5CFC' },
  { name: 'Groceries', value: 1400, color: '#3B82F6' },
  { name: 'Dining', value: 900, color: '#5EA0FF' },
  { name: 'Bills', value: 2100, color: '#2563EB' },
];

const EARNINGS_GOAL = { current: 78500, target: 100000 };
const EARNINGS_DATA = [
  { name: 'Progress', value: (EARNINGS_GOAL.current / EARNINGS_GOAL.target) * 100, fill: '#4F7CFF' },
];

const INCOME_SOURCES = [
  { name: 'Salary', amount: 5800, percentage: 65, color: '#4F7CFF' },
  { name: 'Freelance', amount: 1800, percentage: 20, color: '#7C5CFC' },
  { name: 'Investments', amount: 950, percentage: 11, color: '#3B82F6' },
  { name: 'Other', amount: 350, percentage: 4, color: '#5EA0FF' },
];

const RECENT_TXNS = [
  { id: '1', merchant: 'Netflix', amount: -15.99, date: 'Today', type: 'debit', status: 'completed', category: 'Entertainment' },
  { id: '2', merchant: 'Apple Pay', amount: -89.00, date: 'Today', type: 'debit', status: 'completed', category: 'Shopping' },
  { id: '3', merchant: 'Stripe Deposit', amount: 2400.00, date: 'Yesterday', type: 'credit', status: 'completed', category: 'Income' },
  { id: '4', merchant: 'Amazon', amount: -124.50, date: 'Yesterday', type: 'debit', status: 'pending', category: 'Shopping' },
  { id: '5', merchant: 'Uber', amount: -32.00, date: '2 days ago', type: 'debit', status: 'completed', category: 'Transport' },
  { id: '6', merchant: 'Freelance Pay', amount: 1800.00, date: '3 days ago', type: 'credit', status: 'completed', category: 'Income' },
];

/* ── Sub-components ── */
function Mask({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return <span className="inline-block min-w-[80px]"><span className="select-none tracking-widest">••••••</span></span>;
  return <>{children}</>;
}

function Trend({ value, positive }: { value: string; positive: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', positive ? 'text-emerald-400' : 'text-red-400')}>
      {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {value}
    </span>
  );
}

function ChartTooltip({ active, payload, label, prefix = '' }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dark:bg-[#0B1023]/95 bg-white/95 backdrop-blur-xl border dark:border-white/10 border-gray-200 rounded-2xl px-3 py-2 shadow-2xl">
      <p className="text-xs dark:text-gray-500 text-gray-500 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-semibold" style={{ color: p.color || p.stroke || 'var(--accent)' }}>
          {p.name}: {prefix}${p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

/* ── Bank Card ── */
function CardNetwork() {
  return (
    <svg width="34" height="22" viewBox="0 0 34 22" fill="none">
      <circle cx="10" cy="11" r="9" fill="white" opacity="0.18" />
      <circle cx="22" cy="11" r="9" fill="white" opacity="0.18" />
      <rect x="12" y="6" width="8" height="10" rx="1.5" fill="white" opacity="0.12" />
    </svg>
  );
}

function BankCard({ acc, index, showBal }: { acc: any; index: number; showBal: boolean }) {
  const style = ACCOUNT_STYLES[acc.accountType] || ACCOUNT_STYLES.checking;
  const last4 = acc.accountNumber.slice(-4);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={`bg-gradient-to-br ${style.gradient} rounded-3xl p-5 relative overflow-hidden shadow-xl cursor-pointer active:scale-[0.98] transition-transform aspect-[1.586] flex flex-col`}
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/4" />
      <div className="relative flex flex-col h-full">
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-bold text-white/70 tracking-[1.5px]">APEX BANK</span>
          <div className="flex items-center gap-2">
            <span className={style.chip}><ChipIcon size={24} /></span>
            <span className="text-[9px] font-semibold text-white/60 uppercase tracking-wider">{style.label}</span>
          </div>
        </div>
        <div className="flex-1" />
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/50 font-mono tracking-[3px]">••••</span>
            <span className="text-sm text-white/50 font-mono tracking-[3px]">••••</span>
            <span className="text-sm text-white/50 font-mono tracking-[3px]">••••</span>
            <span className="text-base text-white/90 font-mono tracking-[2px] font-semibold">{last4}</span>
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[9px] text-white/50 uppercase tracking-wider mb-0.5">Balance</p>
            <p className="text-lg font-bold text-white tracking-tight whitespace-nowrap">
              <Mask show={showBal}>$<CountUp value={acc.balance} /></Mask>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-[7px] text-white/40 uppercase tracking-wider whitespace-nowrap">Valid Thru</p>
              <p className="text-[11px] text-white/80 font-mono tracking-wide">12/28</p>
            </div>
            <CardNetwork />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CountUp({ value, decimals = 2 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 800;
    const step = Math.max(1, end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { clearInterval(timer); setDisplay(end); }
      else setDisplay(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toFixed(decimals)}</>;
}

/* ── Widget wrapper ── */
function Widget({ children, className, as: Comp = motion.div }: { children: React.ReactNode; className?: string; as?: any }) {
  return (
    <Comp
      variants={item}
      className={cn(
        'glass rounded-3xl p-5 transition-all duration-300 hover:shadow-glow-accent',
        className
      )}
    >
      {children}
    </Comp>
  );
}

/* ═══════════════════ WIDGETS ═══════════════════ */

function InsightHero({ firstName, totalBalance, accountCount, showBal, setShowBal, user }: any) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return (
    <Widget className="lg:col-span-3 relative overflow-hidden min-h-[160px]">
      {/* Grid bg — dark only */}
      <div className="absolute inset-0 dark:opacity-[0.03] opacity-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(79,124,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(79,124,255,0.3) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full dark:bg-blue-500/10 bg-blue-100 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full dark:bg-blue-600/5 bg-blue-50 blur-[80px] pointer-events-none" />
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full dark:bg-blue-400/30 bg-blue-300/50 hidden dark:block"
          style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
          animate={{ y: [0, -(Math.random() * 20 + 5), 0], opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: Math.random() * 3 + 2, repeat: Infinity, delay: Math.random() * 3 }}
        />
      ))}
      <div className="relative h-full flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">AI Insights</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{greeting}, {firstName}</h1>
            <p className="text-sm mt-1 max-w-md" style={{ color: 'var(--text-muted)' }}>
              Your portfolio is up <span className="text-emerald-400 font-semibold">4.3%</span> this week.
              <span className="hidden sm:inline"> Consider rebalancing your savings allocation.</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
              user?.kycStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
              user?.kycStatus === 'pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                user?.kycStatus === 'approved' ? 'bg-emerald-400' :
                user?.kycStatus === 'pending' ? 'bg-amber-400' : 'bg-red-400'
              }`} />
              {user?.kycStatus === 'approved' ? 'Verified' : user?.kycStatus || 'Pending'}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Total Balance</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  <Mask show={showBal}>$<CountUp value={totalBalance} /></Mask>
                </p>
                <button onClick={() => setShowBal(!showBal)} className="p-1 rounded-lg transition-all hover:bg-white/5 active:scale-90" style={{ color: 'var(--text-muted)' }}>
                  {showBal ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{accountCount} account{accountCount !== 1 ? 's' : ''}</p>
            </div>
            <Link to="/transfer" title="Send Money" className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all active:scale-90 shadow-lg shadow-blue-600/20">
              <Send size={20} />
            </Link>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-2xl transition-all flex items-center gap-1.5 shadow-lg shadow-blue-500/20">
              <Sparkles size={14} /> View Insights
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-2xl transition-all border border-white/10 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Plus size={14} /> Add Widget
            </motion.button>
          </div>
        </div>
      </div>
    </Widget>
  );
}

function CardStack({ accountList, showBal, activeCard, setActiveCard, pauseCarousel }: any) {
  return (
    <Widget className="lg:col-span-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Your Cards</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{activeCard + 1} of {accountList.length}</span>
          <div className="flex gap-1">
            {accountList.map((_: any, i: number) => (
              <button key={i} onClick={() => { setActiveCard(i); pauseCarousel(); }}
                className={`w-2 h-2 rounded-full transition-all ${i === activeCard ? 'bg-blue-500 w-5' : 'bg-white/10'}`}
              />
            ))}
          </div>
        </div>
      </div>
      {accountList.length === 0 ? (
        <div className="text-center py-12 rounded-3xl" style={{ border: '1px solid var(--border)' }}>
          <Building size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>No accounts yet</p>
          <Link to="/accounts" className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-90">
            <Plus size={20} />
          </Link>
        </div>
      ) : (
        <div className="relative w-full mx-auto" style={{ aspectRatio: '1.586 / 1', minHeight: 180, maxWidth: 340 }}>
          {accountList.map((acc: any, i: number) => {
            const pos = (i - activeCard + accountList.length) % accountList.length;
            const visible = pos < 3;
            return (
              <motion.div
                key={acc.id}
                className="absolute inset-0 select-none"
                initial={false}
                animate={{
                  x: pos * 5, y: pos * 12,
                  scale: 1 - pos * 0.04,
                  rotate: pos > 0 ? pos * (pos === 1 ? 0.8 : 1.2) : 0,
                  zIndex: visible ? accountList.length - pos : -1,
                  opacity: visible ? (pos === 0 ? 1 : 0.55 - pos * 0.12) : 0,
                }}
                transition={{ type: 'spring', stiffness: 280, damping: 22, mass: 0.85 }}
                onClick={() => { if (visible) { setActiveCard(pos === 0 ? (activeCard + 1) % accountList.length : i); pauseCarousel(); } }}
                whileHover={visible ? { scale: pos === 0 ? 1.03 : 1 - pos * 0.04 + 0.01, y: pos * 12 - (pos === 0 ? 6 : 3), rotate: pos > 0 ? pos * (pos === 1 ? 0.8 : 1.2) - 0.4 : -0.5, transition: { type: 'spring', stiffness: 500, damping: 14 } } : undefined}
                style={{ pointerEvents: visible ? 'auto' : 'none', cursor: visible ? 'pointer' : 'default', transformOrigin: 'center center' }}
              >
                <BankCard acc={acc} index={i} showBal={showBal} />
              </motion.div>
            );
          })}
        </div>
      )}
    </Widget>
  );
}

function SummaryStats({ totalBalance, stmt, totalSaved, user, showBal }: any) {
  return (
    <Widget className="lg:col-span-2">
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Monthly Summary</h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Sent', value: stmt?.summary?.totalSent || 0, color: 'text-red-400', prefix: '-' },
          { label: 'Received', value: stmt?.summary?.totalReceived || 0, color: 'text-emerald-400', prefix: '+' },
          { label: 'Saved', value: totalSaved, color: 'text-amber-400', prefix: '' },
          { label: 'KYC', value: user?.kycStatus || 'Pending', color: 'text-primary', prefix: '', isStatus: true },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl p-3.5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
            <p className="text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            {s.isStatus ? (
              <div className="flex items-center gap-2 mt-1">
                {user?.kycStatus === 'approved' && <span className="text-emerald-400"><TrendingUp size={16} /></span>}
                <p className={`text-lg font-bold capitalize ${s.color}`} style={{ color: s.color.startsWith('text-') ? undefined : 'var(--text-primary)' }}>{s.value}</p>
              </div>
            ) : (
              <p className={`text-lg font-bold mt-1 ${s.color}`}>
                <Mask show={showBal}>{s.prefix}${(s.value as number).toLocaleString('en-US', { minimumFractionDigits: 0 })}</Mask>
              </p>
            )}
          </div>
        ))}
      </div>
    </Widget>
  );
}

function QuickActionsGrid() {
  return (
    <Widget className="lg:col-span-4">
      <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.to} to={action.to} title={action.label}
            className="flex flex-col items-center py-3 rounded-2xl text-center transition-all duration-200 active:scale-90 group"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
          >
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <action.icon size={22} className="text-blue-400" />
            </div>
            <p className="text-[10px] font-medium mt-1.5 truncate max-w-full px-1" style={{ color: 'var(--text-muted)' }}>{action.label}</p>
          </Link>
        ))}
      </div>
    </Widget>
  );
}

function PromoSection({ activePromos, currentPromo, setActivePromos, setCurrentPromo }: any) {
  if (activePromos.length === 0) return null;
  const promo = PROMOS.find(p => p.id === activePromos[currentPromo % activePromos.length]);
  if (!promo) return null;
  return (
    <Widget className="lg:col-span-4 !p-0 overflow-hidden relative min-h-[80px]" as={motion.div} key={promo.id + currentPromo}>
      <motion.div variants={item} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }}>
        <img src={promo.img} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/10" />
        <div className="relative flex items-start justify-between p-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white drop-shadow-sm">{promo.title}</p>
            <p className="text-xs mt-0.5 text-white/80 drop-shadow-sm">{promo.desc}</p>
          </div>
          <button onClick={() => { setActivePromos((prev: string[]) => prev.filter((p: string) => p !== promo.id)); setCurrentPromo(0); }}
            className="p-1 rounded-lg transition-colors active:scale-90 shrink-0 ml-2 text-white/60 hover:text-white"
          ><Close size={16} /></button>
        </div>
        {activePromos.length > 1 && (
          <div className="flex gap-1.5 px-4 pb-3 relative">
            {activePromos.map((id: string, i: number) => (
              <span key={id} className={`h-1.5 rounded-full transition-all ${activePromos[currentPromo % activePromos.length] === id ? 'w-5 bg-white' : 'w-1.5 bg-white/30'}`} />
            ))}
          </div>
        )}
      </motion.div>
    </Widget>
  );
}

function BalanceOverview({ totalBalance, accountCount }: any) {
  return (
    <Widget className="lg:col-span-2">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Balance Trend</p>
          <h3 className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>${totalBalance.toLocaleString()}</h3>
          <Trend value="+4.3% this week" positive />
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">+ Active</span>
      </div>
      <div className="h-28 -mx-1">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <AreaChart data={WEEKLY_BALANCE}>
            <defs><linearGradient id="bf" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4F7CFF" stopOpacity={0.25} /><stop offset="100%" stopColor="#4F7CFF" stopOpacity={0} /></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} />
            <YAxis hide />
            <Tooltip content={<ChartTooltip prefix="$" />} />
            <Area type="monotone" dataKey="balance" stroke="#4F7CFF" strokeWidth={2} fill="url(#bf)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Widget>
  );
}

function EarningsRadial() {
  const pct = (EARNINGS_GOAL.current / EARNINGS_GOAL.target) * 100;
  return (
    <Widget className="lg:col-span-1">
      <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Annual Goal</p>
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={8} data={EARNINGS_DATA} startAngle={90} endAngle={-270}>
              <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'rgba(255,255,255,0.04)' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{Math.round(pct)}%</span>
          </div>
        </div>
        <div>
          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>${EARNINGS_GOAL.current.toLocaleString()}</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>of ${EARNINGS_GOAL.target.toLocaleString()} goal</p>
          <Trend value="+12.4% YoY" positive />
        </div>
      </div>
    </Widget>
  );
}

function MonthlyIncome() {
  return (
    <Widget className="lg:col-span-2">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Monthly Income</p>
          <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>$74,200</p>
        </div>
        <Trend value="+14.7% vs last year" positive />
      </div>
      <div className="h-36 -mx-1">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={MONTHLY_DATA}>
            <defs><filter id="ig"><feGaussianBlur stdDeviation="2" result="cb" /><feMerge><feMergeNode in="cb" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} interval={2} />
            <YAxis hide />
            <Tooltip content={<ChartTooltip prefix="$" />} />
            <Line type="monotone" dataKey="income" stroke="#4F7CFF" strokeWidth={2.5} dot={false} filter="url(#ig)" />
            <Line type="monotone" dataKey="expenses" stroke="#64748B" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Widget>
  );
}

function SpendingAnalytics() {
  return (
    <Widget className="lg:col-span-1">
      <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Spending</p>
      <p className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>$9,400</p>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={SPENDING_DATA} layout="vertical" barSize={10}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 9 }} width={64} />
            <Tooltip content={<ChartTooltip prefix="$" />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]}>
              {SPENDING_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Widget>
  );
}

function ComparisonAnalytics() {
  return (
    <Widget className="lg:col-span-2">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Income Comparison</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>2026</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-600" /><span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>2025</span></div>
        </div>
      </div>
      <div className="h-32 -mx-1">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={MONTHLY_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 10 }} interval={2} />
            <YAxis hide />
            <Tooltip content={<ChartTooltip prefix="$" />} />
            <Line type="monotone" dataKey="income" stroke="#4F7CFF" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="lastYear" stroke="#475569" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Widget>
  );
}

function IncomeBreakdown() {
  return (
    <Widget className="lg:col-span-1">
      <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Income Sources</p>
      <p className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>$8,900</p>
      <div className="space-y-3">
        {INCOME_SOURCES.map((s) => (
          <div key={s.name}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
              <span style={{ color: 'var(--text-muted)' }}>${s.amount.toLocaleString()} · {s.percentage}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
              <motion.div className="h-full rounded-full" style={{ background: s.color, width: `${s.percentage}%` }}
                initial={{ width: 0 }} animate={{ width: `${s.percentage}%` }} transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
          </div>
        ))}
      </div>
    </Widget>
  );
}

function TransactionsWidget({ transfers: txns }: any) {
  const fallback = txns.length === 0 ? RECENT_TXNS : txns.map((t: any) => ({
    id: t.id, merchant: t.recipient?.firstName ? `${t.recipient.firstName} ${t.recipient.lastName}` : t.description || 'Transfer',
    amount: t.senderId === 'self' ? -t.amount : t.amount, date: new Date(t.createdAt).toLocaleDateString(),
    type: t.senderId === 'self' ? 'debit' : 'credit', status: t.status, category: t.category?.name || t.category || 'Transfer',
  }));
  return (
    <Widget className="lg:col-span-3">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Recent Activity</p>
        <Link to="/transactions" className="text-xs flex items-center gap-1 transition-colors" style={{ color: 'var(--accent)' }}>
          View All <ChevronRight size={12} />
        </Link>
      </div>
      <div className="space-y-0.5">
        {fallback.slice(0, 5).map((txn: any) => (
          <motion.div key={txn.id} whileHover={{ background: 'rgba(79,124,255,0.04)' }} className="flex items-center justify-between p-2.5 rounded-2xl transition-colors cursor-default -mx-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn('w-9 h-9 rounded-2xl flex items-center justify-center shrink-0', txn.type === 'credit' ? 'bg-emerald-500/10' : 'bg-red-500/10')}>
                {txn.type === 'credit' ? <ArrowDownRight size={15} className="text-emerald-400" /> : <ArrowUpRight size={15} className="text-red-400" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{txn.merchant}</p>
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{txn.date} · {txn.category}</p>
              </div>
            </div>
            <div className="text-right shrink-0 ml-3">
              <p className={cn('text-sm font-semibold', txn.type === 'credit' ? 'text-emerald-400' : 'text-red-400')}>
                {txn.type === 'credit' ? '+' : '-'}${Math.abs(txn.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <span className={cn('text-[10px] font-medium', txn.status === 'completed' ? 'text-emerald-500' : 'text-amber-400')}>
                {txn.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </Widget>
  );
}

function UpcomingAlerts({ upcomingSchedules, notifList, showBal }: any) {
  return (
    <Widget className="lg:col-span-1">
      <div className="space-y-4">
        {upcomingSchedules.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Upcoming</p>
            <div className="space-y-2">
              {upcomingSchedules.map((s: any) => (
                <div key={s.id} className="p-2.5 rounded-2xl" style={{ background: 'var(--bg-secondary)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    <Mask show={showBal}>${s.amount.toFixed(2)}</Mask> → {s.recipient?.firstName}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Next: {new Date(s.nextRunDate).toLocaleDateString()} · <span className="capitalize">{s.frequency}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {notifList.length > 0 && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Alerts</p>
            <div className="space-y-2">
              {notifList.map((n: any) => (
                <div key={n.id} className="p-2.5 rounded-2xl border" style={{ background: 'rgba(59,130,246,0.04)', borderColor: 'rgba(59,130,246,0.1)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{n.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {upcomingSchedules.length === 0 && notifList.length === 0 && (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>No upcoming items</p>
        )}
      </div>
    </Widget>
  );
}

function TipBanner({ activeTips, currentTip, setActiveTips, setCurrentTip }: any) {
  if (activeTips.length === 0) return null;
  const tip = TIPS.find(t => t.id === activeTips[currentTip % activeTips.length]);
  if (!tip) return null;
  return (
    <motion.div key={tip.id + currentTip} variants={item} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="lg:col-span-4 rounded-2xl px-4 py-3 flex items-start gap-2.5" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}
    >
      <Lightbulb size={16} className="text-amber-400 shrink-0 mt-0.5" />
      <p className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{tip.text}</p>
      <button onClick={() => { setActiveTips((prev: string[]) => prev.filter((p: string) => p !== tip.id)); setCurrentTip(0); }}
        className="p-0.5 rounded hover:bg-white/5 transition-colors active:scale-90 shrink-0" style={{ color: 'var(--text-muted)' }}
      ><Close size={14} /></button>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading your dashboard...</span>
      </div>
    </div>
  );
}

/* ═══════════════════ MAIN DASHBOARD ═══════════════════ */
export default function Dashboard() {
  const { user } = useAuth();
  const [showBal, setShowBal] = useState(true);
  const [accountList, setAccountList] = useState<any[]>([]);
  const [recentTransfers, setRecentTransfers] = useState<any[]>([]);
  const [scheduledList, setScheduledList] = useState<any[]>([]);
  const [notifList, setNotifList] = useState<any[]>([]);
  const [stmt, setStmt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [safeBoxes, setSafeBoxes] = useState<any[]>([]);
  const [activeCard, setActiveCard] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [activePromos, setActivePromos] = useState(PROMOS.map(p => p.id));
  const [currentPromo, setCurrentPromo] = useState(0);
  const [activeTips, setActiveTips] = useState(TIPS.map(t => t.id));
  const [currentTip, setCurrentTip] = useState(0);
  const carouselTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const carouselIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const pauseCarousel = useCallback(() => {
    setIsCarouselPaused(true);
    if (carouselTimeoutRef.current) clearTimeout(carouselTimeoutRef.current);
    carouselTimeoutRef.current = setTimeout(() => setIsCarouselPaused(false), 8000);
  }, []);

  useEffect(() => {
    Promise.all([
      accounts.list(),
      transfers.list(1, 10),
      schedule.list(),
      notifApi.list(),
      statements.current(),
      safebox.list(),
    ]).then(([accts, txns, sched, notifs, statement, boxes]) => {
      setAccountList(accts);
      setRecentTransfers(txns.transfers || []);
      setScheduledList(sched);
      setNotifList(notifs.filter((n: any) => !n.isRead).slice(0, 3));
      setStmt(statement);
      setSafeBoxes(boxes || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (accountList.length <= 1) return;
    carouselIntervalRef.current = setInterval(() => {
      if (!isCarouselPaused) setActiveCard(prev => (prev + 1) % accountList.length);
    }, 5000);
    return () => clearInterval(carouselIntervalRef.current);
  }, [accountList.length, isCarouselPaused]);

  useEffect(() => {
    if (activePromos.length <= 1) return;
    const interval = setInterval(() => setCurrentPromo(prev => (prev + 1) % activePromos.length), 7000);
    return () => clearInterval(interval);
  }, [activePromos.length]);

  useEffect(() => {
    if (activeTips.length <= 1) return;
    const interval = setInterval(() => setCurrentTip(prev => (prev + 1) % activeTips.length), 8000);
    return () => clearInterval(interval);
  }, [activeTips.length]);

  if (loading) return <DashboardSkeleton />;

  const totalBalance = accountList.reduce((s, a) => s + a.balance, 0);
  const totalSaved = safeBoxes.reduce((s, b) => s + b.balance, 0);
  const upcomingSchedules = scheduledList.filter((s: any) => new Date(s.nextRunDate) > new Date()).slice(0, 2);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 auto-rows-min">
        {/* Hero */}
        <InsightHero firstName={user?.firstName || 'User'} totalBalance={totalBalance} accountCount={accountList.length} showBal={showBal} setShowBal={setShowBal} user={user} />

        {/* Quick Actions */}
        <QuickActionsGrid />

        {/* Card Stack + Summary Stats */}
        <CardStack accountList={accountList} showBal={showBal} activeCard={activeCard} setActiveCard={setActiveCard} pauseCarousel={pauseCarousel} />
        <SummaryStats totalBalance={totalBalance} stmt={stmt} totalSaved={totalSaved} user={user} showBal={showBal} />

        {/* Promo */}
        <PromoSection activePromos={activePromos} currentPromo={currentPromo} setActivePromos={setActivePromos} setCurrentPromo={setCurrentPromo} />

        {/* Charts */}
        <BalanceOverview totalBalance={totalBalance} accountCount={accountList.length} />
        <EarningsRadial />
        <MonthlyIncome />
        <SpendingAnalytics />
        <TransactionsWidget transfers={recentTransfers} />
        <ComparisonAnalytics />
        <IncomeBreakdown />
        <UpcomingAlerts upcomingSchedules={upcomingSchedules} notifList={notifList} showBal={showBal} />

        {/* Tip */}
        <TipBanner activeTips={activeTips} currentTip={currentTip} setActiveTips={setActiveTips} setCurrentTip={setCurrentTip} />
      </div>
    </motion.div>
  );
}
