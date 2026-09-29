"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Scissors,
  User,
  Star,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  Search,
  ExternalLink,
  CalendarPlus,
  Send,
  ArrowLeft,
} from "lucide-react";
import { formatUZS, formatPhoneUZ, formatTashkentTime } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function MyBookingsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const [phone, setPhone] = useState("");
  const [searchedPhone, setSearchedPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [past, setPast] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  // Отмена записи
  const [cancelModalAppt, setCancelModalAppt] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Оставить отзыв
  const [reviewModalAppt, setReviewModalAppt] = useState<any | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Автозагрузка номера из localStorage или Telegram WebApp
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dikidi_user_phone");
      const storedUser = localStorage.getItem("dikidi_user");
      let initialPhone = "";

      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          setCurrentUser(u);
          if (u.phone) initialPhone = u.phone;
        } catch (e) {}
      } else if (stored) {
        initialPhone = stored;
      }

      setIsLoaded(true);

      if (initialPhone) {
        setPhone(initialPhone);
        loadBookings(initialPhone);
      }
    }
  }, []);

  const loadBookings = async (targetPhone: string) => {
    if (!targetPhone || targetPhone.replace(/\D/g, "").length < 7) {
      setErrorMsg("Введите корректный номер телефона");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch(
        `/api/client/appointments?phone=${encodeURIComponent(targetPhone)}`
      );
      const data = await res.json();
      if (res.ok) {
        const up = data.upcoming || [];
        const ps = data.past || [];
        setUpcoming(up);
        setPast(ps);
        setSearchedPhone(targetPhone);
        localStorage.setItem("dikidi_user_phone", targetPhone);

        if (up.length === 0 && ps.length > 0) {
          setActiveTab("past");
        } else {
          setActiveTab("upcoming");
        }
      } else {
        setErrorMsg(data.error || "Не удалось найти записи");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Ошибка при соединении с сервером");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadBookings(phone);
  };

  const handleCancelAppointment = async () => {
    if (!cancelModalAppt) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/client/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: cancelModalAppt.id,
          action: "CANCEL",
          cancelReason,
        }),
      });

      if (res.ok) {
        setCancelModalAppt(null);
        setCancelReason("");
        loadBookings(searchedPhone || phone);
      } else {
        alert("Не удалось отменить запись");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalAppt) return;
    setSubmittingReview(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: reviewModalAppt.id,
          rating,
          comment: reviewComment,
        }),
      });

      if (res.ok) {
        setReviewSuccess(true);
        setTimeout(() => {
          setReviewSuccess(false);
          setReviewModalAppt(null);
          setReviewComment("");
          setRating(5);
          loadBookings(searchedPhone || phone);
        }, 1500);
      } else {
        const d = await res.json();
        alert(d.error || "Ошибка сохранения отзыва");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Экспорт в календарь .ics
  const downloadIcs = (appt: any) => {
    const start = new Date(appt.startDateTime)
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, "");
    const end = new Date(appt.endDateTime)
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, "");

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DIKIDI UZ//Online Booking//RU
BEGIN:VEVENT
UID:${appt.id}@dikidi.uz
DTSTAMP:${start}
DTSTART:${start}
DTEND:${end}
SUMMARY:${appt.service.nameRu} - ${appt.salon.name}
DESCRIPTION:Запись в ${appt.salon.name}. Мастер: ${appt.staff.fullName}. Стоимость: ${appt.price} UZS
LOCATION:${appt.salon.address}, ${appt.salon.city}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `booking-${appt.id.slice(0, 8)}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-900 text-white flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Подтверждена
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            В процессе
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
            Завершена
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            Отменена
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-800 border border-neutral-300">
            Ожидает подтверждения
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#111111] flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
      {/* Навигационная панель */}
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-5 py-8 w-full space-y-6">
        {!isLoaded ? (
          <div className="w-full h-64 bg-white rounded-3xl animate-pulse" />
        ) : !currentUser ? (
          /* ================= НЕ АВТОРИЗОВАН ================= */
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-black/[0.06] text-center space-y-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] max-w-md mx-auto my-12">
            <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-900 shadow-inner">
              <Calendar className="w-8 h-8 text-neutral-900" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-neutral-950 tracking-tight">
                Войдите в аккаунт
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
                Чтобы просматривать запланированные визиты, переносить время или отменять бронирования, войдите по номеру телефона
              </p>
            </div>
            <div className="space-y-3 pt-2">
              <Link
                href="/login"
                className="w-full h-12 rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
              >
                <User className="w-4 h-4" />
                <span>Войти по номеру телефона</span>
              </Link>
              <Link
                href="/"
                className="w-full h-11 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Перейти к каталогу услуг</span>
              </Link>
            </div>
          </div>
        ) : (
          /* ================= АВТОРИЗОВАННЫЙ КЛИЕНТ ================= */
          <div className="space-y-6">
            {/* Быстрый переход в каталог заведений и услуг */}
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-700 hover:text-neutral-950 px-3.5 py-2 rounded-xl bg-white border border-black/[0.06] shadow-xs hover:shadow-sm transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-neutral-400" />
                <span>В каталог заведений и услуг</span>
              </Link>
            </div>

            {/* Карточка профиля авторизованного пользователя */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-neutral-950 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                  {currentUser.fullName ? currentUser.fullName[0].toUpperCase() : "К"}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold tracking-tight text-neutral-950">
                      {currentUser.fullName || "Клиент"}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700 border border-neutral-200/60">
                      {currentUser.role === "OWNER" || currentUser.role === "SALON_OWNER"
                        ? "Владелец"
                        : currentUser.role === "MASTER"
                        ? "Мастер"
                        : "Клиент"}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 font-medium">
                    {formatPhoneUZ(currentUser.phone || phone)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                <Link
                  href="/"
                  className="h-10 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm active:scale-95"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>Записаться на услугу</span>
                </Link>
                <button
                  type="button"
                  onClick={() => loadBookings(currentUser.phone || phone)}
                  disabled={loading}
                  className="h-10 w-10 rounded-xl border border-neutral-200/80 hover:bg-neutral-100 text-neutral-600 flex items-center justify-center transition-colors disabled:opacity-50"
                  title="Обновить список"
                >
                  <RotateCcw className={`w-4 h-4 ${loading ? "animate-spin text-neutral-900" : ""}`} />
                </button>
              </div>
            </div>

            {/* Табы: Предстоящие vs История визитов */}
            <div className="flex border-b border-neutral-200">
              <button
                type="button"
                onClick={() => setActiveTab("upcoming")}
                className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === "upcoming"
                    ? "border-neutral-900 text-neutral-900"
                    : "border-transparent text-neutral-400 hover:text-neutral-700"
                }`}
              >
                <span>Предстоящие визиты</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "upcoming" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"
                }`}>
                  {upcoming.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("past")}
                className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === "past"
                    ? "border-neutral-900 text-neutral-900"
                    : "border-transparent text-neutral-400 hover:text-neutral-700"
                }`}
              >
                <span>История визитов</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === "past" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-700"
                }`}>
                  {past.length}
                </span>
              </button>
            </div>

            {/* СПИСОК 1: ПРЕДСТОЯЩИЕ ЗАПИСИ */}
            {activeTab === "upcoming" && (
              <div className="space-y-4">
                {upcoming.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-black/[0.08] p-10 text-center space-y-3">
                    <Calendar className="w-8 h-8 text-neutral-300 mx-auto" />
                    <p className="text-sm font-semibold text-neutral-900">
                      У вас нет активных записей
                    </p>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      Выберите салон в нашем каталоге и забронируйте удобное время
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      Перейти в каталог заведений <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  upcoming.map((appt) => {
                    const dateObj = new Date(appt.startDateTime);
                    const dateFormatted = dateObj.toLocaleDateString("ru-RU", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                    });
                    const timeFormatted = formatTashkentTime(appt.startDateTime);

                    return (
                      <div
                        key={appt.id}
                        className="bg-white p-5 rounded-2xl border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                          <div>
                            <Link
                              href={`/b/${appt.salon.slug}`}
                              className="text-base font-bold text-neutral-900 hover:underline flex items-center gap-1.5"
                            >
                              {appt.salon.name} <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                            </Link>
                            <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                              {appt.salon.address}, {appt.salon.city}
                            </p>
                          </div>
                          <div>{renderBadge(appt.status)}</div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-50 p-3.5 rounded-xl text-xs">
                          <div>
                            <span className="text-[11px] text-neutral-400 block font-medium">Услуга</span>
                            <span className="font-semibold text-neutral-900 block mt-0.5">
                              {appt.service.nameRu}
                            </span>
                            <span className="text-[11px] text-neutral-500">
                              {appt.service.durationMinutes} мин · {formatUZS(appt.price)}
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] text-neutral-400 block font-medium">Специалист</span>
                            <span className="font-semibold text-neutral-900 block mt-0.5">
                              {appt.staff.fullName}
                            </span>
                            <span className="text-[11px] text-neutral-500">
                              {appt.staff.specialty}
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] text-neutral-400 block font-medium">Дата и время</span>
                            <span className="font-semibold text-neutral-900 block mt-0.5 capitalize">
                              {dateFormatted}
                            </span>
                            <span className="text-[11px] font-bold text-neutral-900">
                              {timeFormatted} (Ташкент)
                            </span>
                          </div>
                        </div>

                        {/* Кнопки действий */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => downloadIcs(appt)}
                              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" /> В календарь
                            </button>
                            <a
                              href={`tel:${appt.salon.phone}`}
                              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" /> Позвонить
                            </a>
                          </div>

                          {appt.status !== "CANCELLED" && (
                            <button
                              type="button"
                              onClick={() => setCancelModalAppt(appt)}
                              className="px-3 py-1.5 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Отменить запись
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* СПИСОК 2: ИСТОРИЯ ВИЗИТОВ */}
            {activeTab === "past" && (
              <div className="space-y-4">
                {past.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-black/[0.08] p-10 text-center space-y-2">
                    <p className="text-sm font-semibold text-neutral-900">История визитов пуста</p>
                    <p className="text-xs text-neutral-500">
                      Завершенные или отмененные записи будут сохраняться здесь
                    </p>
                  </div>
                ) : (
                  past.map((appt) => {
                    const dateObj = new Date(appt.startDateTime);
                    const dateFormatted = dateObj.toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                    const timeFormatted = formatTashkentTime(appt.startDateTime);

                    return (
                      <div
                        key={appt.id}
                        className="bg-white p-5 rounded-2xl border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-bold text-neutral-900">{appt.salon.name}</p>
                            <p className="text-xs text-neutral-500">{appt.service.nameRu} · {appt.staff.fullName}</p>
                          </div>
                          <div>{renderBadge(appt.status)}</div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-neutral-600 bg-neutral-50 p-2.5 rounded-xl">
                          <span>{dateFormatted} в {timeFormatted}</span>
                          <span className="font-semibold text-neutral-900">{formatUZS(appt.price)}</span>
                        </div>

                        {/* Отзыв или кнопка оставить отзыв */}
                        {appt.review ? (
                          <div className="bg-amber-50/60 border border-amber-200/60 p-3 rounded-xl text-xs space-y-1">
                            <div className="flex items-center gap-1 text-amber-500">
                              {[...Array(appt.review.rating)].map((_, i) => (
                                <Star key={i} className="w-3.5 h-3.5 fill-current" />
                              ))}
                              <span className="text-[11px] font-semibold text-neutral-700 ml-1">
                                Ваш отзыв
                              </span>
                            </div>
                            {appt.review.comment && (
                              <p className="text-neutral-700 italic">«{appt.review.comment}»</p>
                            )}
                          </div>
                        ) : appt.status === "COMPLETED" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setReviewModalAppt(appt);
                              setRating(5);
                              setReviewComment("");
                            }}
                            className="w-full py-2 border border-neutral-300 hover:border-neutral-900 rounded-xl text-xs font-semibold text-neutral-800 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Star className="w-3.5 h-3.5 text-amber-500" /> Оставить отзыв о визите
                          </button>
                        ) : null}

                        {/* Кнопка повторной записи */}
                        <div className="pt-1 flex justify-end">
                          <Link
                            href={`/b/${appt.salon.slug}`}
                            className="px-4 py-2 bg-neutral-100 hover:bg-neutral-900 hover:text-white rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 text-neutral-800"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Записаться снова
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* МОДАЛКА ОТМЕНЫ ЗАПИСИ */}
      {cancelModalAppt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-neutral-900">
                Подтверждение отмены записи
              </h3>
              <p className="text-xs text-neutral-500">
                Вы действительно хотите отменить визит в{" "}
                <strong>{cancelModalAppt.salon.name}</strong> на{" "}
                {formatTashkentTime(cancelModalAppt.startDateTime)}? Освобожденный слот станет доступен другим гостям.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">
                Причина отмены (необязательно)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Изменились планы / заболел..."
                rows={2}
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalAppt(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={handleCancelAppointment}
                disabled={cancelling}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {cancelling ? "Отмена..." : "Да, отменить визит"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА ОТЗЫВА */}
      {reviewModalAppt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900">
                Оцените визит
              </h3>
              <p className="text-xs text-neutral-500">
                {reviewModalAppt.service.nameRu} у мастера {reviewModalAppt.staff.fullName}
              </p>
            </div>

            {reviewSuccess ? (
              <div className="p-6 text-center space-y-2 bg-emerald-50 rounded-2xl border border-emerald-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-emerald-900">Спасибо за отзыв!</p>
                <p className="text-xs text-emerald-700">Ваша оценка помогает другим клиентам</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Звезды */}
                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-neutral-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Ваш комментарий
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Что понравилось? Как качество стрижки или услуги?"
                    rows={3}
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setReviewModalAppt(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {submittingReview ? "Сохранение..." : "Отправить отзыв"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Единый брендовый футер */}
      <Footer />
    </div>
  );
}
