import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Phases ── */
enum Phase { Grid, Genesis, Logo, Type, Tagline, Done }

/* ── Particles ── */
function BurstParticles({ active }: { active: boolean }) {
  const count = 24;
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {Array.from({ length: count }).map((_, i) => {
        const angle = (360 / count) * i;
        const dist = 60 + Math.random() * 100;
        const size = 2 + Math.random() * 3;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size, height: size,
              background: `radial-gradient(circle, rgba(59,130,246,0.6), rgba(59,130,246,0))`,
            }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={active ? {
              x: Math.cos((angle * Math.PI) / 180) * dist,
              y: Math.sin((angle * Math.PI) / 180) * dist,
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0.5],
            } : { x: 0, y: 0, opacity: 0 }}
            transition={{
              duration: 1.2 + Math.random() * 0.6,
              delay: 0.1 * i,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </div>
  );
}

/* ── Orbiting rings ── */
function OrbitRings({ phase }: { phase: Phase }) {
  if (phase < Phase.Genesis) return null;
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
        animate={{ opacity: 0.15, scale: 1, rotate: 360 }}
        transition={{ duration: 3, ease: 'easeOut', repeat: Infinity, repeatType: 'loop' }}
        className="absolute w-64 h-64 rounded-full"
        style={{
          border: '1px solid rgba(59,130,246,0.15)',
          boxShadow: '0 0 40px rgba(59,130,246,0.04)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
        animate={{ opacity: 0.1, scale: 1, rotate: -360 }}
        transition={{ duration: 4, ease: 'easeOut', repeat: Infinity, repeatType: 'loop', delay: 0.3 }}
        className="absolute w-48 h-48 rounded-full"
        style={{
          border: '1px solid rgba(96,165,250,0.1)',
          boxShadow: '0 0 30px rgba(96,165,250,0.03)',
        }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.08, scale: 1 }}
        transition={{ duration: 2, ease: 'easeOut', delay: 0.6 }}
        className="absolute w-80 h-80 rounded-full"
        style={{
          border: '1px dashed rgba(59,130,246,0.06)',
        }}
      />
    </div>
  );
}

/* ── Expanding grid ── */
function ExpandGrid({ phase }: { phase: Phase }) {
  const show = phase >= Phase.Grid;
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
    >
      <motion.svg
        width="600" height="600" viewBox="0 0 600 600"
        initial={{ scale: 0, rotate: 0 }}
        animate={{ scale: [0, 1, 1.1, 1], rotate: [0, 3, -2, 0] }}
        transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
        className="opacity-[0.04]"
      >
        <defs>
          <radialGradient id="gridGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(59,130,246,0.3)" />
            <stop offset="60%" stopColor="rgba(59,130,246,0.05)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
        <rect width="600" height="600" fill="url(#gridGlow)" />
        {Array.from({ length: 16 }).map((_, y) =>
          Array.from({ length: 16 }).map((_, x) => (
            <motion.circle
              key={`${x}-${y}`}
              cx={30 + x * 36}
              cy={30 + y * 36}
              r={0.5 + (Math.sin(x * 0.5 + y * 0.3) * 0.3 + 0.3)}
              fill="rgba(59,130,246,0.5)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0.2] }}
              transition={{ duration: 1.5, delay: 0.01 * (x + y), ease: 'easeOut' }}
            />
          ))
        )}
      </motion.svg>
    </motion.div>
  );
}

/* ── Glow core ── */
function GlowCore({ phase }: { phase: Phase }) {
  const active = phase >= Phase.Genesis && phase < Phase.Done;
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="absolute pointer-events-none"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 0.3, 0.15, 0.25], scale: [0.5, 1.2, 0.9, 1.1] }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 2.5, ease: 'easeInOut' }}
          style={{
            width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.04) 40%, transparent 70%)',
            filter: 'blur(10px)',
          }}
        />
      )}
    </AnimatePresence>
  );
}

/* ── Typing text ── */
function TypeReveal({ text, delay, className, style }: { text: string; delay: number; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`flex ${className || ''}`} style={style}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.4, delay: delay + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          style={{ letterSpacing: '0.15em' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </div>
  );
}

/* ── Progress bar ── */
function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-[3px] z-50 pointer-events-none">
      <motion.div
        className="h-full"
        style={{
          background: 'linear-gradient(90deg, transparent, #3b82f6, #60a5fa, #3b82f6, transparent)',
          backgroundSize: '200% 100%',
        }}
        initial={{ width: '0%' }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </div>
  );
}

