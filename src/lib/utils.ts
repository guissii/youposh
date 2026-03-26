import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(path: string | undefined | null): string {
  if (!path) return '';

  // Attach a cache-buster to bypass Cloudflare's aggressive edge cache for 404s 
  const cacheBuster = 'v=fix2';

  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('/images/')) {
    if (path.startsWith('data:') || path.startsWith('/images/')) return path;
    if (path.includes('youposhmaroc.com/uploads')) {
      return path.includes('?') ? `${path}&${cacheBuster}` : `${path}?${cacheBuster}`;
    }
    return path;
  }

  // Utiliser l'URL de l'API en production pour toutes les images d'uploads
  // La variable VITE_API_URL se termine souvent par /api, il faut l'enlever pour les images
  const apiBase = import.meta.env.VITE_API_URL || 'https://api.youposhmaroc.com/api';
  const base = apiBase.replace('/api', '');

  const finalUrl = `${base}${path.startsWith('/') ? '' : '/'}${path}`;
  return finalUrl.includes('?') ? `${finalUrl}&${cacheBuster}` : `${finalUrl}?${cacheBuster}`;
}

export function toWhatsAppPhone(rawPhone: string | undefined | null): string {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0') && digits.length === 10) return `212${digits.slice(1)}`;
  if (digits.startsWith('212')) return digits;
  return digits;
}
