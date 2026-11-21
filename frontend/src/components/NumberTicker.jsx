import React, { useEffect, useState } from 'react';

/**
 * Magic UI-style Smooth Animated Number Ticker
 * Uses requestAnimationFrame for zero-dependency 60fps performance
 */
export default function NumberTicker({ value = 0, duration = 800, prefix = '', suffix = '', className = '' }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // If value is not a number (e.g. formatted string), just display it
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, ''));
    if (isNaN(num)) {
      setDisplayValue(value);
      return;
    }

    let startTime = null;
    let animId = null;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(num * easedProgress);

      setDisplayValue(current);

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(num);
      }
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [value, duration]);

  const formatted = typeof displayValue === 'number' 
    ? displayValue.toLocaleString('en-IN') 
    : displayValue;

  return (
    <span className={`tabular-nums font-mono ${className}`}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
