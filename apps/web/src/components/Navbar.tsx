"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MapPin,
  User,
  LogOut,
  Scissors,
  LayoutDashboard,
  Calendar,
  LogIn,
  Store,
  ChevronDown,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let activePhone = "";
    try {
      const stored = localStorage.getItem("dikidi_user");
      const storedPhone = localStorage.getItem("dikidi_user_phone");
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
        if (parsed.phone) activePhone = parsed.phone;
      } else if (storedPhone) {
        activePhone = storedPhone;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoaded(true);
    }

    // Фоновая синхронизация свежей роли и заведений из БД
    fetch(`/api/auth/me${activePhone ? `?phone=${encodeURIComponent(activePhone)}` : ""}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
          localStorage.setItem("dikidi_user", JSON.stringify(data.user));
          if (data.user.phone) {
            localStorage.setItem("dikidi_user_phone", data.user.phone);
          }
        }
      })
      .catch(() => {});
  }, [pathname]);

  // Закрывать дропдаун при клике вне его
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("dikidi_user");
      localStorage.removeItem("dikidi_user_phone");
      document.cookie =
        "dikidi_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      document.cookie =
        "dikidi_user_phone=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    setDropdownOpen(false);
    router.push("/");
  };

  const isOwner = Boolean(
    currentUser &&
      (currentUser.role === "OWNER" ||
        currentUser.role === "SALON_OWNER" ||
        (Array.isArray(currentUser.ownedSalons) &&
          currentUser.ownedSalons.length > 0))
  );

  const isMaster = Boolean(
    currentUser &&
      (currentUser.role === "MASTER" || Boolean(currentUser.staffProfile))
  );

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-black/[0.06] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Левая часть: Бренд + Город */}
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-neutral-950 flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-sm group-hover:scale-105 transition-transform">
              D
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg tracking-tight text-neutral-950">
                DIKIDI
              </span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-600 tracking-wider border border-neutral-200/60">
                UZ
              </span>
            </div>
          </Link>

          {/* Город */}
          <div className="hidden sm:flex items-center gap-1.5 text-neutral-600 bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-200/60 text-xs">
            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
            <span className="font-semibold text-neutral-800">Ташкент</span>
          </div>
        </div>

        {/* Правая навигация */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-medium">
          {!isLoaded ? (
            /* Скелетон во время гидратации */
            <div className="w-24 h-9 bg-neutral-100 rounded-full animate-pulse" />
          ) : !currentUser ? (
            /* ================= НЕ АВТОРИЗОВАН (ГОСТЬ) ================= */
            <div className="flex items-center gap-2">
              <Link
                href="/business"
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-full text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition-colors font-medium"
              >
                <Store className="w-3.5 h-3.5 text-neutral-400" />
                <span>Салонам и мастерам</span>
              </Link>

              <Link
                href="/login"
                className="px-4 sm:px-5 py-2 rounded-full bg-neutral-950 hover:bg-neutral-800 text-white transition-all font-semibold flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Войти</span>
              </Link>
            </div>
          ) : (
            /* ================= АВТОРИЗОВАННЫЙ ПОЛЬЗОВАТЕЛЬ ================= */
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Переход в каталог услуг */}
              <Link
                href="/"
                className={`px-3.5 py-2 rounded-full transition-all flex items-center gap-1.5 text-xs font-semibold ${
                  pathname === "/"
                    ? "bg-neutral-950 text-white shadow-sm"
                    : "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100"
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>Услуги и салоны</span>
              </Link>

              {/* Вкладка «Мои записи» для клиентов */}
              <Link
                href="/my-bookings"
                className={`px-3.5 py-2 rounded-full transition-all flex items-center gap-1.5 text-xs font-semibold ${
                  pathname === "/my-bookings"
                    ? "bg-neutral-950 text-white shadow-sm"
                    : "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Мои записи</span>
              </Link>

              {/* Быстрая кнопка «CRM Салона» (для владельцев бизнеса) */}
              {isOwner && (
                <Link
                  href="/dashboard"
                  className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-neutral-900 hover:bg-neutral-800 text-white font-bold transition-all shadow-sm active:scale-95 text-xs"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
                  <span>CRM Салона</span>
                </Link>
              )}

              {/* Меню профиля с аккуратным дропдауном */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-full hover:bg-neutral-100 border border-neutral-200/80 transition-all text-neutral-800"
                >
                  <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px] font-bold">
                    {(currentUser.fullName || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-xs font-semibold max-w-[100px] truncate text-neutral-900">
                    {currentUser.fullName && currentUser.fullName !== "Пользователь"
                      ? currentUser.fullName
                      : currentUser.phone}
                  </span>
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>

                {/* Выпадающее меню */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-black/[0.08] py-2 z-50 animate-in fade-in zoom-in-95">
                    {/* Инфо о пользователе */}
                    <div className="px-4 py-2.5 border-b border-neutral-100">
                      <p className="text-xs font-bold text-neutral-900 truncate">
                        {currentUser.fullName || "Пользователь"}
                      </p>
                      <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        {currentUser.phone}
                      </p>
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200/60">
                        {isOwner ? "Владелец бизнеса" : isMaster ? "Мастер" : "Клиент"}
                      </span>
                    </div>

                    {/* Меню в зависимости от роли */}
                    {isOwner ? (
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-between px-4 py-2.5 text-xs font-bold text-neutral-950 bg-neutral-50 hover:bg-neutral-100 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <LayoutDashboard className="w-4 h-4 text-amber-500" />
                            <span>CRM Салона (Админка)</span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-neutral-400" />
                        </Link>

                        <div className="pt-1 mt-1 border-t border-neutral-100">
                          <Link
                            href="/my-bookings"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
                          >
                            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Мои личные записи</span>
                          </Link>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="py-1">
                          <Link
                            href="/my-bookings"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
                          >
                            <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Мои записи</span>
                          </Link>
                        </div>

                        {/* Подключить салон для обычного пользователя */}
                        <div className="pt-1 border-t border-neutral-100 my-1 bg-neutral-50/70 p-2 mx-1.5 rounded-xl">
                          <Link
                            href="/business/register"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold text-neutral-700 hover:bg-white transition-all shadow-none hover:shadow-sm"
                          >
                            <div className="flex items-center gap-2">
                              <Store className="w-3.5 h-3.5 text-neutral-500" />
                              <span>Подключить свой салон</span>
                            </div>
                            <ArrowRight className="w-3 h-3 text-neutral-400" />
                          </Link>
                        </div>
                      </>
                    )}

                    {isMaster && (
                      <div className="px-1.5 pb-1">
                        <Link
                          href="/staff"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold text-neutral-900 hover:bg-neutral-100 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <Scissors className="w-3.5 h-3.5 text-neutral-900" />
                            <span>Кабинет мастера</span>
                          </div>
                          <ArrowRight className="w-3 h-3 text-neutral-400" />
                        </Link>
                      </div>
                    )}

                    {/* Выход */}
                    <div className="pt-1 border-t border-neutral-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Выйти из аккаунта</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
