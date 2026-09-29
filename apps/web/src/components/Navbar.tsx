"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-black/[0.06] transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Логотип бренда */}
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

        {/* Правая навигация */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-medium">
          {/* Город */}
          <div className="hidden md:flex items-center gap-1.5 text-neutral-600 bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-200/60">
            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
            <span className="font-semibold text-neutral-800">Ташкент</span>
          </div>

          {!isLoaded ? (
            /* Скелетон во время гидратации */
            <div className="w-20 h-9 bg-neutral-100 rounded-full animate-pulse" />
          ) : !currentUser ? (
            /* ================= НЕ АВТОРИЗОВАН ================= */
            <div className="flex items-center gap-2">
              <Link
                href="/business"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition-colors font-medium"
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
            /* ================= АВТОРИЗОВАН (РОЛЕВАЯ МОДЕЛЬ) ================= */
            <div className="flex items-center gap-2">
              {/* Вкладка «Мои записи» для клиентов */}
              <Link
                href="/my-bookings"
                className={`px-3 sm:px-3.5 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                  pathname === "/my-bookings"
                    ? "bg-neutral-950 text-white font-semibold shadow-sm"
                    : "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Мои записи</span>
              </Link>

              {/* Вкладка «Кабинет мастера» — только если мастер */}
              {isMaster && (
                <Link
                  href="/staff"
                  className={`px-3 sm:px-3.5 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                    pathname === "/staff"
                      ? "bg-neutral-950 text-white font-semibold shadow-sm"
                      : "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100"
                  }`}
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Кабинет мастера</span>
                  <span className="sm:hidden">Мастер</span>
                </Link>
              )}

              {/* Вкладка «CRM Салона» — только если владелец */}
              {isOwner && (
                <Link
                  href="/dashboard"
                  className={`px-3 sm:px-3.5 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                    pathname === "/dashboard"
                      ? "bg-neutral-950 text-white font-semibold shadow-sm"
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-semibold"
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>CRM Салона</span>
                </Link>
              )}

              {/* Блок пользователя + Выход */}
              <div className="flex items-center pl-2 ml-1 border-l border-neutral-200 gap-1.5">
                <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-neutral-50 rounded-full border border-neutral-200/50">
                  <div className="w-4 h-4 rounded-full bg-neutral-200 flex items-center justify-center text-[9px] font-bold text-neutral-700 uppercase">
                    {(currentUser.fullName || "U").slice(0, 1)}
                  </div>
                  <span className="text-neutral-700 max-w-[110px] truncate text-[11px] font-medium">
                    {currentUser.fullName && currentUser.fullName !== "Пользователь"
                      ? currentUser.fullName
                      : currentUser.phone}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  title="Выйти из аккаунта"
                  className="p-2 rounded-full hover:bg-rose-50 text-neutral-400 hover:text-rose-600 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
