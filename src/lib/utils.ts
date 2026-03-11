import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('/images/')) return path;
  const base = import.meta.env.DEV ? 'http://localhost:5000' : '';
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}
