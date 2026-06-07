import { useEffect, useState } from 'react';
import { motion, useSpring, useTransform, animate } from 'framer-motion';

interface CountUpProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export default function CountUp({ value, decimals = 2, prefix = '', suffix = '', duration = 1.5, className = '' }: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(displayValue, value, {
      duration,
      ease: [0.34, 1.56, 0.64, 1],
      onUpdate: (val) => setDisplayValue(val),
    });
    return () => controls.stop();
  }, [value]);

  return (
    <span className={className}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
}

export function AnimatedNumber({ value, decimals = 2, prefix = '', suffix = '', className = '' }: CountUpProps) {
  const spring = useSpring(0, { stiffness: 60, damping: 15 });
  const display = useTransform(spring, (v) => `${prefix}${v.toFixed(decimals)}${suffix}`);

  useEffect(() => {
    spring.set(value);
  }, [value]);

  return <motion.span className={className}>{display}</motion.span>;
}
