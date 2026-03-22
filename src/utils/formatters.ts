import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'd MMM yyyy', { locale: es });
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'd MMM yyyy, HH:mm', { locale: es });
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), 'HH:mm', { locale: es });
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: es });
}

export function formatNumber(n: number): string {
  return n.toLocaleString('es-ES');
}

export function formatPercent(n: number): string {
  return `${Math.round(n)}%`;
}

export function formatDuration(minutes: number): string {
  return `${minutes} min`;
}

export function formatELO(elo: number): string {
  return elo.toFixed(1);
}

export function getELOLevel(elo: number): string {
  if (elo < 2.0) return 'Basico';
  if (elo < 3.0) return 'Intermedio';
  if (elo < 4.0) return 'Avanzado';
  return 'Experto';
}

export function getDayName(dayIndex: number): string {
  const days = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
  return days[dayIndex];
}

export function getHourLabel(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`;
}
