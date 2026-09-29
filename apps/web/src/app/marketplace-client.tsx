"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Star,
  ChevronRight,
  Scissors,
  Sparkles,
  Smile,
  Flame,
  Eye,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Send,
  Store,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { formatUZS } from "@/lib/utils";

interface Service {
  id: string;
  nameRu: string;
  price: number;
  durationMinutes?: number;
}

interface Staff {
  id: string;
  fullName: string;
  specialty?: string;
  avatarUrl?: string | null;
}

interface Salon {
  id: string;
  name: string;
  slug: string;
  address: string;
  city?: string;
  rating: number;
  reviewCount: number;
  description?: string | null;
  services: Service[];
  staff: Staff[];
}

export function MarketplaceClient({ initialSalons }: { initialSalons: Salon[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "Все услуги", icon: Sparkles },
    {
      id: "barbershop",
      label: "Барбершопы",
      icon: Scissors,
      keywords: ["барбер", "бород", "мужск", "fade", "фейд", "стрижк", "усы", "бритье"],
    },
    {
      id: "nails",
      label: "Маникюр и педикюр",
      icon: Sparkles,
      keywords: ["маникюр", "педикюр", "гель", "ногт", "smart", "покрытие"],
    },
    {
      id: "hair",
      label: "Стрижки и окрашивание",
      icon: Scissors,
      keywords: ["окраш", "колор", "airtouch", "укладк", "волос", "женск", "мелирование"],
    },
    {
      id: "cosmetology",
      label: "Косметология",
      icon: Smile,
      keywords: ["космет", "чистк", "пилинг", "уход", "лицо", "массаж лица"],
    },
    {
      id: "brows",
      label: "Брови и ресницы",
      icon: Eye,
      keywords: ["бров", "ресниц", "ламинир", "взгляд", "наращивание"],
    },
    {
      id: "spa",
      label: "Массаж и СПА",
      icon: Flame,
      keywords: ["массаж", "спа", "spa", "релакс", "обертывание"],
    },
  ];

  const districts = [
    { id: "all", name: "Все районы" },
    { id: "yunusabad", name: "Юнусабад" },
    { id: "mirzo", name: "Мирзо-Улугбек" },
    { id: "chilanzer", name: "Чиланзар" },
    { id: "mirabad", name: "Мирабад" },
    { id: "yakkasaray", name: "Яккасарай" },
  ];

  const filteredSalons = useMemo(() => {
    return initialSalons.filter((salon) => {
      // 1. Поиск по тексту
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        salon.name.toLowerCase().includes(query) ||
        salon.address.toLowerCase().includes(query) ||
        (salon.description && salon.description.toLowerCase().includes(query)) ||
        salon.services.some((s) => s.nameRu.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // 2. Район
      if (selectedDistrict !== "all") {
        const districtObj = districts.find((d) => d.id === selectedDistrict);
        if (
          districtObj &&
          !salon.address.toLowerCase().includes(districtObj.name.toLowerCase())
        ) {
          return false;
        }
      }

      // 3. Категория
      if (activeCategory === "all") return true;

      const catObj = categories.find((c) => c.id === activeCategory);
      if (!catObj || !catObj.keywords) return true;

      const matchCategory = catObj.keywords.some(
        (kw) =>
          salon.name.toLowerCase().includes(kw) ||
          (salon.description && salon.description.toLowerCase().includes(kw)) ||
          salon.services.some((s) => s.nameRu.toLowerCase().includes(kw))
      );

      return matchCategory;
    });
  }, [initialSalons, searchQuery, activeCategory, selectedDistrict]);

  return (
    <div className="space-y-16">
      {/* ================= HERO БЛОК КЛИЕНТСКОГО ПОИСКА ================= */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 text-white p-6 sm:p-12 shadow-2xl border border-white/10">
        {/* Декоративное мягкое свечение */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Сервис онлайн-записи №1 в Ташкенте</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
              Запись к проверенным мастерам красоты
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 font-normal leading-relaxed max-w-2xl">
              Выбирайте услугу, мастера и удобное время 24/7 без звонков. Подтверждения и напоминания приходят прямо в Telegram.
            </p>
          </div>

          {/* Строка поиска (как в Airbnb / Fresha) */}
          <div className="p-2 sm:p-2.5 bg-white rounded-2xl shadow-xl flex flex-col sm:flex-row gap-2 border border-black/[0.05]">
            {/* Поле услуги */}
            <div className="flex-1 flex items-center gap-3 px-3 py-2 text-neutral-900">
              <Search className="w-4 h-4 text-neutral-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Услуга, салон или мастер (стрижка, маникюр, барбер...)"
                className="w-full text-xs sm:text-sm font-medium bg-transparent focus:outline-none placeholder:text-neutral-400 text-neutral-900"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-neutral-400 hover:text-neutral-900 px-1"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="h-8 w-px bg-neutral-200 hidden sm:block self-center" />

            {/* Район */}
            <div className="flex items-center gap-2 px-3 py-2 text-neutral-700 shrink-0">
              <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="text-xs sm:text-sm font-medium bg-transparent focus:outline-none cursor-pointer text-neutral-800"
              >
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Кнопка поиска */}
            <button
              type="button"
              className="h-11 px-6 rounded-xl bg-neutral-950 text-white text-xs sm:text-sm font-semibold hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
            >
              <span>Найти время</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ================= КАТЕГОРИИ УСЛУГ ================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight">
            Категории услуг
          </h2>
          <span className="text-xs text-neutral-400 font-medium">
            Выберите направление
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            const IconComponent = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border text-center shadow-sm ${
                  isActive
                    ? "bg-neutral-950 text-white border-neutral-950 shadow-md scale-[1.02]"
                    : "bg-white border-black/[0.06] text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isActive ? "bg-white/15 text-white" : "bg-neutral-100 text-neutral-800"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                <span className="text-xs font-semibold leading-tight line-clamp-1">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= СПИСОК САЛОНОВ ================= */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
              {activeCategory === "all" ? "Популярные заведения и мастера" : "Найдено по категории"}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 font-normal">
              Моментальное бронирование с подтверждением в Telegram
            </p>
          </div>

          <div className="text-xs font-semibold px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200/60">
            {filteredSalons.length}{" "}
            {filteredSalons.length === 1 ? "салон" : "салонов"}
          </div>
        </div>

        {filteredSalons.length === 0 ? (
          /* Пустое состояние */
          <div className="bg-white rounded-3xl p-12 text-center border border-black/[0.06] space-y-4 max-w-lg mx-auto shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
              <Search className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900">
                По вашему запросу ничего не найдено
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Попробуйте изменить поисковый запрос, выбрать другой район или сбросить фильтры
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
                setSelectedDistrict("all");
              }}
              className="px-5 py-2.5 bg-neutral-950 text-white text-xs font-semibold rounded-xl hover:bg-neutral-800 transition-colors shadow-sm"
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          /* Сетка карточек салонов */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredSalons.map((salon) => (
              <Link
                key={salon.id}
                href={`/b/${salon.slug}`}
                className="group bg-white rounded-3xl p-6 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:border-black/[0.15] transition-all flex flex-col justify-between space-y-5 cursor-pointer block"
              >
                <div className="space-y-4">
                  {/* Шапка карточки */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-black/[0.04] flex items-center justify-center text-neutral-900 font-bold text-base shrink-0 group-hover:scale-105 transition-transform">
                        {salon.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold tracking-tight text-neutral-950 group-hover:text-black">
                          {salon.name}
                        </h3>
                        <p className="text-xs text-neutral-500 flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          <span className="truncate">{salon.address}</span>
                        </p>
                      </div>
                    </div>

                    {/* Рейтинг */}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-xs font-bold text-amber-900 shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{salon.rating.toFixed(1)}</span>
                      <span className="text-[10px] text-amber-700/70 font-normal">
                        ({salon.reviewCount})
                      </span>
                    </div>
                  </div>

                  {salon.description && (
                    <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                      {salon.description}
                    </p>
                  )}

                  {/* Прайс-лист: топ услуги */}
                  <div className="bg-neutral-50/80 rounded-2xl p-3 border border-neutral-100 space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                      Популярные услуги
                    </div>
                    <div className="space-y-1.5">
                      {salon.services.slice(0, 3).map((srv) => (
                        <div
                          key={srv.id}
                          className="flex items-center justify-between text-xs py-0.5"
                        >
                          <span className="text-neutral-700 font-medium truncate max-w-[200px]">
                            {srv.nameRu}
                          </span>
                          <span className="font-bold text-neutral-950 text-xs">
                            {formatUZS(srv.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Нижняя кнопка онлайн-записи */}
                <div className="w-full h-11 px-5 rounded-2xl bg-neutral-950 text-white text-xs font-semibold group-hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shadow-sm">
                  <span>Записаться онлайн</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ================= ПРЕИМУЩЕСТВА СЕРВИСА ================= */}
      <section className="bg-white rounded-3xl p-6 sm:p-10 border border-black/[0.06] shadow-sm space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-950">
            Почему тысячи клиентов выбирают LOOK
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500">
            Современный стандарт записи к мастерам индустрии красоты в Узбекистане
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
          <div className="flex flex-col items-center text-center space-y-2.5 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-sm">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-neutral-950">Запись за 30 секунд</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Без звонков и ожидания ответа администратора. Выбирайте свободное окно 24/7.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-2.5 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-sm">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-neutral-950">Telegram-напоминания</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Бот пришлёт детали записи и напомнит за 2 часа до визита, чтобы вы не опоздали.
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-2.5 p-4 rounded-2xl bg-neutral-50 border border-neutral-100">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-neutral-950">Честные отзывы</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Оставить отзыв может только реальный клиент, который фактически посетил салон.
            </p>
          </div>
        </div>
      </section>

      {/* ================= БАННЕР ДЛЯ БИЗНЕСА ================= */}
      <section className="bg-neutral-950 text-white rounded-3xl p-8 sm:p-12 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
        <div className="space-y-3 text-center md:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-neutral-300 text-[11px] font-semibold">
            <Store className="w-3.5 h-3.5" />
            <span>Для салонов красоты и барбершопов</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Подключите свой салон к платформе LOOK
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            Получите готовую ссылку для онлайн-записи в Instagram, электронный журнал записей, базу клиентов и автоматический расчёт зарплат мастеров.
          </p>
        </div>

        <Link
          href="/business"
          className="h-12 px-8 rounded-2xl bg-white text-neutral-950 hover:bg-neutral-100 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-lg shrink-0 active:scale-95"
        >
          <span>Подключить бесплатно</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
