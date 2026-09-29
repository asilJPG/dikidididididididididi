import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

function getDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // Автоматически перенаправляем прямой IPv6-хост Supabase на рабочий IPv4-пулер для Vercel / AWS Lambda
  if (url.includes("db.rpxowoodkjdjhouppiky.supabase.co")) {
    url = url.replace("db.rpxowoodkjdjhouppiky.supabase.co", "aws-1-ap-southeast-1.pooler.supabase.com");
    url = url.replace("://postgres:", "://postgres.rpxowoodkjdjhouppiky:");
    if (!url.includes("sslmode=")) {
      url += (url.includes("?") ? "&" : "?") + "sslmode=require";
    }
  }
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
