import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { accounts, safebox } from '../api/client';
import { GlassCard } from '../components/ui/glass-card';
import CountUp from '../components/CountUp';
import { IconShield, IconPlus, IconArrowUp, IconArrowDown, IconBuilding } from '../components/Icons';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

export default function SafeBoxPage() {
  const [safeBoxes, setSafeBoxes] = useState<any[]>([]);
  const [accountList, setAccountList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createTarget, setCreateTarget] = useState('');
  const [creating, setCreating] = useState(false);
  const [depositBox, setDepositBox] = useState<string | null>(null);
  const [withdrawBox, setWithdrawBox] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');

  const fetch = async () => {
    try {
      const [boxes, accts] = await Promise.all([safebox.list(), accounts.list()]);
      setSafeBoxes(boxes);
      setAccountList(accts);
      if (accts.length > 0) setSelectedAccount(accts[0].id);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await safebox.create({ name: createName || undefined, targetAmount: createTarget ? parseFloat(createTarget) : undefined });
      toast.success('SafeBox created!');
      setShowCreate(false); setCreateName(''); setCreateTarget('');
      fetch();
    } catch (err: any) { toast.error(err.message); } finally { setCreating(false); }
  };

  const handleDeposit = async (id: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) { toast.error('Enter a valid amount'); return; }
    if (!selectedAccount) { toast.error('Select a source account'); return; }
    try {
      await safebox.deposit(id, numAmount, selectedAccount);
      toast.success('Deposited to SafeBox!');
      setDepositBox(null); setAmount('');
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleWithdraw = async (id: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) { toast.error('Enter a valid amount'); return; }
    if (!selectedAccount) { toast.error('Select a destination account'); return; }
    try {
      await safebox.withdraw(id, numAmount, selectedAccount);
      toast.success('Withdrawn from SafeBox!');
      setWithdrawBox(null); setAmount('');
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  const totalSaved = safeBoxes.reduce((s, b) => s + b.balance, 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-6">
      <motion.div variants={item} className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>SafeBoxes</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Locked savings with daily interest</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25">
          <IconPlus size={18} /> {showCreate ? 'Cancel' : 'New SafeBox'}
        </button>
      </motion.div>

      {showCreate && (
        <motion.div variants={item}>
          <GlassCard>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Create SafeBox</h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Name</label>
                <input type="text" value={createName} onChange={e => setCreateName(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all input-glow" placeholder="My Savings Vault" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Target Amount (optional)</label>
                <input type="number" value={createTarget} onChange={e => setCreateTarget(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all input-glow" placeholder="10000" min="0" />
              </div>
              <button onClick={handleCreate} disabled={creating} className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl disabled:opacity-50 transition-all font-medium text-sm shadow-lg shadow-blue-500/25">{creating ? 'Creating...' : 'Create'}</button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="col-span-1 md:col-span-3 relative overflow-hidden rounded-2xl p-6 shadow-lg shadow-amber-500/25 border-0">
          <img src="https://picsum.photos/seed/vault-safe/800/200" alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-transparent" />
          <div className="relative">
            <p className="text-xs font-medium text-white/80 uppercase tracking-wider">Total Saved</p>
            <p className="text-3xl font-bold text-white mt-1.5 glow-text">
              $<CountUp value={totalSaved} />
            </p>
            <p className="text-xs text-white/60 mt-1">{safeBoxes.length} safebox(s) · 2% APY</p>
          </div>
        </div>
        <div className="flex flex-col justify-center items-center text-center glass rounded-2xl p-6">
          <IconShield size={32} className="text-amber-400 mb-2" />
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Interest Today</p>
          <p className="text-lg font-bold text-emerald-400">+$<CountUp value={totalSaved * 0.02 / 365} decimals={4} /></p>
        </div>
      </motion.div>

      <motion.div variants={item} className="grid gap-4">
        {safeBoxes.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <IconShield size={48} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="text-lg mb-2" style={{ color: 'var(--text-muted)' }}>No SafeBoxes yet</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Create your first savings vault to start earning interest</p>
          </GlassCard>
        ) : (
          safeBoxes.map((box) => {
            const progress = box.targetAmount ? Math.min(100, (box.balance / box.targetAmount) * 100) : 0;
            return (
              <GlassCard key={box.id} className="relative overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/20 to-rose-500/20 flex items-center justify-center">
                      <IconShield size={24} className="text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{box.name}</h3>
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>2% APY · Created {new Date(box.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right w-full sm:w-auto">
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>$<CountUp value={box.balance} /></p>
                    {box.targetAmount && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Target: ${box.targetAmount.toLocaleString()}</p>
                    )}
                  </div>
                </div>

                {box.targetAmount && (
                  <div className="mt-4">
                    <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'var(--input-bg)' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: [0.34, 1.56, 0.64, 1] }}
                        className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500"
                      />
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{progress.toFixed(0)}% of target</p>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button onClick={() => { setDepositBox(depositBox === box.id ? null : box.id); setWithdrawBox(null); setSelectedAccount(accountList[0]?.id || ''); }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all" style={{ background: 'rgba(16,185,129,0.08)', color: '#34d399', borderColor: 'rgba(16,185,129,0.2)' }}>
                    <IconArrowDown size={16} /> Deposit
                  </button>
                  <button onClick={() => { setWithdrawBox(withdrawBox === box.id ? null : box.id); setDepositBox(null); setSelectedAccount(accountList[0]?.id || ''); }} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all" style={{ background: 'rgba(239,68,68,0.08)', color: '#fb7185', borderColor: 'rgba(239,68,68,0.2)' }}>
                    <IconArrowUp size={16} /> Withdraw
                  </button>
                </div>

                {depositBox === box.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                      <div className="flex-1">
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>From Account</label>
                        <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-all">
                          {accountList.map(a => <option key={a.id} value={a.id}>••••{a.accountNumber.slice(-4)} (${a.balance.toFixed(2)})</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Amount</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-all" placeholder="0.00" min="0.01" step="0.01" />
                      </div>
                      <button onClick={() => handleDeposit(box.id)} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 transition-all">
                        <IconArrowDown size={16} /> Deposit
                      </button>
                    </div>
                  </motion.div>
                )}

                {withdrawBox === box.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                      <div className="flex-1">
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>To Account</label>
                        <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-all">
                          {accountList.map(a => <option key={a.id} value={a.id}>••••{a.accountNumber.slice(-4)} (${a.balance.toFixed(2)})</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Amount</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none transition-all" placeholder="0.00" min="0.01" step="0.01" />
                      </div>
                      <button onClick={() => handleWithdraw(box.id)} className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-400 transition-all">
                        <IconArrowUp size={16} /> Withdraw
                      </button>
                    </div>
                  </motion.div>
                )}
              </GlassCard>
            );
          })
        )}
      </motion.div>
    </motion.div>
  );
}
