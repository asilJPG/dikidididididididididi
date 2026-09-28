import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Форматирование суммы в сумах (UZS)
 * Пример: 150000 -> "150 000 UZS"
 */
export function formatUZS(amount: number): string {
  return new Intl.NumberFormat("ru-RU").format(amount) + " UZS";
}

/**
 * Форматирование номера телефона в красивый формат Узбекистана
 * Пример: "+998901234567" -> "+998 (90) 123-45-67"
 */
export function formatPhoneUZ(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("998")) {
    const code = cleaned.slice(3, 5);
    const p1 = cleaned.slice(5, 8);
    const p2 = cleaned.slice(8, 10);
    const p3 = cleaned.slice(10, 12);
    return `+998 (${code}) ${p1}-${p2}-${p3}`;
  }
  return phone;
}

/**
 * Парсинг даты (YYYY-MM-DD) и времени (HH:MM) в объект Date по часовому поясу Ташкента (UTC+5)
 */
export function parseTashkentDateTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}:00+05:00`);
}

/**
 * Форматирование времени в формате HH:mm по времени Ташкента
 */
export function formatTashkentTime(date: Date | string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));
}

/**
 * Получение минут от начала суток (0..1439) по времени Ташкента
 */
export function getTashkentDayMinutes(date: Date | string): number {
  const formatted = formatTashkentTime(date);
  const [h, m] = formatted.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Получение диапазона начала и конца суток по времени Ташкента
 */
export function getTashkentDayRange(dateStr: string): { startOfDay: Date; endOfDay: Date } {
  return {
    startOfDay: new Date(`${dateStr}T00:00:00+05:00`),
    endOfDay: new Date(`${dateStr}T23:59:59.999+05:00`),
  };
}
