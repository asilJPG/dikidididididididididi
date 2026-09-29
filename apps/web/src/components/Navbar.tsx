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
  ExternalLink,
  Sparkles,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("dikidi_user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      } else {
        setCurrentUser(null);
      }
    } catch (e) {
      console.error(e);
      setCurrentUser(null);
    } finally {
      setIsLoaded(true);
    }
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
            <div className="flex items-center gap-2">
              {/* Вкладка «Мои записи» для клиента */}
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
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral-100 text-neutral-600">
                        {isOwner ? "Владелец бизнеса" : isMaster ? "Мастер" : "Клиент"}
                      </span>
                    </div>

                    {/* Ссылки профиля */}
                    <div className="py-1">
                      <Link
                        href="/my-bookings"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Мои записи и визиты</span>
                      </Link>
                      <Link
                        href="/"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-950 transition-colors"
                      >
                        <Store className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Каталог заведений</span>
                      </Link>
                    </div>

                    {/* Раздел CRM для бизнеса — показывается только владельцу или мастеру */}
                    {(isOwner || isMaster) && (
                      <div className="pt-1 border-t border-neutral-100 my-1 bg-neutral-50/70 p-2 mx-1.5 rounded-xl">
                        <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>DIKIDI Business</span>
                        </div>
                        {isOwner && (
                          <Link
                            href="/dashboard"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold text-neutral-900 hover:bg-white transition-all shadow-none hover:shadow-sm"
                          >
                            <div className="flex items-center gap-2">
                              <LayoutDashboard className="w-3.5 h-3.5 text-neutral-600" />
                              <span>CRM Салона</span>
                            </div>
                            <ArrowRight className="w-3 h-3 text-neutral-400" />
                          </Link>
                        )}
                        {isMaster && (
                          <Link
                            href="/staff"
                            onClick={() => setDropdownOpen(false)}
                            className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-bold text-neutral-900 hover:bg-white transition-all shadow-none hover:shadow-sm mt-0.5"
                          >
                            <div className="flex items-center gap-2">
                              <Scissors className="w-3.5 h-3.5 text-neutral-600" />
                              <span>Кабинет мастера</span>
                            </div>
                            <ArrowRight className="w-3 h-3 text-neutral-400" />
                          </Link>
                        )}
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
