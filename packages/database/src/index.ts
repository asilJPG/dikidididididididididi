import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
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
