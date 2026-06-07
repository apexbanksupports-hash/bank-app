import { useState, FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { auth } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { ApexLogo } from '../components/Icons';

export default function TwoFactorPage() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const state = location.state as { userId?: string; email?: string } | null;
  if (!state?.userId) { navigate('/login'); return null; }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await auth.verify2FALogin(state.userId!, token);
      login(result.token, result.user);
      toast.success('Verified!');
      navigate('/dashboard');
    } catch (err: any) { toast.error(err.message || 'Invalid code'); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <img
        src="https://picsum.photos/seed/bank-vault/1920/1080"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#070b14]/90 via-[#070b14]/70 to-[#070b14]/90" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-transparent to-transparent" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(59,130,246,0.6) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute top-[15%] -left-20 w-[30rem] h-[30rem] bg-blue-500/12 rounded-full blur-[120px]" />
      <div className="absolute bottom-[20%] -right-20 w-[35rem] h-[35rem] bg-blue-600/8 rounded-full blur-[140px]" />
      <div className="absolute top-[55%] left-[45%] w-64 h-64 bg-blue-400/5 rounded-full blur-[80px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-block"
          >
            <ApexLogo size={56} className="mx-auto mb-4" />
          </motion.div>
          <h1 className="text-3xl font-bold glow-text" style={{ color: 'var(--text-primary)' }}>Two-Factor Auth</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Enter the code from your authenticator app</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <div className="relative">
            <div className="absolute -top-px left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full pointer-events-none" />
            <div className="glass rounded-2xl p-5 sm:p-8 glow">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Verify your identity</h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{state.email}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-center" style={{ color: 'var(--text-muted)' }}>Authentication Code</label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-4 text-center text-3xl tracking-[0.5em] bg-white/5 border border-white/10 rounded-xl focus:border-blue-500/50 focus:outline-none transition-all input-glow"
                    style={{ color: 'var(--text-primary)' }}
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={loading || token.length !== 6}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-3.5 rounded-xl bg-blue-600 font-semibold text-sm hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/25 text-white"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Verifying...
                    </span>
                  ) : 'Verify'}
                </motion.button>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
