import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Определение базового URL API бекенда
 * В режиме разработки автоматически определяет IP-адрес хоста для Expo Go
 */
const getApiBaseUrl = (): string => {
  // Если задан публичный URL в переменных окружения
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Определение IP хоста в Expo Go
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(":")[0];
    return `http://${ip}:3000`;
  }

  // Эмулятор Android
  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }

  // iOS Simulator / Web
  return "http://localhost:3000";
};

export const API_BASE_URL = getApiBaseUrl();

export const formatUZS = (amount: number): string => {
  return new Intl.NumberFormat("ru-RU").format(amount) + " UZS";
};

export const formatPhoneUZ = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("998")) {
    const code = cleaned.slice(3, 5);
    const p1 = cleaned.slice(5, 8);
    const p2 = cleaned.slice(8, 10);
    const p3 = cleaned.slice(10, 12);
    return `+998 (${code}) ${p1}-${p2}-${p3}`;
  }
  return phone;
};
