import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';
import { IconArrowUp, IconArrowDown } from '../Icons';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
  style?: React.CSSProperties;
}

export function GlassCard({ children, className, glow, hover, style }: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'glass rounded-3xl p-5',
        glow && 'glow',
        hover && 'card-hover cursor-pointer',
        className,
      )}
      style={style}
    >
      {children}
    </motion.div>
  );
}

export function GradientText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('gradient-text', className)}>{children}</span>;
}

export function Badge({ children, variant = 'default', className }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'; className?: string }) {
  const variants = {
    default: 'bg-white/5 text-gray-300 border-white/10',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border', variants[variant], className)}>
      {children}
    </span>
  );
}

export function StatCard({ label, value, sub, trend, icon }: { label: string; value: string; sub?: string; trend?: 'up' | 'down'; icon?: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-5" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
          <p className="text-2xl font-bold mt-1.5" style={{ color: 'var(--text-primary)' }}>{value}</p>
          {sub && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{sub}</p>}
        </div>
        {icon && <span className="opacity-60">{icon}</span>}
      </div>
      {trend && (
        <div className={cn('mt-3 flex items-center gap-1 text-xs font-medium', trend === 'up' ? 'text-emerald-400' : 'text-red-400')}>
          {trend === 'up' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />}
          <span>{trend === 'up' ? '+12.5%' : '-3.2%'} from last month</span>
        </div>
      )}
    </div>
  );
}
