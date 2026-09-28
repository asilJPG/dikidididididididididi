import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { prisma } from "@dikidi/database";
import { MarketplaceClient } from "./marketplace-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Получаем список верифицированных салонов из базы
  const salons = await prisma.salon.findMany({
    where: { isVerified: true },
    include: {
      services: {
        where: { isActive: true },
        take: 3,
      },
      staff: {
        where: { isActive: true },
        take: 4,
      },
    },
    take: 12,
    orderBy: { rating: "desc" },
  });

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#111111] flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
      {/* Навигационная панель */}
      <header className="sticky top-0 z-40 bg-[#f5f5f7]/80 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold text-base tracking-[-0.03em] text-neutral-900">
              DIKIDI
            </span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-black/[0.06] text-neutral-600 tracking-wider">
              UZ
            </span>
          </Link>

          <div className="flex items-center gap-3 text-xs font-medium text-neutral-600">
            <span className="hidden sm:flex items-center gap-1 text-neutral-800">
              <MapPin className="w-3.5 h-3.5 text-neutral-400" /> Ташкент
            </span>
            <Link
              href="/my-bookings"
              className="px-3 py-1 rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-black/[0.05] transition-all font-medium"
            >
              Мои записи
            </Link>
            <Link
              href="/staff"
              className="hidden sm:inline-block px-3 py-1 rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-black/[0.05] transition-all font-medium"
            >
              Мастерам
            </Link>
            <Link
              href="/dashboard"
              className="px-3 py-1 rounded-full bg-black/[0.05] hover:bg-neutral-900 hover:text-white text-neutral-900 transition-all font-semibold"
            >
              CRM Салона
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-6 pt-10 pb-20 w-full space-y-12">
        {/* Интерактивный клиентский маркетплейс */}
        <MarketplaceClient initialSalons={salons as any} />

        {/* Блок для владельцев бизнеса */}
        <section className="bg-white rounded-3xl p-8 border border-black/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="space-y-1.5 max-w-lg">
            <h3 className="text-base font-semibold text-neutral-900">
              Вы мастер или владелец заведения?
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Подключите онлайн-запись через Telegram Mini App, ведите базу постоянных клиентов и управляйте расписанием в единой системе DIKIDI Business.
            </p>
          </div>
          <Link
            href="/business"
            className="h-10 px-5 rounded-full border border-neutral-300 text-neutral-800 hover:border-neutral-900 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
          >
            Подробнее о DIKIDI Business <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      </main>

      {/* Футер */}
      <footer className="border-t border-black/[0.06] bg-white py-8 px-6 text-xs text-neutral-400">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 DIKIDI UZ. Платформа онлайн-записи и автоматизации бизнеса в Узбекистане.</p>
          <div className="flex items-center gap-4 text-neutral-500">
            <Link href="/business" className="hover:text-neutral-900 transition-colors">
              DIKIDI Business
            </Link>
            <span>·</span>
            <Link href="/login" className="hover:text-neutral-900 transition-colors">
              Вход в CRM
            </Link>
            <span>·</span>
            <span>Ташкент, Самарканд, Бухара</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
