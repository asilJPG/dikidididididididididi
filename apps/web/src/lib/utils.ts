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
