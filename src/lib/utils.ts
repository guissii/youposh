import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getImageUrl(path: string | undefined | null): string {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('/images/')) return path;
  
  // Utiliser l'URL de l'API en production pour toutes les images d'uploads
  // La variable VITE_API_URL se termine souvent par /api, il faut l'enlever pour les images
  const apiBase = import.meta.env.VITE_API_URL || 'https://api.youposhmaroc.com/api';
  const base = apiBase.replace('/api', '');
  
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function toWhatsAppPhone(rawPhone: string | undefined | null): string {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0') && digits.length === 10) return `212${digits.slice(1)}`;
  if (digits.startsWith('212')) return digits;
  return digits;
}
