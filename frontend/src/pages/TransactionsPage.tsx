import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { transfers, accounts, categories as catApi } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { GlassCard } from '../components/ui/glass-card';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

export default function TransactionsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>({ transfers: [], total: 0, page: 1, pages: 1 });
  const [accountList, setAccountList] = useState<any[]>([]);
  const [catList, setCatList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedTxn, setSelectedTxn] = useState<any>(null);
  const [page, setPage] = useState(1);

  const fetch = async (p: number) => {
    setLoading(true);
    try {
      const result = await transfers.list(p, 20);
      setData(result);
      setAccountList(await accounts.list());
      setCatList(await catApi.list());
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetch(page); }, [page]);

  const filtered = data.transfers.filter((txn: any) => {
    if (filter === 'sent' && txn.senderId !== user?.id) return false;
    if (filter === 'received' && txn.recipientId !== user?.id) return false;
    if (selectedAccount !== 'all') {
      if (txn.senderAccountId !== selectedAccount && txn.recipientAccountId !== selectedAccount) return false;
    }
    return true;
  });

  const handleReverse = async (id: string) => {
    if (!confirm('Reverse this transaction? This will refund the full amount from the recipient.')) return;
    try { await transfers.reverse(id); toast.success('Transaction reversed'); fetch(page); } catch (err: any) { toast.error(err.message); }
  };

  const handleCategorize = async (transferId: string, categoryId: string) => {
    try { await catApi.categorizeTransfer(transferId, categoryId || null); toast.success('Category updated'); fetch(page); } catch (err: any) { toast.error(err.message); }
  };

  const canReverse = (txn: any) => {
    if (!txn || txn.senderId !== user?.id) return false;
    if (txn.status !== 'completed') return false;
    if (txn.reversedFromId) return false;
    return (Date.now() - new Date(txn.createdAt).getTime()) / (1000 * 60 * 60) <= 72;
  };

  if (loading && page === 1) return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Transaction History</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>{data.total} total transactions</p>
      </motion.div>

      <motion.div variants={item} className="flex items-center gap-2 sm:gap-4 overflow-x-auto hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex rounded-xl border shrink-0" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)' }}>
          {['all', 'sent', 'received'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 sm:px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${filter === f ? 'bg-blue-500/20 text-blue-400' : ''}`} style={{ color: filter === f ? undefined : 'var(--text-muted)' }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} className="px-3 sm:px-4 py-2 rounded-xl text-sm focus:outline-none focus:border-blue-500/50 transition-all shrink-0" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
          <option value="all" className="bg-[#0a0e1a]">All Accounts</option>
          {accountList.map((acc) => (
            <option key={acc.id} value={acc.id} className="bg-[#0a0e1a]">••••{acc.accountNumber.slice(-4)} - {acc.accountType}</option>
          ))}
        </select>
      </motion.div>

      <motion.div variants={item}>
        <GlassCard className="overflow-hidden !p-0">
          {filtered.length === 0 ? (
            <div className="p-8 text-center"><p style={{ color: 'var(--text-muted)' }}>No transactions found</p></div>
          ) : (
            <div className="table-wrap">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr style={{ borderColor: 'var(--border)' }} className="border-b bg-white/[0.02]">
                    <th className="text-left px-4 sm:px-6 py-4 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Type</th>
                    <th className="text-left px-4 sm:px-6 py-4 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Counterparty</th>
                    <th className="text-left px-4 sm:px-6 py-4 text-xs font-medium uppercase hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>Description</th>
                    <th className="text-left px-4 sm:px-6 py-4 text-xs font-medium uppercase hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>Category</th>
                    <th className="text-right px-4 sm:px-6 py-4 text-xs font-medium uppercase" style={{ color: 'var(--text-muted)' }}>Amount</th>
                    <th className="text-right px-4 sm:px-6 py-4 text-xs font-medium uppercase hidden sm:table-cell" style={{ color: 'var(--text-muted)' }}>Status</th>
                    <th className="text-right px-4 sm:px-6 py-4 text-xs font-medium uppercase hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((txn: any) => {
                    const isSender = txn.senderId === user?.id;
                    const counterParty = isSender ? txn.recipient : txn.sender;
                    return (
                      <tr key={txn.id} className="border-b hover:bg-white/[0.03] cursor-pointer transition-colors" style={{ borderColor: 'var(--border)' }} onClick={() => setSelectedTxn(selectedTxn?.id === txn.id ? null : txn)}>
                        <td className="px-4 sm:px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${isSender ? 'text-red-400' : 'text-emerald-400'}`}>
                            <span className={`w-2 h-2 rounded-full ${isSender ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            {isSender ? 'Sent' : 'Received'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{counterParty.firstName} {counterParty.lastName}</td>
                        <td className="px-4 sm:px-6 py-4 text-sm max-w-[200px] truncate hidden md:table-cell" style={{ color: 'var(--text-muted)' }}>{txn.description || '-'}</td>
                        <td className="px-4 sm:px-6 py-4 text-sm hidden md:table-cell">
                          {txn.category ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ background: 'var(--input-bg)', color: 'var(--text-muted)' }}>{txn.category.icon} {txn.category.name}</span>
                          ) : <span className="text-xs" style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                        <td className={`px-4 sm:px-6 py-4 text-sm font-semibold text-right ${isSender ? 'text-red-400' : 'text-emerald-400'}`}>
                          {isSender ? '-' : '+'}${txn.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right hidden sm:table-cell">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${txn.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : txn.status === 'reversed' ? 'bg-orange-500/10 text-orange-400' : 'bg-gray-500/10 text-gray-400'}`}>
                            {txn.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-sm text-right hidden lg:table-cell" style={{ color: 'var(--text-muted)' }}>{new Date(txn.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {data.pages > 1 && (
        <motion.div variants={item} className="flex items-center justify-center gap-3">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 rounded-xl text-sm disabled:opacity-30 transition-all" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Previous</button>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Page {page} of {data.pages}</span>
          <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 rounded-xl text-sm disabled:opacity-30 transition-all" style={{ background: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Next</button>
        </motion.div>
      )}

      {selectedTxn && (
        <motion.div variants={item}>
          <GlassCard>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Transaction Details</h3>
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{selectedTxn.referenceNumber}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <select value={selectedTxn.category?.id || ''} onChange={(e) => handleCategorize(selectedTxn.id, e.target.value)} className="px-3 py-1.5 rounded-lg text-xs outline-none" style={{ background: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--text-primary)' }}>
                  <option value="" className="bg-[#0a0e1a]">{selectedTxn.category ? selectedTxn.category.name : 'Set category'}</option>
                  {catList.filter((c: any) => !selectedTxn.category || c.id !== selectedTxn.category.id).map((c: any) => <option key={c.id} value={c.id} className="bg-[#0a0e1a]">{c.icon} {c.name}</option>)}
                </select>
                {canReverse(selectedTxn) && (
                  <button onClick={() => handleReverse(selectedTxn.id)} className="px-3 py-1.5 bg-orange-500/10 text-orange-400 rounded-lg text-xs hover:bg-orange-500/20 border border-orange-500/20 transition-all">Reverse</button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div><span style={{ color: 'var(--text-muted)' }}>Status:</span><span className={`ml-2 font-medium capitalize ${selectedTxn.status === 'completed' ? 'text-emerald-400' : selectedTxn.status === 'reversed' ? 'text-orange-400' : ''}`} style={{ color: selectedTxn.status === 'completed' || selectedTxn.status === 'reversed' ? undefined : 'var(--text-muted)' }}>{selectedTxn.status}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Amount:</span><span className="ml-2 font-medium" style={{ color: 'var(--text-primary)' }}>${selectedTxn.amount.toFixed(2)}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>From:</span><span className="ml-2 font-medium" style={{ color: 'var(--text-secondary)' }}>{selectedTxn.sender.firstName} {selectedTxn.sender.lastName}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>To:</span><span className="ml-2 font-medium" style={{ color: 'var(--text-secondary)' }}>{selectedTxn.recipient.firstName} {selectedTxn.recipient.lastName}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Description:</span><span className="ml-2 font-medium" style={{ color: 'var(--text-secondary)' }}>{selectedTxn.description || 'N/A'}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Created:</span><span className="ml-2 font-medium" style={{ color: 'var(--text-secondary)' }}>{new Date(selectedTxn.createdAt).toLocaleString()}</span></div>
              {selectedTxn.completedAt && <div><span style={{ color: 'var(--text-muted)' }}>Completed:</span><span className="ml-2 font-medium" style={{ color: 'var(--text-secondary)' }}>{new Date(selectedTxn.completedAt).toLocaleString()}</span></div>}
            </div>
          </GlassCard>
        </motion.div>
      )}
    </motion.div>
  );
}
