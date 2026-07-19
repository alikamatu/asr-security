import { type ClassValue, clsx } from 'clsx';
import { format, formatDistanceToNow, isToday, parseISO } from 'date-fns';

// ---------- ID Generation ----------
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function generateEvidenceNumber(): string {
  const date = format(new Date(), 'yyyyMMdd');
  const seq = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  return `EVD-${date}-${seq}`;
}

export function generatePassNumber(): string {
  const date = format(new Date(), 'yyyyMMdd');
  const seq = Math.floor(Math.random() * 999).toString().padStart(3, '0');
  return `VP-${date}-${seq}`;
}

// ---------- Date & Time ----------
export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatTime(timeStr: string): string {
  return timeStr;
}

export function formatDateTime(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy, HH:mm');
  } catch {
    return dateStr;
  }
}

export function getRelativeTime(dateStr: string): string {
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function getTodayDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getCurrentTime(): string {
  return format(new Date(), 'HH:mm');
}

export function isDateToday(dateStr: string): boolean {
  try {
    return isToday(parseISO(dateStr));
  } catch {
    return false;
  }
}

// ---------- CSS ----------
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// ---------- Search ----------
export function searchFilter<T>(
  items: T[],
  query: string,
  fields: (keyof T)[]
): T[] {
  if (!query.trim()) return items;
  const lower = query.toLowerCase();
  return items.filter((item) =>
    fields.some((field) => {
      const value = item[field] as unknown;
      if (typeof value === 'string') return value.toLowerCase().includes(lower);
      if (typeof value === 'number') return value.toString().includes(lower);
      return false;
    })
  );
}

// ---------- Priority/Status Colors ----------
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'var(--color-critical)';
    case 'high': return 'var(--color-high)';
    case 'medium': return 'var(--color-medium)';
    case 'low': return 'var(--color-low)';
    default: return 'var(--color-muted)';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'open': return 'var(--color-warning)';
    case 'investigating': return 'var(--color-info)';
    case 'resolved':
    case 'closed':
    case 'checked-out': return 'var(--color-success)';
    case 'inside': return 'var(--color-info)';
    default: return 'var(--color-muted)';
  }
}

// ---------- Export Helpers ----------
export function exportToCSV<T extends Record<string, unknown>>(data: T[], filename: string): void {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((h) => {
        const val = row[h];
        const str = val === null || val === undefined ? '' : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ---------- Capitalize ----------
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}

export function toTitleCase(str: string): string {
  return str.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------- Truncate ----------
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

// ---------- Departments ----------
export const DEPARTMENTS = [
  'Front Office',
  'Housekeeping',
  'Food & Beverage',
  'Maintenance',
  'Kitchen',
  'Security',
  'Management',
  'Finance',
  'HR',
  'IT',
  'Guest Relations',
  'Procurement',
  'Spa & Wellness',
  'Activities',
  'Transport',
] as const;

// ---------- Locations ----------
export const LOCATIONS = [
  'Main Gate',
  'Reception',
  'Restaurant',
  'Pool Area',
  'Beach',
  'Parking Lot',
  'Staff Quarters',
  'Kitchen',
  'Laundry',
  'Store Room',
  'Generator Room',
  'CCTV Room',
  'Admin Office',
  'Guest Rooms',
  'Conference Hall',
  'Spa',
  'Garden',
  'Boat House',
  'Jetty',
] as const;
