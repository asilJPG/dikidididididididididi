"use client";

import React from "react";
import Link from "next/link";
import { Scissors, Sparkles, Send, ShieldCheck, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t border-black/[0.06] text-neutral-600 font-sans mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 pb-12 border-b border-neutral-100">
          {/* Бренд */}
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-neutral-950 flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-sm group-hover:scale-105 transition-transform">
                D
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-neutral-950">
                  DIKIDI
                </span>
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-600 tracking-wider border border-neutral-200/60">
                  UZ
                </span>
              </div>
            </Link>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Главная бьюти-платформа Узбекистана. Онлайн-запись в лучшие салоны, барбершопы и к частным мастерам Ташкента за 30 секунд.
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-neutral-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ташкент · 24/7 бронирование</span>
            </div>
          </div>

          {/* Клиентам */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Клиентам
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-neutral-950 transition-colors">
                  Каталог заведений
                </Link>
              </li>
              <li>
                <Link href="/my-bookings" className="hover:text-neutral-950 transition-colors">
                  Мои записи
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-neutral-950 transition-colors">
                  Вход в аккаунт
                </Link>
              </li>
              <li>
                <a
                  href="https://t.me/q823374iawsdhfdiowue_bot"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-neutral-950 transition-colors flex items-center gap-1"
                >
                  <Send className="w-3 h-3 text-[#229ED9]" />
                  <span>Telegram-бот</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Для бизнеса */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Бизнесу и мастерам
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/business" className="hover:text-neutral-950 transition-colors font-medium text-neutral-900">
                  DIKIDI Business (CRM)
                </Link>
              </li>
              <li>
                <Link href="/business/register" className="hover:text-neutral-950 transition-colors">
                  Подключить салон
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-neutral-950 transition-colors">
                  Вход для владельцев
                </Link>
              </li>
              <li>
                <Link href="/staff" className="hover:text-neutral-950 transition-colors">
                  Кабинет мастера
                </Link>
              </li>
            </ul>
          </div>

          {/* Безопасность и платежи */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Надежность
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Все мастера и салоны проходят верификацию. Прямая интеграция с календарями и Telegram без комиссии за бронирование.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="px-2 py-1 bg-neutral-100 rounded-md text-[10px] font-bold text-neutral-700">
                Click
              </span>
              <span className="px-2 py-1 bg-neutral-100 rounded-md text-[10px] font-bold text-neutral-700">
                Payme
              </span>
              <span className="px-2 py-1 bg-neutral-100 rounded-md text-[10px] font-bold text-neutral-700">
                Uzum
              </span>
              <span className="px-2 py-1 bg-neutral-100 rounded-md text-[10px] font-bold text-neutral-700">
                Naqd
              </span>
            </div>
          </div>
        </div>

        {/* Нижняя полоска */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-neutral-400">
          <p>© 2026 DIKIDI UZ. Все права защищены. Ташкент, Узбекистан.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1 text-neutral-500">
              Сделано для сферы услуг в Узбекистане
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
