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

      <main className="flex-1 max-w-5xl mx-auto px-6 pt-10 pb-16 w-full space-y-12">
        {/* Интерактивный клиентский маркетплейс */}
        <MarketplaceClient initialSalons={salons as any} />
      </main>

      {/* Единый брендовый футер */}
      <Footer />
    </div>
  );
}
