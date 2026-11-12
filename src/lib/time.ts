import { useSettings } from '@/stores/settings';

export function formatTime(iso: string, locale = 'en') {
  const hour12 = !useSettings.getState().time24;
  return new Date(iso).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit', hour12 });
}

export function formatDate(iso: string, locale = 'en') {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'long' });
}

export function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function dayLabel(iso: string, now = new Date(), locale = 'en') {
  const d = new Date(iso);
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(now) - start(d)) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'yesterday';
  return d.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' });
}

export function formatDuration(sec: number) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
