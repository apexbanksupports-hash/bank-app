import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { beneficiaries, banks as banksApi } from '../api/client';
import { GlassCard } from '../components/ui/glass-card';
import BankSelect from '../components/BankSelect';
import {
  IconPlus, IconHeart, IconTrash2, IconSearch, IconGlobe, IconCheck, IconClose, IconBuilding,
} from '../components/Icons';
import { useNavigate } from 'react-router-dom';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

export default function BeneficiariesPage() {
  const navigate = useNavigate();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankCountry, setBankCountry] = useState('');
  const [bankCountryCode, setBankCountryCode] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const fetchList = async () => {
    try {
      const data = await beneficiaries.list();
      setList(data);
    } catch (err: any) {
      toast.error('Failed to load beneficiaries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  useEffect(() => {
    if (selectedBank) {
      setSwiftCode(selectedBank.swift);
      setBankName(selectedBank.name);
    }
  }, [selectedBank]);

  useEffect(() => {
    if (selectedCountry) {
      setBankCountry(selectedCountry.country);
      setBankCountryCode(selectedCountry.code);
      setCurrency(selectedCountry.currencyCode || 'USD');
    }
  }, [selectedCountry]);

  const resetForm = () => {
    setName(''); setEmail(''); setBankName(''); setBankCountry('');
    setBankCountryCode(''); setSwiftCode(''); setAccountNumber('');
    setCurrency('USD'); setSelectedCountry(null); setSelectedBank(null);
    setEditingId(null); setShowForm(false);
  };

  const startEdit = (b: any) => {
    setEditingId(b.id);
    setName(b.name);
    setEmail(b.email || '');
    setBankName(b.bankName);
    setBankCountry(b.bankCountry);
    setBankCountryCode(b.bankCountryCode);
    setSwiftCode(b.swiftCode);
    setAccountNumber(b.accountNumber);
    setCurrency(b.currency);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Enter beneficiary name'); return; }
    if (!bankName.trim()) { toast.error('Select a bank'); return; }
    if (!bankCountryCode) { toast.error('Select a country'); return; }
    if (!swiftCode.trim()) { toast.error('Enter SWIFT code'); return; }
    if (!accountNumber.trim()) { toast.error('Enter account number'); return; }

    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        email: email.trim() || undefined,
        bankName: bankName.trim(),
        bankCountry: bankCountry.trim(),
        bankCountryCode,
        swiftCode: swiftCode.trim(),
        accountNumber: accountNumber.trim(),
        currency,
      };

      if (editingId) {
        await beneficiaries.update(editingId, data);
        toast.success('Beneficiary updated');
      } else {
        await beneficiaries.create(data);
        toast.success('Beneficiary saved');
      }
      resetForm();
      fetchList();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this beneficiary?')) return;
    try {
      await beneficiaries.delete(id);
      toast.success('Beneficiary deleted');
      fetchList();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await beneficiaries.toggleFavorite(id);
      fetchList();
    } catch {}
  };

  const sendToBeneficiary = (b: any) => {
    navigate('/transfer', { state: { wireBeneficiary: b } });
  };

  const filtered = list.filter(b =>
    b.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    b.bankName.toLowerCase().includes(searchQ.toLowerCase()) ||
    b.swiftCode.toLowerCase().includes(searchQ.toLowerCase())
  );

  const favorites = filtered.filter(b => b.isFavorite);
  const others = filtered.filter(b => !b.isFavorite);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-6">
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Beneficiaries</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>Manage your international wire transfer recipients</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/25"
        >
          <IconPlus size={16} /> Add Beneficiary
        </motion.button>
      </motion.div>

      <motion.div variants={item}>
        <div className="relative">
          <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-all input-glow"
            style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
            placeholder="Search by name, bank, or SWIFT code..."
          />
        </div>
      </motion.div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {editingId ? 'Edit Beneficiary' : 'New Beneficiary'}
                </h2>
                <button onClick={resetForm} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
                  <IconClose size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Full Name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-all input-glow"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      placeholder="Beneficiary full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email (optional)</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-all input-glow"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      placeholder="beneficiary@email.com" />
                  </div>
                </div>

                <BankSelect
                  selectedCountry={selectedCountry}
                  selectedBank={selectedBank}
                  onSelectCountry={setSelectedCountry}
                  onSelect={setSelectedBank}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>SWIFT / BIC Code</label>
                    <input type="text" value={swiftCode} onChange={e => setSwiftCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 rounded-xl placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-all input-glow font-mono"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      placeholder="e.g. BOFAUS3N" maxLength={11} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Account / IBAN</label>
                    <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-all input-glow"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      placeholder="Recipient account number" />
                  </div>
                </div>

                <div className="flex gap-3">
                  <motion.button onClick={handleSave} disabled={saving} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                    {saving ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Saving...
                      </span>
                    ) : editingId ? 'Update Beneficiary' : 'Save Beneficiary'}
                  </motion.button>
                  <motion.button onClick={resetForm} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="px-6 py-3 rounded-xl text-sm font-medium transition-all border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    Cancel
                  </motion.button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <motion.div variants={item}>
          <GlassCard className="text-center py-12">
            <IconGlobe size={40} className="mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No Beneficiaries Yet</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
              Add international beneficiaries to send wire transfers quickly
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/25"
            >
              <IconPlus size={16} /> Add First Beneficiary
            </motion.button>
          </GlassCard>
        </motion.div>
      ) : (
        <>
          {favorites.length > 0 && (
            <motion.div variants={item}>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <IconHeart size={14} className="text-rose-400" /> Favorites
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {favorites.map(b => (
                  <BeneficiaryCard
                    key={b.id}
                    beneficiary={b}
                    onSend={sendToBeneficiary}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {others.length > 0 && (
            <motion.div variants={item}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                All Beneficiaries ({others.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {others.map(b => (
                  <BeneficiaryCard
                    key={b.id}
                    beneficiary={b}
                    onSend={sendToBeneficiary}
                    onEdit={startEdit}
                    onDelete={handleDelete}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}

function BeneficiaryCard({ beneficiary, onSend, onEdit, onDelete, onToggleFavorite }: {
  beneficiary: any;
  onSend: (b: any) => void;
  onEdit: (b: any) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}) {
  const b = beneficiary;
  return (
    <GlassCard className="group">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
          style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa' }}>
          {b.bankCountryCode}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{b.name}</p>
            {b.isFavorite && <IconHeart size={12} className="text-rose-400 shrink-0" />}
          </div>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{b.bankName}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
              {b.swiftCode}
            </span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {b.currency}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSend(b)}
          className="flex-1 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-all flex items-center justify-center gap-1"
        >
          <IconGlobe size={12} /> Send Wire
        </motion.button>
        <button onClick={() => onToggleFavorite(b.id)}
          className="p-2 rounded-lg hover:bg-white/5 transition-all"
          style={{ color: b.isFavorite ? '#f43f5e' : 'var(--text-muted)' }}>
          <IconHeart size={14} style={{ fill: b.isFavorite ? '#f43f5e' : 'none' }} />
        </button>
        <button onClick={() => onEdit(b)}
          className="p-2 rounded-lg hover:bg-white/5 transition-all text-xs"
          style={{ color: 'var(--text-muted)' }}>
          Edit
        </button>
        <button onClick={() => onDelete(b.id)}
          className="p-2 rounded-lg hover:bg-white/5 transition-all"
          style={{ color: 'rgba(239,68,68,0.6)' }}>
          <IconTrash2 size={14} />
        </button>
      </div>
    </GlassCard>
  );
}
