import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatInr(num = 0) {
  if (num >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  } else if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  } else if (num >= 1000) {
    return `₹${(num / 1000).toFixed(1)} K`;
  }
  return `₹${Number(num).toLocaleString('en-IN')}`;
}

export function assetUrl(path = '') {
  const base = import.meta.env.BASE_URL || '/';
  const cleanPath = String(path).replace(/^\//, '');
  return `${base.replace(/\/$/, '')}/${cleanPath}`;
}
