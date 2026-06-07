import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { accounts as accountsApi } from '../api/client';
import { GlassCard } from '../components/ui/glass-card';
import { IconBuilding, IconPlus } from '../components/Icons';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

export default function AccountsPage() {
  const [accountList, setAccountList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [accountType, setAccountType] = useState('savings');

  const fetchAccounts = async () => {
    try { setAccountList(await accountsApi.list()); } catch (err: any) { toast.error(err.message); } finally { setLoading(false); }
  };

  useEffect(() => { fetchAccounts(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await accountsApi.create(accountType);
      toast.success('Account created!');
      setShowCreate(false);
      fetchAccounts();
    } catch (err: any) { toast.error(err.message); } finally { setCreating(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Accounts</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Manage your bank accounts</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25">
          {showCreate ? 'Cancel' : '+ New Account'}
        </button>
      </motion.div>

      {showCreate && (
        <motion.div variants={item}>
          <GlassCard>
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Open New Account</h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Account Type</label>
                <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                  <option value="savings" className="bg-[#0a0e1a]">Savings</option>
                  <option value="checking" className="bg-[#0a0e1a]">Checking</option>
                </select>
              </div>
              <button onClick={handleCreate} disabled={creating} className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 disabled:opacity-50 transition-all font-medium text-sm">
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      <motion.div variants={item} className="grid gap-4">
        {accountList.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-lg mb-2" style={{ color: 'var(--text-muted)' }}>No accounts yet</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Open your first account to get started</p>
          </GlassCard>
        ) : (
          accountList.map((acc) => (
            <GlassCard key={acc.id}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center shrink-0 text-blue-400">
                    <IconBuilding size={24} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-semibold capitalize truncate" style={{ color: 'var(--text-primary)' }}>{acc.accountType}</h3>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/20 shrink-0">{acc.currency}</span>
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>••••{acc.accountNumber.slice(-4)}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>Opened {new Date(acc.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="sm:text-right sm:shrink-0 pl-16 sm:pl-0">
                  <p className="text-xl sm:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  <p className="text-xs sm:text-sm" style={{ color: 'var(--text-muted)' }}>Available Balance</p>
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
