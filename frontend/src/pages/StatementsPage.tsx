import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { statements } from '../api/client';
import { GlassCard } from '../components/ui/glass-card';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

export default function StatementsPage() {
  const [stmt, setStmt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statements.current().then(setStmt).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Account Statement</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Monthly summary of your finances</p>
      </motion.div>

      {stmt && (
        <>
          <motion.div variants={item}>
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Period Summary</h2>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{new Date(stmt.period.start).toLocaleDateString()} — {new Date(stmt.period.end).toLocaleDateString()}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Starting Balance', value: `$${stmt.summary.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, style: { color: 'var(--text-primary)' } },
                  { label: 'Sent', value: `-$${stmt.summary.totalSent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, className: 'text-red-400' },
                  { label: 'Received', value: `+$${stmt.summary.totalReceived.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, className: 'text-emerald-400' },
                  { label: 'Net Flow', value: `${stmt.summary.netFlow >= 0 ? '+' : ''}$${stmt.summary.netFlow.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, className: stmt.summary.netFlow >= 0 ? 'text-emerald-400' : 'text-red-400' },
                ].map(s => (
                  <div key={s.label} className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                    <p className={`text-xl font-bold mt-1 ${s.className || ''}`} style={s.style || {}}>{s.value}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={item}>
            <GlassCard>
              <div className="mb-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Accounts</h2>
              </div>
              <div className="space-y-2">
                {stmt.accounts.map((a: any) => (
                  <div key={a.accountNumber} className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                    <div><p className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{a.type} • {a.currency}</p><p className="text-sm" style={{ color: 'var(--text-muted)' }}>••••{a.accountNumber.slice(-4)}</p></div>
                    <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{a.currency === 'USD' ? '$' : a.currency + ' '}{a.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={item}>
            <GlassCard className="overflow-hidden !p-0">
              <div className="p-4 sm:p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Monthly Transactions ({stmt.summary.transactionCount})</h2>
              </div>
              <div className="table-wrap">
                <table className="w-full min-w-[400px]">
                  <thead><tr className="border-b bg-white/[0.02]" style={{ borderColor: 'var(--border)' }}>
                    <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Ref</th>
                    <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Description</th>
                    <th className="text-right px-4 sm:px-6 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Amount</th>
                    <th className="text-right px-4 sm:px-6 py-3 text-xs font-medium uppercase hidden xs:table-cell" style={{ color: 'var(--text-muted)' }}>Date</th>
                  </tr></thead>
                  <tbody>
                    {stmt.recentTransactions.map((t: any) => {
                      const isSent = t.senderId === stmt.accounts?.[0]?.userId;
                      return (
                        <tr key={t.id} className="border-b hover:bg-white/[0.03]" style={{ borderColor: 'var(--border)' }}>
                          <td className="px-4 sm:px-6 py-3 text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{t.referenceNumber?.slice(-8)}</td>
                          <td className="px-4 sm:px-6 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{t.description || 'Transfer'}</td>
                          <td className={`px-4 sm:px-6 py-3 text-sm font-medium text-right ${isSent ? 'text-red-400' : 'text-emerald-400'}`}>{isSent ? '-' : '+'}${t.amount.toFixed(2)}</td>
                          <td className="px-4 sm:px-6 py-3 text-sm text-right hidden xs:table-cell" style={{ color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={item}>
            <GlassCard className="text-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>All-Time • {stmt.allTime.totalTransactions} transactions</p>
              <p className="text-2xl font-bold mt-1 glow-text" style={{ color: 'var(--text-primary)' }}>${stmt.allTime.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })} total volume</p>
            </GlassCard>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
