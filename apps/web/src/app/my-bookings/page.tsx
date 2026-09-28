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

export default function MyBookingsPage() {
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

      if (stored) {
        initialPhone = stored;
      } else if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.phone) initialPhone = u.phone;
        } catch (e) {}
      }

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
        setUpcoming(data.upcoming || []);
        setPast(data.past || []);
        setSearchedPhone(targetPhone);
        localStorage.setItem("dikidi_user_phone", targetPhone);
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
      {/* Шапка */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> На главную
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold text-base tracking-tight text-neutral-900">
              DIKIDI
            </span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-black/[0.06] text-neutral-600">
              UZ
            </span>
          </Link>

          <Link
            href="/dashboard"
            className="text-xs font-semibold px-3 py-1 rounded-full bg-black/[0.05] hover:bg-neutral-900 hover:text-white transition-all text-neutral-700"
          >
            Для бизнеса
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-5 py-8 w-full space-y-6">
        {/* Заголовок */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
            Мои записи и визиты
          </h1>
          <p className="text-xs text-neutral-500">
            Управляйте вашими бронированиями, переносите или отменяйте визиты, оставляйте отзывы
          </p>
        </div>

        {/* Форма поиска по номеру телефона */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123-45-67"
                className="w-full pl-10 pr-4 h-11 bg-neutral-50 border border-neutral-200/90 rounded-xl text-sm font-medium text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-11 px-6 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shrink-0"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" /> Найти мои записи
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <p className="text-xs font-medium text-rose-600 mt-2.5 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {errorMsg}
            </p>
          )}

          {searchedPhone && (
            <div className="mt-3 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <span>
                Показаны записи для номера:{" "}
                <strong className="text-neutral-900 font-semibold">
                  {formatPhoneUZ(searchedPhone)}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setPhone("");
                  setSearchedPhone("");
                  setUpcoming([]);
                  setPast([]);
                  localStorage.removeItem("dikidi_user_phone");
                }}
                className="text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                Сменить номер
              </button>
            </div>
          )}
        </div>

        {/* Табы: Предстоящие vs История */}
        {searchedPhone && (
          <div className="space-y-4">
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
                <span>Предстоящие</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-100 text-neutral-800">
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
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-100 text-neutral-800">
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
    </div>
  );
}
