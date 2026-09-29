import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const FALLBACK_DATABASE_URL =
  "postgresql://postgres.rpxowoodkjdjhouppiky:Asildididididididididid123123123@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?schema=dikidi&sslmode=require";

function getDatabaseUrl(): string {
  let url = process.env.DATABASE_URL?.trim();

  // Если случайно скопировали с префиксом переменной "DATABASE_URL="
  if (url && url.startsWith("DATABASE_URL=")) {
    url = url.replace("DATABASE_URL=", "").trim();
  }

  // Очистка от случайных кавычек (одинарных или двойных)
  if (url && (url.startsWith('"') || url.startsWith("'"))) {
    url = url.slice(1, -1).trim();
  }

  // Если переменная не задана или испорчена, используем проверенный рабочий URL
  if (!url || (!url.startsWith("postgresql://") && !url.startsWith("postgres://"))) {
    url = FALLBACK_DATABASE_URL;
  }

  // Автоматически перенаправляем прямой IPv6-хост Supabase на рабочий IPv4-пулер для Vercel / AWS Lambda
  if (url.includes("db.rpxowoodkjdjhouppiky.supabase.co")) {
    url = url.replace("db.rpxowoodkjdjhouppiky.supabase.co", "aws-1-ap-southeast-1.pooler.supabase.com");
    url = url.replace("://postgres:", "://postgres.rpxowoodkjdjhouppiky:");
    if (!url.includes("sslmode=")) {
      url += (url.includes("?") ? "&" : "?") + "sslmode=require";
    }
  }

  // Гарантируем, что переменная окружения доступна для внутреннего валидатора Prisma
  process.env.DATABASE_URL = url;
  return url;
}

const dbUrl = getDatabaseUrl();

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export const UserRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MASTER: "MASTER",
  CLIENT: "CLIENT",
} as const;

export const BookingStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  NO_SHOW: "NO_SHOW",
} as const;

export const PaymentMethod = {
  CASH: "CASH",
  CLICK: "CLICK",
  PAYME: "PAYME",
  UZUM: "UZUM",
  CARD_TERMINAL: "CARD_TERMINAL",
} as const;

export const PaymentStatus = {
  UNPAID: "UNPAID",
  DEPOSIT: "DEPOSIT",
  PAID: "PAID",
  REFUNDED: "REFUNDED",
} as const;

export const BookingSource = {
  ONLINE_WIDGET: "ONLINE_WIDGET",
  TELEGRAM_BOT: "TELEGRAM_BOT",
  MANUAL_ADMIN: "MANUAL_ADMIN",
  PHONE_CALL: "PHONE_CALL",
} as const;

export * from "@prisma/client";
