import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { admin } from '../api/client';
import { GlassCard } from '../components/ui/glass-card';
import { IconSearch, IconPlus, IconMinus } from '../components/Icons';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [allAccounts, setAllAccounts] = useState<any[]>([]);
  const [kycPending, setKycPending] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any>(null);
  const [tab, setTab] = useState('stats');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [searchQ, setSearchQ] = useState('');

  const [balAdjust, setBalAdjust] = useState<Record<string, string>>({});

  useEffect(() => {
    admin.stats().then(setStats).catch(() => {});
    admin.users().then(setUsers).catch(() => {});
    admin.kycPending().then(setKycPending).catch(() => {});
    admin.transactions().then(setTransactions).catch(() => {});
    admin.listAccounts().then(setAllAccounts).catch(() => {});
  }, []);

  const handleRoleChange = async (userId: string, role: string) => {
    try { await admin.setRole(userId, role); toast.success('Role updated'); admin.users().then(setUsers); } catch (err: any) { toast.error(err.message); }
  };

  const handleToggleActive = async (userId: string) => {
    try { await admin.toggleActive(userId); toast.success('Status toggled'); admin.users().then(setUsers); } catch (err: any) { toast.error(err.message); }
  };

  const handleKycReview = async (docId: string, status: string) => {
    try { await admin.reviewKyc(docId, status, reviewNote); toast.success(`KYC ${status}`); setKycPending(prev => prev.filter(d => d.id !== docId)); setReviewNote(''); } catch (err: any) { toast.error(err.message); }
  };

  const handleAdjustBalance = async (accountId: string, amountStr: string, type: 'add' | 'subtract') => {
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      const result = await admin.adjustBalance(accountId, amount, type);
      toast.success(`$${amount.toFixed(2)} ${type === 'add' ? 'added to' : 'removed from'} account`);
      setBalAdjust(prev => ({ ...prev, [accountId]: '' }));
      admin.listAccounts().then(setAllAccounts);
      admin.users().then(setUsers);
    } catch (err: any) { toast.error(err.message); }
  };

  const expandedUserData = expandedUser ? users.find(u => u.id === expandedUser) : null;
  const expandedAccounts = expandedUser ? allAccounts.filter(a => a.userId === expandedUser) : [];

  const filteredAccounts = allAccounts.filter(a => {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return a.accountNumber.includes(q) || a.user.firstName.toLowerCase().includes(q) || a.user.lastName.toLowerCase().includes(q) || a.user.email.toLowerCase().includes(q);
  });

  const tabs = ['stats', 'users', 'accounts', 'kyc', 'transactions'];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Full control over users, accounts, and transactions</p>
      </motion.div>

      <motion.div variants={item} className="flex gap-1 overflow-x-auto pb-0" style={{ borderBottom: '1px solid var(--border)' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2.5 text-sm font-medium rounded-t-xl transition-all whitespace-nowrap ${tab === t ? 'text-blue-400 border border-b-transparent' : ''}`} style={tab === t ? { background: 'var(--input-bg)', borderColor: 'var(--border)' } : { color: 'var(--text-muted)' }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'kyc' && kycPending.length > 0 && <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-red-500/20 text-red-400 rounded-full">{kycPending.length}</span>}
          </button>
        ))}
      </motion.div>

      {/* === STATS === */}
      {tab === 'stats' && stats && (
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Users', value: stats.userCount },
            { label: 'Accounts', value: stats.accountCount },
            { label: 'Transactions', value: stats.transferCount },
            { label: 'Pending KYC', value: stats.pendingKycCount },
            { label: 'Total Volume', value: `$${(stats.totalVolume || 0).toLocaleString()}` },
          ].map((s: any) => (
            <GlassCard key={s.label}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
            </GlassCard>
          ))}
        </motion.div>
      )}

      {/* === USERS === */}
      {tab === 'users' && (
        <motion.div variants={item} className="space-y-3">
          {users.map(u => (
            <GlassCard key={u.id} className="!p-0 overflow-hidden">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {u.firstName[0]}{u.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{u.firstName} {u.lastName}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${u.role === 'admin' ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-500/10 text-gray-400'}`}>{u.role}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${u.kycStatus === 'approved' ? 'bg-emerald-500/10 text-emerald-400' : u.kycStatus === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>{u.kycStatus}</span>
                    <span className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  </div>
                </div>
                <div className="flex gap-1.5 mt-3 flex-wrap">
                  <button onClick={() => handleRoleChange(u.id, u.role === 'admin' ? 'user' : 'admin')} className="px-2.5 py-1 text-[11px] rounded-lg border transition-all" style={{ background: 'var(--input-bg)', color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
                    {u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                  </button>
                  <button onClick={() => handleToggleActive(u.id)} className="px-2.5 py-1 text-[11px] rounded-lg border transition-all" style={{ background: 'var(--input-bg)', color: u.isActive ? '#ef4444' : '#10b981', borderColor: 'var(--border)' }}>
                    {u.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)} className="px-2.5 py-1 text-[11px] bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 transition-all">
                    {expandedUser === u.id ? 'Collapse' : 'Manage Accounts'}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedUser === u.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-t" style={{ borderColor: 'var(--border)' }}
                  >
                    <div className="p-4 space-y-3" style={{ background: 'var(--bg-secondary)' }}>
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Accounts</p>
                      {expandedAccounts.length === 0 ? (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No accounts</p>
                      ) : (
                        expandedAccounts.map(acc => (
                          <div key={acc.id} className="flex items-center gap-3 p-3 rounded-xl flex-wrap" style={{ background: 'var(--input-bg)' }}>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium capitalize" style={{ color: 'var(--text-primary)' }}>{acc.accountType}</p>
                              <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{acc.accountNumber}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{acc.currency}</p>
                            </div>
                            <div className="flex items-center gap-1.5 w-full sm:w-auto">
                              <input
                                type="number"
                                value={balAdjust[acc.id] || ''}
                                onChange={e => setBalAdjust(prev => ({ ...prev, [acc.id]: e.target.value }))}
                                className="w-20 px-2 py-1.5 text-xs rounded-lg focus:outline-none"
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                                placeholder="Amount"
                                min="0"
                                step="0.01"
                              />
                              <button
                                onClick={() => handleAdjustBalance(acc.id, balAdjust[acc.id] || '', 'add')}
                                className="px-2.5 py-1.5 text-[11px] rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1"
                              >
                                <IconPlus size={10} /> Add
                              </button>
                              <button
                                onClick={() => handleAdjustBalance(acc.id, balAdjust[acc.id] || '', 'subtract')}
                                className="px-2.5 py-1.5 text-[11px] rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-1"
                              >
                                <IconMinus size={10} /> Sub
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          ))}
        </motion.div>
      )}

      {/* === ACCOUNTS === */}
      {tab === 'accounts' && (
        <motion.div variants={item} className="space-y-4">
          <div className="relative max-w-xs">
            <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl focus:outline-none"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              placeholder="Search accounts..."
            />
          </div>
          {filteredAccounts.map(acc => (
            <GlassCard key={acc.id}>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {acc.user.firstName[0]}{acc.user.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{acc.user.firstName} {acc.user.lastName}</p>
                    <p className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>{acc.accountNumber} · <span className="capitalize">{acc.accountType}</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <input
                    type="number"
                    value={balAdjust[acc.id] || ''}
                    onChange={e => setBalAdjust(prev => ({ ...prev, [acc.id]: e.target.value }))}
                    className="w-20 px-2 py-1.5 text-xs rounded-lg focus:outline-none"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    placeholder="$"
                    min="0"
                    step="0.01"
                  />
                  <button onClick={() => handleAdjustBalance(acc.id, balAdjust[acc.id] || '', 'add')} className="px-2.5 py-1.5 text-[11px] rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1">
                    <IconPlus size={10} /> Add
                  </button>
                  <button onClick={() => handleAdjustBalance(acc.id, balAdjust[acc.id] || '', 'subtract')} className="px-2.5 py-1.5 text-[11px] rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-1">
                    <IconMinus size={10} /> Sub
                  </button>
                </div>
              </div>
            </GlassCard>
          ))}
          {filteredAccounts.length === 0 && (
            <GlassCard className="p-8 text-center"><p style={{ color: 'var(--text-muted)' }}>No accounts found</p></GlassCard>
          )}
        </motion.div>
      )}

      {/* === KYC === */}
      {tab === 'kyc' && (
        <motion.div variants={item} className="space-y-4">
          {kycPending.length === 0 ? (
            <GlassCard className="p-8 text-center"><p style={{ color: 'var(--text-muted)' }}>No pending KYC documents</p></GlassCard>
          ) : (
            kycPending.map(doc => (
              <GlassCard key={doc.id}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{doc.user.firstName} {doc.user.lastName}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{doc.user.email}</p>
                  </div>
                  <span className="px-2 py-1 bg-yellow-500/10 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/20">{doc.type.replace('_', ' ')}</span>
                </div>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Review Note</label>
                    <input type="text" value={reviewNote} onChange={e => setReviewNote(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }} placeholder="Optional note" />
                  </div>
                  <button onClick={() => handleKycReview(doc.id, 'approved')} className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 border border-emerald-500/20 transition-all">Approve</button>
                  <button onClick={() => handleKycReview(doc.id, 'rejected')} className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium hover:bg-red-500/20 border border-red-500/20 transition-all">Reject</button>
                </div>
              </GlassCard>
            ))
          )}
        </motion.div>
      )}

      {/* === TRANSACTIONS === */}
      {tab === 'transactions' && transactions && (
        <motion.div variants={item}>
          <GlassCard className="overflow-hidden !p-0">
            <div className="table-wrap">
              <table className="w-full min-w-[500px]">
                <thead><tr className="border-b bg-white/[0.02]" style={{ borderColor: 'var(--border)' }}>
                  <th className="text-left px-3 sm:px-4 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Ref</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Sender</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-xs font-medium uppercase hidden xs:table-cell" style={{ color: 'var(--text-muted)' }}>Recipient</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Amount</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="text-left px-3 sm:px-4 py-3 text-xs font-medium uppercase hidden xs:table-cell" style={{ color: 'var(--text-muted)' }}>Date</th>
                </tr></thead>
                <tbody>
                  {transactions.transfers.map((t: any) => (
                    <tr key={t.id} className="border-b hover:bg-white/[0.03]" style={{ borderColor: 'var(--border)' }}>
                      <td className="px-3 sm:px-4 py-3 text-sm font-mono" style={{ color: 'var(--text-muted)' }}>{t.referenceNumber?.slice(-8)}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{t.sender.firstName} {t.sender.lastName}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm hidden xs:table-cell" style={{ color: 'var(--text-secondary)' }}>{t.recipient.firstName} {t.recipient.lastName}</td>
                      <td className="px-3 sm:px-4 py-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>${t.amount.toFixed(2)}</td>
                      <td className="px-3 sm:px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : t.status === 'reversed' ? 'bg-orange-500/10 text-orange-400' : 'bg-gray-500/10 text-gray-400'}`}>{t.status}</span></td>
                      <td className="px-3 sm:px-4 py-3 text-sm hidden xs:table-cell" style={{ color: 'var(--text-muted)' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 sm:p-4 flex items-center justify-between text-sm border-t" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>
              <span>Page {transactions.page} of {transactions.pages}</span>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  );
}
