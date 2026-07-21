import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertCircle, X, Check } from 'lucide-react';
import { pin as pinApi } from '../api/client';

interface SetPinModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function PinDigitInput({ digit, onChange, onKeyDown, disabled, refs, index }: {
  digit: string;
  onChange: (val: string) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  disabled: boolean;
  refs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  index: number;
}) {
  return (
    <input
      ref={(el) => { refs.current[index] = el; }}
      type="password"
      inputMode="numeric"
      maxLength={1}
      value={digit}
      onChange={(e) => {
        const val = e.target.value;
        if (!/^\d*$/.test(val)) return;
        onChange(val.slice(-1));
      }}
      onKeyDown={onKeyDown}
      className="w-14 h-14 text-center text-2xl font-bold rounded-xl focus:outline-none transition-all"
      style={{
        background: 'var(--bg-secondary)',
        border: digit ? '2px solid rgba(59,130,246,0.5)' : '2px solid var(--border)',
        color: 'var(--text-primary)',
      }}
      disabled={disabled}
    />
  );
}

export default function SetPinModal({ open, onClose, onSuccess }: SetPinModalProps) {
  const [step, setStep] = useState<'password' | 'pin' | 'confirm'>('password');
  const [password, setPassword] = useState('');
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [confirmDigits, setConfirmDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setStep('password');
      setPassword('');
      setPinDigits(['', '', '', '']);
      setConfirmDigits(['', '', '', '']);
      setError('');
      setLoading(false);
      setTimeout(() => passwordRef.current?.focus(), 100);
    }
  }, [open]);

  const focusNext = (refs: React.MutableRefObject<(HTMLInputElement | null)[]>, index: number) => {
    if (index < 3) refs.current[index + 1]?.focus();
  };

  const focusPrev = (refs: React.MutableRefObject<(HTMLInputElement | null)[]>, index: number) => {
    if (index > 0) refs.current[index - 1]?.focus();
  };

  const handlePasswordSubmit = () => {
    if (!password.trim()) { setError('Password is required'); return; }
    setStep('pin');
    setTimeout(() => pinRefs.current[0]?.focus(), 100);
  };

  const handlePinKeyDown = (refs: React.MutableRefObject<(HTMLInputElement | null)[]>, digits: string[], index: number, e: KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      focusPrev(refs, index);
    }
  };

  const handlePinChange = (digits: string[], setDigits: (d: string[]) => void, refs: React.MutableRefObject<(HTMLInputElement | null)[]>, index: number, value: string) => {
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError('');
    if (value) focusNext(refs, index);
  };

  useEffect(() => {
    if (step === 'pin' && pinDigits.every(d => d !== '')) {
      setStep('confirm');
      setTimeout(() => confirmRefs.current[0]?.focus(), 100);
    }
  }, [pinDigits, step]);

  useEffect(() => {
    if (step === 'confirm' && confirmDigits.every(d => d !== '')) {
      handleSubmit();
    }
  }, [confirmDigits, step]);

  const handleSubmit = async () => {
    if (pinDigits.join('') !== confirmDigits.join('')) {
      setError('PINs do not match');
      setConfirmDigits(['', '', '', '']);
      setTimeout(() => confirmRefs.current[0]?.focus(), 100);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await pinApi.set(password, pinDigits.join(''));
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to set PIN');
      setStep('password');
      setPassword('');
      setPinDigits(['', '', '', '']);
      setConfirmDigits(['', '', '', '']);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="w-full max-w-sm rounded-3xl p-6 relative"
          style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}
        >
          <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-xl transition-all hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
              <Shield size={24} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Set Transaction PIN</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {step === 'password' && 'Confirm your password first'}
              {step === 'pin' && 'Create a 4-digit PIN'}
              {step === 'confirm' && 'Confirm your new PIN'}
            </p>
          </div>

          <div className="flex justify-center gap-2 mb-6">
            {['password', 'pin', 'confirm'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s ? 'bg-blue-500 text-white' :
                  ['password', 'pin', 'confirm'].indexOf(step) > i ? 'bg-emerald-500/20 text-emerald-400' : 'border text-gray-500'
                }`} style={step !== s && ['password', 'pin', 'confirm'].indexOf(step) <= i ? { borderColor: 'var(--border)' } : undefined}>
                  {['password', 'pin', 'confirm'].indexOf(step) > i ? <Check size={14} /> : i + 1}
                </div>
                {i < 2 && <div className="w-6 h-px" style={{ background: 'var(--border)' }} />}
              </div>
            ))}
          </div>

          {step === 'password' && (
            <div>
              <input
                ref={passwordRef}
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordSubmit(); }}
                className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                placeholder="Enter your password"
                disabled={loading}
              />
              <button onClick={handlePasswordSubmit} disabled={loading || !password.trim()}
                className="w-full mt-4 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25">
                Continue
              </button>
            </div>
          )}

          {step === 'pin' && (
            <div className="flex justify-center gap-3">
              {pinDigits.map((digit, i) => (
                <PinDigitInput
                  key={i}
                  digit={digit}
                  refs={pinRefs}
                  index={i}
                  disabled={loading}
                  onChange={(val) => handlePinChange(pinDigits, setPinDigits, pinRefs, i, val)}
                  onKeyDown={(e) => handlePinKeyDown(pinRefs, pinDigits, i, e)}
                />
              ))}
            </div>
          )}

          {step === 'confirm' && (
            <div className="flex justify-center gap-3">
              {confirmDigits.map((digit, i) => (
                <PinDigitInput
                  key={i}
                  digit={digit}
                  refs={confirmRefs}
                  index={i}
                  disabled={loading}
                  onChange={(val) => handlePinChange(confirmDigits, setConfirmDigits, confirmRefs, i, val)}
                  onKeyDown={(e) => handlePinKeyDown(confirmRefs, confirmDigits, i, e)}
                />
              ))}
            </div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2 p-3 rounded-xl mt-4"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {loading && (
            <div className="flex justify-center mt-4">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
