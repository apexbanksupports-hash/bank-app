import { useState, useEffect, FormEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { accounts, transfers, categories, wire, banks as banksApi } from '../api/client';
import { GlassCard } from '../components/ui/glass-card';
import BankSelect from '../components/BankSelect';
import {
  IconSend, IconCheck, IconSearch, IconUser, IconBuilding, IconClock,
  IconArrowRight, IconPlus, IconDownload, IconGlobe, IconLandmark,
} from '../components/Icons';
import { useAuth } from '../hooks/useAuth';

function ModeToggle({ mode, setMode, setStep }: {
  mode: 'internal' | 'wire';
  setMode: (m: 'internal' | 'wire') => void;
  setStep: (s: 'form' | 'review' | 'confirm') => void;
}) {
  return (
    <div className="flex p-1 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
      <button
        onClick={() => { setMode('internal'); setStep('form'); }}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'internal' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-gray-400 hover:text-white'}`}
      >
        <IconBuilding size={16} /> Internal
      </button>
      <button
        onClick={() => { setMode('wire'); setStep('form'); }}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'wire' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-gray-400 hover:text-white'}`}
      >
        <IconGlobe size={16} /> International Wire
      </button>
    </div>
  );
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { y: 20, opacity: 0 }, show: { y: 0, opacity: 1 } };

const QUICK_AMOUNTS = [20, 50, 100, 500];
const DAILY_LIMIT = 10000;

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getArrivalEstimate(): string {
  const now = new Date();
  const hour = now.getHours();
  if (hour < 14) return `Arrives today by ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const day = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
  if (day === 'Saturday') tomorrow.setDate(tomorrow.getDate() + 2);
  if (day === 'Sunday') tomorrow.setDate(tomorrow.getDate() + 1);
  return `Arrives by ${tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
}

function getWireArrival(): string {
  const now = new Date();
  const next = new Date(now);
  next.setDate(next.getDate() + 3);
  const day = next.toLocaleDateString('en-US', { weekday: 'long' });
  if (day === 'Saturday') next.setDate(next.getDate() + 2);
  if (day === 'Sunday') next.setDate(next.getDate() + 1);
  return `Arrives by ${next.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`;
}

export default function TransferPage() {
  const { user } = useAuth();
  const [accountList, setAccountList] = useState<any[]>([]);
  const [catList, setCatList] = useState<any[]>([]);
  const [recentTransfers, setRecentTransfers] = useState<any[]>([]);
  const [dailyUsed, setDailyUsed] = useState(0);

  const [mode, setMode] = useState<'internal' | 'wire'>('internal');
  const [step, setStep] = useState<'form' | 'review' | 'confirm'>('form');
  const [senderAccountId, setSenderAccountId] = useState('');
  const [recipientAccount, setRecipientAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);

  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [beneficiaryName, setBeneficiaryName] = useState('');
  const [beneficiaryAccount, setBeneficiaryAccount] = useState('');
  const [swiftCode, setSwiftCode] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');

  const [sending, setSending] = useState(false);
  const [lastTransfer, setLastTransfer] = useState<any>(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const wireFee = parseFloat(amount || '0') * 0.015;
  const wireTotal = parseFloat(amount || '0') + wireFee;

  useEffect(() => {
    Promise.all([accounts.list(), categories.list(), transfers.list(1, 50), transfers.getLimits()]).then(([accts, cats, hist, limits]) => {
      setAccountList(accts);
      setCatList(cats);
      if (accts.length > 0) setSenderAccountId(accts[0].id);
      setRecentTransfers(hist.transfers.filter((t: any) => t.senderId === user?.id));
      setDailyUsed(limits.dailyUsed);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (searchQ.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const results = await accounts.search(searchQ);
        setSearchResults(results);
      } catch {} finally { setSearching(false); }
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQ]);

  useEffect(() => {
    if (selectedBank) {
      setSwiftCode(selectedBank.swift);
    }
  }, [selectedBank]);

  const selectRecipient = (acc: any) => {
    setRecipientAccount(acc.accountNumber);
    setSelectedRecipient(acc);
    setSearchResults([]);
    setSearchQ('');
  };

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!senderAccountId) { toast.error('Select a source account'); return; }
    if (mode === 'internal') {
      if (!selectedRecipient && recipientAccount.length !== 10) { toast.error('Enter a valid 10-digit account number'); return; }
    } else {
      if (!selectedCountry) { toast.error('Select a destination country'); return; }
      if (!selectedBank) { toast.error('Select a bank'); return; }
      if (!beneficiaryName.trim()) { toast.error('Enter the beneficiary name'); return; }
      if (!beneficiaryAccount.trim()) { toast.error('Enter the beneficiary account number'); return; }
      if (!swiftCode.trim()) { toast.error('Enter the SWIFT/BIC code'); return; }
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) { toast.error('Enter a valid amount'); return; }
    if (numAmount > dailyRemaining()) { toast.error('This transfer exceeds your daily limit'); return; }
    setStep('review');
  };

  const handleReviewConfirm = async () => {
    if (!senderAccountId) { toast.error('Select a source account'); return; }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) { toast.error('Enter a valid amount'); return; }
    setSending(true);
    try {
      if (mode === 'wire') {
        const result = await wire.send({
          senderAccountId,
          beneficiaryName: beneficiaryName.trim(),
          beneficiaryAccountNumber: beneficiaryAccount.trim(),
          bankName: selectedBank!.name,
          swiftCode: swiftCode.trim(),
          countryCode: selectedCountry!.code,
          amount: numAmount,
          currency: selectedCountry?.currencyCode || 'USD',
          description: description || undefined,
          recipientEmail: recipientEmail.trim() || undefined,
        });
        setLastTransfer(result);
      } else {
        const result = await transfers.send({
          recipientAccountNumber: recipientAccount,
          amount: numAmount,
          description: description || undefined,
          senderAccountId,
          categoryId: categoryId || null,
        });
        setLastTransfer(result);
      }
      setStep('confirm');
      setDailyUsed(dailyUsed + numAmount);
      const updated = await accounts.list();
      setAccountList(updated);
    } catch (err: any) {
      toast.error(err.message || 'Transfer failed');
      setSending(false);
    }
  };

  const dailyRemaining = () => DAILY_LIMIT - dailyUsed;
  const selectedAccount = accountList.find(a => a.id === senderAccountId);

  const savedRecipients = recentTransfers
    .filter(t => t.recipient.id !== user?.id)
    .reduce((acc: any[], t) => {
      if (!acc.find(r => r.id === t.recipient.id)) {
        acc.push(t.recipient);
      }
      return acc;
    }, [])
    .slice(0, 4);

  const resetForm = () => {
    setStep('form');
    setRecipientAccount('');
    setAmount('');
    setDescription('');
    setCategoryId('');
    setSelectedRecipient(null);
    setLastTransfer(null);
    setSelectedCountry(null);
    setSelectedBank(null);
    setBeneficiaryName('');
    setBeneficiaryAccount('');
    setSwiftCode('');
    setRecipientEmail('');
  };

  const sendAgain = () => {
    if (lastTransfer) {
      if (mode === 'internal') {
        setRecipientAccount(lastTransfer.recipient?.accountNumber || '');
        setSelectedRecipient(lastTransfer.recipient);
      } else {
        setBeneficiaryName(lastTransfer.beneficiaryName || '');
        setBeneficiaryAccount(lastTransfer.beneficiaryAccountNumber || '');
        setSwiftCode(lastTransfer.swiftCode || '');
      }
      setAmount('');
      setStep('form');
      setLastTransfer(null);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-6xl mx-auto space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Transfer</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          {mode === 'internal' ? 'Send money to any APEX BANK account' : 'Send money worldwide via international wire'}
        </p>
      </motion.div>

      <motion.div variants={item}>
        <ModeToggle mode={mode} setMode={setMode} setStep={setStep} />
      </motion.div>

      <motion.div variants={item} className="flex items-center gap-2 justify-center">
        {(['form', 'review', 'confirm'] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              step === s ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
              ['form', 'review', 'confirm'].indexOf(step) > i ? 'text-emerald-400' : 'text-gray-500'
            }`} style={{ background: step === s ? undefined : 'var(--bg-secondary)' }}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === s ? 'bg-blue-500 text-white' :
                ['form', 'review', 'confirm'].indexOf(step) > i ? 'bg-emerald-500/20 text-emerald-400' : 'border border-gray-500 text-gray-500'
              }`}>
                {['form', 'review', 'confirm'].indexOf(step) > i ? <IconCheck size={10} /> : i + 1}
              </div>
              <span className="hidden sm:inline capitalize">{s === 'confirm' ? 'Confirmation' : s}</span>
            </div>
            {i < 2 && <div className="w-6 h-px" style={{ background: 'var(--border)' }} />}
          </div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <motion.div variants={item} className="lg:col-span-3">
          {step === 'form' && (
            <GlassCard>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>From Account</label>
                  <select value={senderAccountId} onChange={(e) => setSenderAccountId(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }} required>
                    {accountList.map((acc) => (
                      <option key={acc.id} value={acc.id} className="bg-[#0a0e1a]">
                        {acc.accountType.charAt(0).toUpperCase() + acc.accountType.slice(1)} — ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} (••••{acc.accountNumber.slice(-4)})
                      </option>
                    ))}
                  </select>
                </div>

                {mode === 'internal' ? (
                  <div ref={searchRef} className="relative">
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Recipient</label>
                    <div className="relative">
                      <IconSearch size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                      <input
                        type="text"
                        value={searchQ}
                        onChange={(e) => { setSearchQ(e.target.value); if (selectedRecipient) setSelectedRecipient(null); }}
                        className="w-full pl-10 pr-4 py-3 rounded-xl placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-all input-glow"
                        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        placeholder="Search by name, email, or account..."
                      />
                      {searching && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <AnimatePresence>
                      {searchResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.98 }}
                          className="absolute z-20 left-0 right-0 mt-1 rounded-xl border shadow-xl overflow-hidden"
                          style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}
                        >
                          {searchResults.map((acc) => (
                            <button key={acc.id} type="button" onClick={() => selectRecipient(acc)}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all hover:bg-white/5"
                              style={{ borderBottom: '1px solid var(--border)' }}>
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {acc.user.firstName[0]}{acc.user.lastName[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{acc.user.firstName} {acc.user.lastName}</p>
                                <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>••••{acc.accountNumber.slice(-4)} · {acc.accountType}</p>
                              </div>
                              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{acc.accountNumber}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {selectedRecipient && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        className="mt-2 flex items-center gap-3 p-3 rounded-xl"
                        style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                        <IconCheck size={16} className="text-emerald-400 shrink-0" />
                        <span className="text-sm text-emerald-400 font-medium">{selectedRecipient.user.firstName} {selectedRecipient.user.lastName}</span>
                        <span className="text-xs text-emerald-400/60 font-mono ml-auto">{selectedRecipient.accountNumber}</span>
                      </motion.div>
                    )}
                    <div className="mt-3">
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Or enter account number manually</label>
                      <input type="text" value={recipientAccount} onChange={(e) => setRecipientAccount(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full px-4 py-3 rounded-xl placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-all input-glow text-sm"
                        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        placeholder="10-digit account number" maxLength={10} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <BankSelect
                      selectedCountry={selectedCountry}
                      selectedBank={selectedBank}
                      onSelectCountry={setSelectedCountry}
                      onSelect={setSelectedBank}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Beneficiary Name</label>
                        <input type="text" value={beneficiaryName} onChange={e => setBeneficiaryName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-all input-glow"
                          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          placeholder="Full name as on bank account" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Account Number / IBAN</label>
                        <input type="text" value={beneficiaryAccount} onChange={e => setBeneficiaryAccount(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-all input-glow"
                          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          placeholder="Recipient account number" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>SWIFT / BIC Code</label>
                      <input type="text" value={swiftCode} onChange={e => setSwiftCode(e.target.value.toUpperCase())}
                        className="w-full px-4 py-3 rounded-xl placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-all input-glow font-mono"
                        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        placeholder="e.g. BOFAUS3N" maxLength={11} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                        Recipient Email <span className="text-xs" style={{ color: 'var(--text-muted)' }}>(receipt will be sent here)</span>
                      </label>
                      <input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-all input-glow"
                        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        placeholder="recipient@example.com" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-medium" style={{ color: 'var(--text-muted)' }}>$</span>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 rounded-xl placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-all input-glow"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      placeholder="0.00" min="0.01" step="0.01" required />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {QUICK_AMOUNTS.map((q) => (
                      <button key={q} type="button" onClick={() => setAmount(q.toString())}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${parseFloat(amount) === q ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'border hover:bg-white/5'}`}
                        style={{ borderColor: 'var(--border)', color: parseFloat(amount) === q ? undefined : 'var(--text-muted)' }}>
                        ${q}
                      </button>
                    ))}
                  </div>
                </div>

                {mode === 'wire' && parseFloat(amount) > 0 && (
                  <div className="p-3 rounded-xl text-xs space-y-1" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                    <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Wire Fee (1.5%)</span><span style={{ color: 'var(--text-primary)' }}>${wireFee.toFixed(2)}</span></div>
                    <div className="flex justify-between font-medium"><span style={{ color: 'var(--text-muted)' }}>Total Deducted</span><span style={{ color: 'var(--text-primary)' }}>${wireTotal.toFixed(2)}</span></div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Category</label>
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-4 py-3 rounded-xl focus:border-blue-500/50 focus:outline-none transition-all" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}>
                      <option value="" className="bg-[#0a0e1a]">None</option>
                      {catList.map((c: any) => (<option key={c.id} value={c.id} className="bg-[#0a0e1a]">{c.icon} {c.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl placeholder-gray-500 focus:border-blue-500/50 focus:outline-none transition-all input-glow"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                      placeholder="What's this for?" maxLength={200} />
                  </div>
                </div>

                <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                  Continue <IconArrowRight size={16} />
                </motion.button>
              </form>
            </GlassCard>
          )}

          {step === 'review' && (
            <GlassCard>
              <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Review Transfer</h2>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Please verify the details before sending</p>

              <div className="space-y-4">
                <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-secondary)' }}>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Amount to send</p>
                  <p className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    ${parseFloat(amount || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{mode === 'wire' ? getWireArrival() : getArrivalEstimate()}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>From</span>
                    <span className="text-sm font-medium text-right" style={{ color: 'var(--text-primary)' }}>
                      {selectedAccount?.accountType.charAt(0).toUpperCase() + selectedAccount?.accountType.slice(1)} — ••••{selectedAccount?.accountNumber.slice(-4)}
                      <br /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Balance: ${selectedAccount?.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </span>
                  </div>

                  {mode === 'internal' ? (
                    <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>To</span>
                      <span className="text-sm font-medium text-right" style={{ color: 'var(--text-primary)' }}>
                        {selectedRecipient ? `${selectedRecipient.user.firstName} ${selectedRecipient.user.lastName}` : 'Account'} — ••••{recipientAccount.slice(-4)}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Beneficiary</span>
                        <span className="text-sm font-medium text-right" style={{ color: 'var(--text-primary)' }}>{beneficiaryName}</span>
                      </div>
                      <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Bank</span>
                        <span className="text-sm font-medium text-right" style={{ color: 'var(--text-primary)' }}>
                          {selectedBank?.name}<br />
                          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{swiftCode}</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Account / IBAN</span>
                        <span className="text-sm font-medium font-mono" style={{ color: 'var(--text-primary)' }}>{beneficiaryAccount}</span>
                      </div>
                      <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Destination</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{selectedCountry?.country} ({selectedCountry?.code})</span>
                      </div>
                      {recipientEmail && (
                        <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Receipt Email</span>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{recipientEmail}</span>
                        </div>
                      )}
                    </>
                  )}

                  {description && (
                    <div className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border)' }}>
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Description</span>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{description}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg text-xs" style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                  {mode === 'wire' ? (
                    <>
                      <div className="flex justify-between mb-1"><span style={{ color: 'var(--text-muted)' }}>Wire Fee (1.5%)</span><span style={{ color: 'var(--text-primary)' }}>${wireFee.toFixed(2)}</span></div>
                      <div className="flex justify-between mb-1"><span style={{ color: 'var(--text-muted)' }}>Total Deducted</span><span style={{ color: 'var(--text-primary)' }}>${wireTotal.toFixed(2)}</span></div>
                    </>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}><strong style={{ color: 'var(--text-primary)' }}>Fee:</strong> No fee for standard transfers.</p>
                  )}
                  <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
                    <strong style={{ color: 'var(--text-primary)' }}>Daily limit remaining:</strong> ${dailyRemaining().toLocaleString('en-US', { minimumFractionDigits: 2 })} of ${DAILY_LIMIT.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button onClick={() => setStep('form')} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all border"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>Edit</motion.button>
                <motion.button onClick={handleReviewConfirm} disabled={sending} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="flex-[2] py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                  {sending ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Processing...
                    </span>
                  ) : <>Send ${parseFloat(amount || '0').toFixed(2)}</>}
                </motion.button>
              </div>
            </GlassCard>
          )}

          {step === 'confirm' && lastTransfer && (
            <GlassCard>
              <div className="text-center py-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                  className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
                  <IconCheck size={32} className="text-emerald-400" />
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <h2 className="text-xl font-bold text-emerald-400 mb-1">Transfer Complete</h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Your money has been sent successfully</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                  className="mt-6 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                  <p className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                    ${lastTransfer.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  {mode === 'wire' ? (
                    <>
                      <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{lastTransfer.beneficiaryName || beneficiaryName}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{lastTransfer.bankName || selectedBank?.name} · {lastTransfer.swiftCode || swiftCode}</p>
                    </>
                  ) : (
                    <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{lastTransfer.recipient?.firstName} {lastTransfer.recipient?.lastName}</p>
                  )}
                  <p className="text-xs mt-3 font-mono" style={{ color: 'var(--text-muted)' }}>Ref: {lastTransfer.referenceNumber}</p>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-4 space-y-2">
                  <motion.button onClick={sendAgain} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                    <IconSend size={16} /> Send Again
                  </motion.button>
                  <div className="flex gap-2">
                    <motion.button onClick={() => window.print()} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border flex items-center justify-center gap-2"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      <IconDownload size={14} /> Print Receipt
                    </motion.button>
                    <motion.button onClick={resetForm} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border"
                      style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                      New Transfer
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </GlassCard>
          )}
        </motion.div>

        <motion.div variants={item} className="lg:col-span-2 space-y-4">
          <GlassCard>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Daily Limit</h3>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>${dailyRemaining().toLocaleString()}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>remaining</span>
            </div>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${(dailyUsed / DAILY_LIMIT) * 100}%` }}
                className="h-full rounded-full"
                style={{ background: dailyRemaining() < 1000 ? '#ef4444' : dailyRemaining() < 5000 ? '#f59e0b' : '#2563eb' }} />
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>${dailyUsed.toLocaleString()} of ${DAILY_LIMIT.toLocaleString()} used today</p>
          </GlassCard>

          {mode === 'wire' && selectedBank && (
            <GlassCard>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <IconLandmark size={16} className="text-blue-400" /> Bank Details
              </h3>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Bank</span><span className="font-medium" style={{ color: 'var(--text-primary)' }}>{selectedBank.name}</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>SWIFT</span><span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{selectedBank.swift}</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Type</span><span className="capitalize" style={{ color: 'var(--text-secondary)' }}>{selectedBank.type}</span></div>
              </div>
            </GlassCard>
          )}

          {mode === 'wire' && (
            <GlassCard>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <IconGlobe size={16} className="text-blue-400" /> Wire Transfer Info
              </h3>
              <div className="space-y-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <span>International wire transfers typically arrive in 1-3 business days</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <span>A 1.5% wire fee applies (min $10, max $50)</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <span>Recipient may receive funds in local currency at their bank's exchange rate</span>
                </div>
              </div>
            </GlassCard>
          )}

          {mode === 'internal' && savedRecipients.length > 0 && (
            <GlassCard>
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Saved Recipients</h3>
              <div className="space-y-1">
                {savedRecipients.map((r: any) => (
                  <button key={r.id} onClick={() => {
                    const found = recentTransfers.find(t => t.recipient.id === r.id);
                    if (found) { setRecipientAccount(found.recipient.accountNumber || ''); setSelectedRecipient(found.recipient); }
                  }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all hover:bg-white/5"
                    style={{ color: 'var(--text-primary)' }}>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                      {r.firstName[0]}{r.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{r.firstName} {r.lastName}</p></div>
                    <IconPlus size={12} style={{ color: 'var(--text-muted)' }} />
                  </button>
                ))}
              </div>
            </GlassCard>
          )}

          <GlassCard>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Your Accounts</h3>
            <div className="space-y-2">
              {accountList.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between p-2.5 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
                  <div className="flex items-center gap-2.5">
                    <IconBuilding size={14} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{acc.accountType}</span>
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>
          </GlassCard>

          {step === 'confirm' && lastTransfer && (
            <GlassCard className="border-emerald-500/20">
              <div className="flex items-center gap-2 mb-3">
                <IconCheck size={14} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-emerald-400">Receipt Summary</h3>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Ref</span><span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{lastTransfer.referenceNumber}</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Amount</span><span className="font-medium text-emerald-400">${lastTransfer.amount.toFixed(2)}</span></div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>To</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {mode === 'wire' ? lastTransfer.beneficiaryName || beneficiaryName : `${lastTransfer.recipient?.firstName} ${lastTransfer.recipient?.lastName}`}
                  </span>
                </div>
                <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Date</span><span style={{ color: 'var(--text-secondary)' }}>{formatDate(lastTransfer.createdAt)}</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Status</span><span className="text-emerald-400 capitalize">{lastTransfer.status}</span></div>
              </div>
            </GlassCard>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
