import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { prisma } from "@dikidi/database";
import { MarketplaceClient } from "./marketplace-client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Получаем список верифицированных салонов из базы
  let salons: any[] = [];
  try {
    salons = await prisma.salon.findMany({
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
  } catch (err) {
    console.error("Failed to load salons for home page:", err);
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#111111] flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
      {/* Навигационная панель с фильтром по авторизации и роли */}
      <Navbar />

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

      {/* Единый брендовый футер */}
      <Footer />
    </div>
  );
}
