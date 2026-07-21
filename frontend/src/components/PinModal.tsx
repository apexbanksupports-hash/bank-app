import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, AlertCircle, X } from 'lucide-react';
import { pin as pinApi } from '../api/client';

interface PinModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  title?: string;
  subtitle?: string;
}

export default function PinModal({ open, onClose, onSuccess, title = 'Enter Transaction PIN', subtitle = 'Enter your 4-digit PIN to continue' }: PinModalProps) {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (open) {
      setDigits(['', '', '', '']);
      setError('');
      setLoading(false);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setError('');
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
    if (newDigits.every(d => d !== '')) {
      submitPin(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitPin = async (pinCode: string) => {
    setLoading(true);
    setError('');
    try {
      await pinApi.verify(pinCode);
      onSuccess(pinCode);
    } catch (err: any) {
      setError(err.message || 'Invalid PIN');
      setDigits(['', '', '', '']);
      inputRefs.current[0]?.focus();
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
              <Lock size={24} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
          </div>

          <div className="flex justify-center gap-3 mb-4">
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-14 h-14 text-center text-2xl font-bold rounded-xl focus:outline-none transition-all"
                style={{
                  background: 'var(--bg-secondary)',
                  border: error ? '2px solid #ef4444' : digit ? '2px solid rgba(59,130,246,0.5)' : '2px solid var(--border)',
                  color: 'var(--text-primary)',
                  caretColor: 'transparent',
                }}
                disabled={loading}
              />
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-2 p-3 rounded-xl mb-4"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {loading && (
            <div className="flex justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
            Enter all 4 digits to verify
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