/* ── Main component ── */
export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<Phase>(Phase.Grid);
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const to = [setTimeout(() => setPhase(Phase.Genesis), 800)];
    to.push(setTimeout(() => setPhase(Phase.Logo), 2200));
    to.push(setTimeout(() => setPhase(Phase.Type), 3500));
    to.push(setTimeout(() => setPhase(Phase.Tagline), 4800));
    to.push(setTimeout(() => setPhase(Phase.Done), 6200));

    let p = 0;
    const pi = setInterval(() => {
      p += 1.5;
      setProgress(Math.min(p, 100));
      if (p >= 100) clearInterval(pi);
    }, 80);

    to.push(setTimeout(() => {
      clearInterval(pi);
      onCompleteRef.current();
    }, 7200));

    return () => {
      to.forEach(clearTimeout);
      clearInterval(pi);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden select-none" style={{ background: 'var(--bg-primary)' }}>
      {/* Background gradient orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-[20%] left-[15%] w-[30rem] h-[30rem] rounded-full" style={{ background: 'radial-gradient(circle, var(--accent-light) 0%, transparent 60%)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-[15%] right-[10%] w-[35rem] h-[35rem] rounded-full" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.03) 0%, transparent 60%)', filter: 'blur(80px)' }} />
      </div>

      {/* Phase 1: Grid */}
      <ExpandGrid phase={phase} />

      {/* Phase 2-3: Rings + Core glow */}
      <OrbitRings phase={phase} />
      <GlowCore phase={phase} />
      <BurstParticles active={phase >= Phase.Genesis && phase < Phase.Done} />

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Logo container */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.4, y: 20 }}
          animate={
            phase >= Phase.Logo
              ? { opacity: 1, scale: 1, y: 0 }
              : phase >= Phase.Genesis
                ? { opacity: 0.6, scale: 0.8, y: 10 }
                : {}
          }
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo glow */}
          <motion.div
            className="absolute -inset-8 rounded-xl pointer-events-none"
            initial={{ opacity: 0 }}
            animate={
              phase >= Phase.Logo
                ? { opacity: [0, 0.3, 0.15, 0.2], scale: [0.8, 1.2, 0.95, 1.05] }
                : { opacity: 0 }
            }
            transition={{ duration: 2, ease: 'easeInOut', times: [0, 0.3, 0.6, 1] }}
            style={{
              background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 60%)',
              filter: 'blur(20px)',
            }}
          />

          {/* Logo SVG with draw animation */}
          <motion.svg
            width="80" height="80" viewBox="0 0 32 32" fill="none"
            initial={{ opacity: 0 }}
            animate={
              phase >= Phase.Logo
                ? { opacity: 1 }
                : { opacity: 0 }
            }
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <defs>
              <linearGradient id="splashLogo" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            <motion.rect
              x="2" y="4" width="28" height="24" rx="6"
              fill="url(#splashLogo)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.1, ease: 'easeInOut' }}
            />
            <motion.path
              d="M16 8l8 14H8l8-14z"
              fill="#ffffff" fillOpacity="0.2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4, ease: 'easeInOut' }}
            />
            <motion.path
              d="M16 10l6 11H10l6-11z"
              fill="#ffffff"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6, ease: 'easeInOut' }}
            />
            <motion.path
              d="M16 12l4 8h-8l4-8z"
              fill="url(#splashLogo)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8, ease: 'easeInOut' }}
            />
          </motion.svg>
        </motion.div>

        {/* Typography */}
        <div className="mt-8 flex flex-col items-center gap-1">
          <TypeReveal
            text="APEX"
            delay={0.3}
            className="text-5xl font-bold tracking-[0.15em]"
            style={{ color: 'var(--text-primary)' }}
          />
          {phase >= Phase.Type && (
            <motion.span
              initial={{ opacity: 0, y: -10, letterSpacing: '0.5em' }}
              animate={{ opacity: 1, y: 0, letterSpacing: '0.25em' }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm font-semibold uppercase tracking-[0.25em] mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Banking
            </motion.span>
          )}
        </div>

        {/* Tagline */}
        {phase >= Phase.Tagline && (
          <motion.p
            initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 text-sm font-light tracking-[0.08em]"
            style={{ color: 'var(--text-muted)' }}
          >
            Where ambition meets altitude
          </motion.p>
        )}

        {/* Phase transition overlay */}
        <AnimatePresence>
          {phase >= Phase.Done && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(circle at center, transparent 30%, var(--bg-primary) 100%)',
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Loading dots */}
      <div className="absolute bottom-12 flex items-center gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              width: 4,
              height: 4,
              background: phase === Phase.Done ? '#3b82f6' : 'rgba(148,163,184,0.3)',
            }}
            animate={{
              opacity: phase === Phase.Done ? [0.3, 1, 0.3] : [0.3, 0.6, 0.3],
              scale: phase === Phase.Done ? [1, 1.3, 1] : 1,
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <ProgressBar progress={progress} />
    </div>
  );
}
