import { RecurrenceType } from '../types';

export function getEndOfYear(date: Date = new Date()): Date {
  const year = date.getFullYear();
  return new Date(year, 11, 31, 23, 59, 59, 999);
}

export function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function formatDateForDB(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateForDisplay(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = date.getMonth() + 1;
  return `${dayName}, ${day}/${month}`;
}

export function calculateRecurringDates(
  startDate: string,
  recurrenceType: RecurrenceType
): string[] {
  if (recurrenceType === 'none') {
    return [];
  }

  const dates: string[] = [];
  const start = new Date(startDate + 'T00:00:00');
  const endOfYear = getEndOfYear(start);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentDate = new Date(start);

  while (currentDate <= endOfYear) {
    if (currentDate >= today) {
      dates.push(formatDateForDB(currentDate));
    }

    switch (recurrenceType) {
      case 'weekly':
        currentDate = addWeeks(currentDate, 1);
        break;
      case 'biweekly':
        currentDate = addWeeks(currentDate, 2);
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, 1);
        break;
    }
  }

  return dates;
}

export function isDateInPast(dateString: string): boolean {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function getDayOfWeek(dateString: string): number {
  const date = new Date(dateString + 'T00:00:00');
  return date.getDay();
}
