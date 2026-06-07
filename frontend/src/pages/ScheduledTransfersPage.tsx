import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { schedule, accounts } from '../api/client';
import { GlassCard } from '../components/ui/glass-card';
import { IconCalendar } from '../components/Icons';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };
const freqLabels: Record<string, string> = { once: 'Once', daily: 'Daily', weekly: 'Weekly', biweekly: 'Bi-Weekly', monthly: 'Monthly' };

export default function ScheduledTransfersPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [accountList, setAccountList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ recipientAccountNumber: '', amount: '', description: '', frequency: 'monthly', nextRunDate: '', senderAccountId: '' });
  const [saving, setSaving] = useState(false);

  const fetch = async () => { try { const [s, a] = await Promise.all([schedule.list(), accounts.list()]); setSchedules(s); setAccountList(a); } catch {} };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await schedule.create({ ...form, amount: parseFloat(form.amount) });
      toast.success('Scheduled transfer created');
      setShowForm(false);
      setForm({ recipientAccountNumber: '', amount: '', description: '', frequency: 'monthly', nextRunDate: '', senderAccountId: form.senderAccountId });
      fetch();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this scheduled transfer?')) return;
    try { await schedule.cancel(id); toast.success('Cancelled'); fetch(); } catch (err: any) { toast.error(err.message); }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Scheduled Transfers</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Recurring & future payments</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25">{showForm ? 'Cancel' : '+ New Schedule'}</button>
      </motion.div>

      {showForm && (
        <motion.div variants={item}>
          <GlassCard>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>From Account</label>
                  <select value={form.senderAccountId} onChange={e => setForm({ ...form, senderAccountId: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} required>
                    <option value="" className="bg-[#0a0e1a]">Select account</option>
                    {accountList.map(a => <option key={a.id} value={a.id} className="bg-[#0a0e1a]">••••{a.accountNumber.slice(-4)} (${a.balance.toFixed(2)})</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Recipient Account #</label>
                  <input type="text" value={form.recipientAccountNumber} onChange={e => setForm({ ...form, recipientAccountNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })} className="w-full px-4 py-3 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} required maxLength={10} /></div>
                <div><label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Amount (USD)</label>
                  <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} min="0.01" step="0.01" required /></div>
                <div><label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Frequency</label>
                  <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                    {Object.entries(freqLabels).map(([k, v]) => <option key={k} value={k} className="bg-[#0a0e1a]">{v}</option>)}
                  </select></div>
                <div><label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>First Run Date</label>
                  <input type="date" value={form.nextRunDate} onChange={e => setForm({ ...form, nextRunDate: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} required /></div>
                <div><label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
                  <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-3 rounded-xl text-sm focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} /></div>
              </div>
              <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25">{saving ? 'Creating...' : 'Create Schedule'}</motion.button>
            </form>
          </GlassCard>
        </motion.div>
      )}

      <motion.div variants={item} className="space-y-3">
        {schedules.length === 0 ? (
          <GlassCard className="p-8 text-center"><p style={{ color: 'var(--text-muted)' }}>No scheduled transfers</p></GlassCard>
        ) : (
          schedules.map(s => (
            <GlassCard key={s.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <IconCalendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>${s.amount.toFixed(2)} → {s.recipient.firstName} {s.recipient.lastName}</p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.description || 'Scheduled'} • {freqLabels[s.frequency] || s.frequency}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Next: {new Date(s.nextRunDate).toLocaleDateString()}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.runCount > 0 ? `${s.runCount} runs` : 'Not yet run'}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleCancel(s.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all">Cancel</button>
              </div>
            </GlassCard>
          ))
        )}
      </motion.div>
    </motion.div>
  );
}
