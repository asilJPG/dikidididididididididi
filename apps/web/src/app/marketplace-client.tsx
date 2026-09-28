"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, MapPin, Star, ChevronRight } from "lucide-react";
import { formatUZS } from "@/lib/utils";

interface Service {
  id: string;
  nameRu: string;
  price: number;
}

interface Staff {
  id: string;
  fullName: string;
}

interface Salon {
  id: string;
  name: string;
  slug: string;
  address: string;
  rating: number;
  reviewCount: number;
  description?: string | null;
  services: Service[];
  staff: Staff[];
}

export function MarketplaceClient({ initialSalons }: { initialSalons: Salon[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "Все услуги" },
    { id: "barbershop", label: "Барбершопы", keywords: ["барбер", "бород", "мужск", "fade", "фейд", "стрижк"] },
    { id: "hair", label: "Стрижки и окрашивание", keywords: ["окраш", "колор", "airtouch", "укладк", "волос"] },
    { id: "nails", label: "Маникюр и педикюр", keywords: ["маникюр", "педикюр", "гель", "ногт", "smart"] },
    { id: "brows", label: "Брови и ресницы", keywords: ["бров", "ресниц", "ламинир", "взгляд"] },
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

      // 2. Фильтр по категории
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
  }, [initialSalons, searchQuery, activeCategory]);

  return (
    <div className="space-y-12">
      {/* Поисковый блок (Главный экран клиента) */}
      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-neutral-950 leading-tight">
            Онлайн-запись к проверенным мастерам в Ташкенте
          </h1>
          <p className="text-sm text-neutral-500 font-normal">
            Выберите услугу, заведение и удобное свободное время без звонков
          </p>
        </div>

        {/* Строка поиска */}
        <div className="p-2 bg-white rounded-2xl border border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center gap-3 px-3 py-2">
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Услуга или название салона (стрижка, маникюр, барбер)"
              className="w-full text-xs font-medium bg-transparent focus:outline-none placeholder:text-neutral-400 text-neutral-900"
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
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap shadow-sm border ${
                  isActive
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white border-neutral-200/70 text-neutral-700 hover:border-neutral-400"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Список проверенных заведений */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-neutral-900">
              {activeCategory === "all" ? "Популярные салоны и мастера" : "Найдено по категории"}
            </h2>
            <p className="text-xs text-neutral-500">
              Реальные отзывы и моментальное бронирование
            </p>
          </div>
          <span className="text-xs text-neutral-400">
            Заведений: {filteredSalons.length}
          </span>
        </div>

        {filteredSalons.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-black/[0.08] space-y-3">
            <p className="text-sm font-semibold text-neutral-900">Ничего не найдено</p>
            <p className="text-xs text-neutral-500">
              Попробуйте изменить запрос или сбросить фильтр по категориям
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("all");
              }}
              className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-xl"
            >
              Сбросить поиск
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSalons.map((salon) => (
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
                          {formatUZS(srv.price)}
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
        )}
      </section>
    </div>
  );
}
