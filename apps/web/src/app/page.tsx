import Link from "next/link";
import { Search, MapPin, Star, Scissors, Sparkles, ChevronRight, ShieldCheck } from "lucide-react";
import { prisma } from "@dikidi/database";

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
    take: 6,
    orderBy: { rating: "desc" },
  });

  const categories = [
    { id: "barbershop", label: "Барбершопы", count: "120+ заведений" },
    { id: "hair", label: "Стрижки и окрашивание", count: "340+ мастеров" },
    { id: "nails", label: "Маникюр и педикюр", count: "280+ мастеров" },
    { id: "brows", label: "Брови и ресницы", count: "190+ мастеров" },
    { id: "massage", label: "Массаж и СПА", count: "65+ заведений" },
    { id: "cosmetology", label: "Косметология", count: "80+ клиник" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#111111] flex flex-col font-sans selection:bg-black selection:text-white">
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

          <div className="flex items-center gap-4 text-xs font-medium text-neutral-600">
            <span className="flex items-center gap-1 text-neutral-800">
              <MapPin className="w-3.5 h-3.5 text-neutral-400" /> Ташкент
            </span>
            <Link
              href="/dashboard"
              className="text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Для бизнеса
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-6 pt-10 pb-20 w-full space-y-12">
        {/* Поисковый блок (Главный экран клиента) */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-neutral-950 leading-tight">
              Онлайн-запись к бьюти-мастерам и в салоны Ташкента
            </h1>
            <p className="text-sm text-neutral-500 font-normal">
              Выберите услугу, специалиста и свободное время без звонков
            </p>
          </div>

          {/* Строка поиска */}
          <div className="p-2 bg-white rounded-2xl border border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-3 px-3 py-2">
              <Search className="w-4 h-4 text-neutral-400 shrink-0" />
              <input
                type="text"
                placeholder="Услуга или название салона (стрижка, маникюр, барбер)"
                className="w-full text-xs font-medium bg-transparent focus:outline-none placeholder:text-neutral-400 text-neutral-900"
              />
            </div>
            <div className="h-8 w-px bg-neutral-200 hidden sm:block self-center" />
            <div className="flex items-center gap-2 px-3 py-2 shrink-0">
              <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
              <span className="text-xs font-medium text-neutral-700">Ташкент</span>
            </div>
            <button
              type="button"
              className="h-10 px-6 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              Найти
            </button>
          </div>

          {/* Быстрые категории */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className="px-3.5 py-2 rounded-xl bg-white border border-neutral-200/70 text-xs font-medium text-neutral-700 hover:border-neutral-400 transition-colors whitespace-nowrap shadow-sm"
              >
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* Список проверенных заведений */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.02em] text-neutral-900">
                Популярные салоны и мастера
              </h2>
              <p className="text-xs text-neutral-500">
                Реальные отзывы и моментальное бронирование
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {salons.map((salon) => (
              <div
                key={salon.id}
                className="bg-white rounded-3xl p-6 border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:border-neutral-400 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <h3 className="text-base font-semibold tracking-tight text-neutral-900">
                        {salon.name}
                      </h3>
                      <p className="text-xs text-neutral-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span className="truncate">{salon.address}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-50 border border-neutral-200/70 text-xs font-semibold text-neutral-800 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{salon.rating.toFixed(1)}</span>
                      <span className="text-[10px] text-neutral-400 font-normal">
                        ({salon.reviewCount})
                      </span>
                    </div>
                  </div>

                  {salon.description && (
                    <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                      {salon.description}
                    </p>
                  )}

                  {/* Популярные услуги */}
                  <div className="space-y-1.5 pt-1">
                    {salon.services.map((srv) => (
                      <div
                        key={srv.id}
                        className="flex items-center justify-between text-xs py-1 border-t border-neutral-100"
                      >
                        <span className="text-neutral-700">{srv.nameRu}</span>
                        <span className="font-semibold text-neutral-900">
                          {new Intl.NumberFormat("ru-RU").format(srv.price)} UZS
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/b/${salon.slug}`}
                    className="w-full h-10 px-4 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Выбрать время и записаться</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Блок для владельцев бизнеса (Аккуратный, внизу страницы) */}
        <section className="bg-white rounded-3xl p-8 border border-black/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1 max-w-lg">
            <h3 className="text-base font-semibold text-neutral-900">
              Вы мастер или владелец салона?
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Подключите онлайн-запись через Telegram Mini App, ведите базу клиентов и управляйте расписанием в единой системе.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="h-10 px-5 rounded-full border border-neutral-300 text-neutral-800 hover:border-neutral-900 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
          >
            Панель управления <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </section>
      </main>

      {/* Футер */}
      <footer className="border-t border-black/[0.06] bg-white py-8 px-6 text-xs text-neutral-400">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 DIKIDI UZ. Платформа онлайн-записи в Узбекистане.</p>
          <div className="flex items-center gap-4 text-neutral-500">
            <Link href="/dashboard" className="hover:text-neutral-900">
              Кабинет мастера
            </Link>
            <span>·</span>
            <span>Ташкент, Самарканд, Бухара</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
