import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { entertainment, accounts } from '../api/client';
import { GlassCard } from '../components/ui/glass-card';
import CountUp from '../components/CountUp';
import { IconBuilding, IconGamepad } from '../components/Icons';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

const MULTIPLIERS = ['2x', '3x', '5x', '10x', '25x', '50x'];
const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#f97316', '#ef4444', '#3b82f6'];

export default function EntertainmentPage() {
  const [totalBalance, setTotalBalance] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<any>(null);
  const [hasSpun, setHasSpun] = useState(false);
  const [spinAngle, setSpinAngle] = useState(0);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [canClaimDaily, setCanClaimDaily] = useState(false);
  const [dailyResult, setDailyResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      accounts.list(),
      entertainment.spinStatus(),
      entertainment.dailyRewardStatus(),
    ]).then(([accts, spinStat, dailyStat]) => {
      setTotalBalance(accts.reduce((s: number, a: any) => s + a.balance, 0));
      setHasSpun(spinStat.hasSpun);
      setCanClaimDaily(dailyStat.canClaim);
      setDailyStreak(dailyStat.currentStreak);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSpin = async () => {
    setSpinning(true);
    setSpinResult(null);
    const randAngle = 360 * (3 + Math.floor(Math.random() * 5)) + Math.random() * 360;
    setSpinAngle(spinAngle + randAngle);

    setTimeout(async () => {
      try {
        const res = await entertainment.spin();
        setSpinResult(res);
        setHasSpun(true);
        toast.success(`You won $${res.prize.toFixed(2)}!`);
        const accts = await accounts.list();
        setTotalBalance(accts.reduce((s: number, a: any) => s + a.balance, 0));
      } catch (err: any) { toast.error(err.message); }
      setSpinning(false);
    }, 2500);
  };

  const handleDailyReward = async () => {
    try {
      const res = await entertainment.dailyReward();
      setDailyResult(res);
      setCanClaimDaily(false);
      setDailyStreak(res.streak);
      toast.success(`Daily reward: $${res.reward.toFixed(2)}!`);
      const accts = await accounts.list();
      setTotalBalance(accts.reduce((s: number, a: any) => s + a.balance, 0));
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Entertainment</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Have fun — win real credits!</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="col-span-1 md:col-span-3 relative overflow-hidden rounded-2xl p-6 shadow-lg shadow-pink-500/25 border-0">
          <img src="https://picsum.photos/seed/game-room/800/200" alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-transparent" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <IconBuilding size={16} className="text-white/60" />
              <span className="text-xs font-medium text-white/60 uppercase tracking-widest">Total Balance</span>
            </div>
            <p className="text-3xl font-bold text-white mt-1 glow-text">$<CountUp value={totalBalance} /></p>
            <p className="text-xs text-white/60 mt-1">Across all accounts</p>
          </div>
        </div>
        <div className="flex flex-col justify-center items-center text-center glass rounded-2xl p-6">
          <IconGamepad size={32} className="text-pink-400 mb-2" />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Daily Streak</p>
          <p className="text-lg font-bold text-amber-400">{dailyStreak} day{dailyStreak !== 1 ? 's' : ''}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <GlassCard>
            <h2 className="text-lg font-semibold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>Lucky Spin</h2>

            <div className="relative w-64 h-64 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/20 to-violet-500/20 blur-xl" />

              <svg viewBox="0 0 100 100" className="w-full h-full">
                <motion.g
                  style={{ originX: '50%', originY: '50%' }}
                  animate={{ rotate: spinning ? spinAngle : spinAngle }}
                  transition={{ duration: 2.5, ease: [0.17, 0.67, 0.12, 0.99] }}
                >
                  {MULTIPLIERS.map((mult, i) => {
                    const angle = (360 / MULTIPLIERS.length) * i;
                    return (
                      <g key={mult}>
                        <path d={describeArc(50, 50, 45, angle, angle + 60)} fill={COLORS[i]} opacity={0.85} stroke="#0a0e1a" strokeWidth="0.5" />
                        <text x={50 + 32 * Math.cos(((angle + 30) * Math.PI) / 180)} y={50 + 32 * Math.sin(((angle + 30) * Math.PI) / 180)} textAnchor="middle" dominantBaseline="central" fill="white" fontSize="5" fontWeight="bold">{mult}</text>
                      </g>
                    );
                  })}
                </motion.g>
                <circle cx="50" cy="50" r="8" fill="#1e293b" stroke="white" strokeWidth="2" />
                <polygon points="50,8 47,2 53,2" fill="white" />
              </svg>
            </div>

            {spinResult && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                className="text-center mb-4 p-4 bg-gradient-to-r from-amber-500/10 to-rose-500/10 rounded-xl border border-amber-500/20"
              >
                <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>You won!</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>${spinResult.prize.toFixed(2)}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Base: ${spinResult.basePrize.toFixed(2)} × {spinResult.multiplier}</p>
              </motion.div>
            )}

            <button
              onClick={handleSpin}
              disabled={spinning || hasSpun}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-violet-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-pink-500/25 hover:from-pink-400 hover:to-violet-500"
            >
              {spinning ? 'Spinning...' : hasSpun ? 'Already Spun Today' : 'Spin! ($50 entry)'}
            </button>
          </GlassCard>
        </motion.div>

        <motion.div variants={item}>
          <GlassCard>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Daily Reward</h2>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${i < dailyStreak % 7 ? 'bg-gradient-to-br from-amber-400 to-rose-500 text-white' : ''}`} style={{ background: i < dailyStreak % 7 ? undefined : 'var(--input-bg)', color: i < dailyStreak % 7 ? undefined : 'var(--text-muted)' }}>
                      {i + 1}
                    </div>
                  ))}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Daily streak bonus grows every 7 days</p>
              </div>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--text-muted)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h17.25" />
              </svg>
            </div>

            {dailyResult && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="mb-4 p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20"
              >
                <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Reward Claimed!</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>${dailyResult.reward.toFixed(2)}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Streak: {dailyResult.streak} days</p>
              </motion.div>
            )}

            <button
              onClick={handleDailyReward}
              disabled={!canClaimDaily || !!dailyResult}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-rose-500"
            >
              {dailyResult ? 'Claimed!' : canClaimDaily ? `Claim Daily Reward${dailyStreak > 0 ? ` (${dailyStreak + 1} day streak!)` : ''}` : 'Come back tomorrow!'}
            </button>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}
