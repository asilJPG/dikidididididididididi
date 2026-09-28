"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  Star,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Scissors,
  Phone,
  Send,
  Sparkles,
} from "lucide-react";
import { formatUZS, formatPhoneUZ } from "@/lib/utils";

interface Service {
  id: string;
  nameRu: string;
  nameUz?: string | null;
  description?: string | null;
  durationMinutes: number;
  price: number;
}

interface Category {
  id: string;
  nameRu: string;
  services: Service[];
}

interface Staff {
  id: string;
  fullName: string;
  specialty: string;
  avatarUrl?: string | null;
  rating: number;
  reviewCount: number;
}

interface Salon {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  phone: string;
  description?: string | null;
  rating: number;
  reviewCount: number;
  categories: Category[];
  staff: Staff[];
}

export default function BookingPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);

  // Шаги бронирования: 1 = Услуга, 2 = Мастер, 3 = Дата и Время, 4 = Контакты, 5 = Успех
  const [step, setStep] = useState(1);

  // Выбранные данные
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | "any">("any");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Telegram данные
  const [isInsideTelegram, setIsInsideTelegram] = useState(false);
  const [tgUser, setTgUser] = useState<any>(null);

  // Контакты клиента
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("+998 ");
  const [clientComment, setClientComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Инициализация Telegram WebApp
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.expand();
      setIsInsideTelegram(true);

      const user = tg.initDataUnsafe?.user;
      if (user) {
        setTgUser(user);
        const name = `${user.first_name || ""} ${user.last_name || ""}`.trim();
        if (name) setClientName(name);
      }
    }
  }, []);

  // Загрузка данных салона
  useEffect(() => {
    async function fetchSalon() {
      try {
        const res = await fetch(`/api/salons/${slug}`);
        const data = await res.json();
        if (data.salon) {
          setSalon(data.salon);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSalon();
  }, [slug]);

  // Дни для выбора (сегодня + следующие 6 дней)
  const daysList = React.useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
      const monthNames = [
        "янв",
        "фев",
        "мар",
        "апр",
        "май",
        "июн",
        "июл",
        "авг",
        "сен",
        "окт",
        "ноя",
        "дек",
      ];

      list.push({
        dateStr,
        dayOfWeek: dayNames[d.getDay()],
        dayNum: d.getDate(),
        month: monthNames[d.getMonth()],
        isToday: i === 0,
      });
    }
    return list;
  }, []);

  // Установка сегодняшней даты по умолчанию при переходе на шаг 3
  useEffect(() => {
    if (step === 3 && !selectedDate && daysList.length > 0) {
      setSelectedDate(daysList[0].dateStr);
    }
  }, [step, selectedDate, daysList]);

  // Загрузка слотов при смене даты, мастера или услуги
  useEffect(() => {
    if (step === 3 && selectedService && selectedDate) {
      const fetchSlots = async () => {
        setLoadingSlots(true);
        setSelectedTime("");
        try {
          const staffParam = selectedStaff === "any" ? "any" : selectedStaff.id;
          const res = await fetch(
            `/api/salons/${slug}/slots?date=${selectedDate}&serviceId=${selectedService?.id}&staffId=${staffParam}`
          );
          const data = await res.json();
          if (data.slots) {
            setAvailableSlots(data.slots.map((s: any) => s.time));
          } else {
            setAvailableSlots([]);
          }
        } catch (err) {
          console.error(err);
          setAvailableSlots([]);
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchSlots();
    }
  }, [step, slug, selectedService, selectedStaff, selectedDate]);

  // Отправка бронирования
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || clientPhone.replace(/\D/g, "").length < 9) {
      setErrorMsg("Пожалуйста, введите имя и корректный номер телефона Узбекистана");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonSlug: slug,
          serviceId: selectedService?.id,
          staffId: selectedStaff === "any" ? "any" : selectedStaff.id,
          date: selectedDate,
          time: selectedTime,
          clientName,
          clientPhone,
          clientComment,
          telegramId: tgUser?.id ? String(tgUser.id) : undefined,
          telegramChatId: tgUser?.id ? String(tgUser.id) : undefined,
          telegramUsername: tgUser?.username || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Не удалось создать запись");
        return;
      }

      setConfirmedAppointment(data.appointment);
      setStep(5); // Экран успешной записи
    } catch (err) {
      setErrorMsg("Ошибка сети при отправке записи");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500">Загрузка онлайн-записи...</p>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border text-center max-w-sm">
          <h2 className="text-lg font-bold text-slate-900">Салон не найден</h2>
          <p className="text-sm text-slate-500 mt-1">Проверьте правильность ссылки.</p>
          <Link
            href="/"
            className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-start items-center p-0 sm:py-6">
      <div className="w-full max-w-lg bg-white sm:rounded-3xl shadow-lg border-0 sm:border border-slate-200 overflow-hidden flex flex-col min-h-screen sm:min-h-[780px]">
        {/* Шапка салона */}
        <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 pt-7">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/20">
                <Sparkles className="w-3 h-3" /> Онлайн-запись {isInsideTelegram && "• Telegram"}
              </span>
              <h1 className="text-xl font-bold tracking-tight">{salon.name}</h1>
              <p className="text-xs text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                {salon.address}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-amber-400/20 border border-amber-400/30 px-2 py-1 rounded-xl text-amber-300 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{salon.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Индикатор шагов */}
          {step < 5 && (
            <div className="mt-5 grid grid-cols-4 gap-1.5 pt-2 border-t border-white/10">
              {[
                { s: 1, label: "Услуга" },
                { s: 2, label: "Мастер" },
                { s: 3, label: "Время" },
                { s: 4, label: "Данные" },
              ].map((item) => (
                <div key={item.s} className="flex flex-col items-center">
                  <div
                    className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                      step >= item.s ? "bg-indigo-400" : "bg-white/20"
                    }`}
                  />
                  <span
                    className={`text-[11px] mt-1 ${
                      step >= item.s ? "text-indigo-200 font-semibold" : "text-white/40"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Контент шагов */}
        <div className="flex-1 p-5 overflow-y-auto">
          {/* ШАГ 1: ВЫБОР УСЛУГИ */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-base font-bold text-slate-900">Выберите услугу:</h2>
                <span className="text-xs text-slate-400">Цены в сумах UZS</span>
              </div>

              {salon.categories.map((category) => (
                <div key={category.id} className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                    {category.nameRu}
                  </h3>
                  <div className="space-y-2">
                    {category.services.map((service) => {
                      const isSelected = selectedService?.id === service.id;
                      return (
                        <div
                          key={service.id}
                          onClick={() => setSelectedService(service)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? "border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-900">{service.nameRu}</p>
                            {service.description && (
                              <p className="text-xs text-slate-500 line-clamp-1">
                                {service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span>{service.durationMinutes} мин</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-extrabold text-indigo-600">
                              {formatUZS(service.price)}
                            </span>
                            <div className="mt-1 flex justify-end">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                                  isSelected
                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ШАГ 2: ВЫБОР МАСТЕРА */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="pb-1">
                <h2 className="text-base font-bold text-slate-900">Выберите специалиста:</h2>
                <p className="text-xs text-slate-500">К кому вы хотите записаться?</p>
              </div>

              {/* Опция: Любой мастер */}
              <div
                onClick={() => setSelectedStaff("any")}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedStaff === "any"
                    ? "border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Любой свободный мастер</p>
                    <p className="text-xs text-slate-500">Система выберет ближайшее свободное окно</p>
                  </div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                    selectedStaff === "any"
                      ? "bg-indigo-600 border-indigo-600 text-white"
                      : "border-slate-300"
                  }`}
                >
                  {selectedStaff === "any" && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </div>

              {/* Список мастеров */}
              <div className="space-y-2.5 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
                  Мастера салона
                </h3>
                {salon.staff.map((master) => {
                  const isSelected = selectedStaff !== "any" && selectedStaff.id === master.id;
                  return (
                    <div
                      key={master.id}
                      onClick={() => setSelectedStaff(master)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={master.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                          alt={master.fullName}
                          className="w-12 h-12 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-900">{master.fullName}</p>
                          <p className="text-xs text-slate-500">{master.specialty}</p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-amber-500 font-bold">
                            <Star className="w-3 h-3 fill-amber-400" />
                            <span>{master.rating.toFixed(1)}</span>
                            <span className="text-slate-400 font-normal">
                              ({master.reviewCount} отзывов)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white"
                            : "border-slate-300"
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ШАГ 3: ДАТА И ВРЕМЯ */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Выберите дату:</h2>
                {/* Календарная горизонтальная полоса */}
                <div className="flex gap-2 overflow-x-auto py-2.5 scrollbar-none">
                  {daysList.map((item) => {
                    const isSelected = selectedDate === item.dateStr;
                    return (
                      <button
                        key={item.dateStr}
                        onClick={() => setSelectedDate(item.dateStr)}
                        className={`flex flex-col items-center justify-center min-w-[62px] py-2.5 px-2 rounded-2xl border transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <span className={`text-[11px] font-medium ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                          {item.dayOfWeek}
                        </span>
                        <span className="text-base font-extrabold my-0.5">{item.dayNum}</span>
                        <span className={`text-[10px] uppercase tracking-wide ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                          {item.month}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Слоты времени */}
              <div>
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-sm font-bold text-slate-900">Свободное время:</h3>
                  {loadingSlots && (
                    <span className="text-xs text-indigo-600 flex items-center gap-1 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                      Поиск окон...
                    </span>
                  )}
                </div>

                {!loadingSlots && availableSlots.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                    <p className="text-sm font-semibold text-slate-700">На этот день нет свободных окон</p>
                    <p className="text-xs text-slate-400 mt-1">Пожалуйста, выберите другую дату или другого мастера.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map((time) => {
                      const isSelected = selectedTime === time;
                      return (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-2.5 px-1 rounded-xl text-center text-sm font-bold transition-all border ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                              : "bg-white border-slate-200 text-slate-800 hover:border-indigo-300"
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ШАГ 4: ВВОД ДАННЫХ И ПОДТВЕРЖДЕНИЕ */}
          {step === 4 && (
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Контактные данные:</h2>
                <p className="text-xs text-slate-500">Для подтверждения записи и отправки напоминания</p>
              </div>

              {/* Сводка записи */}
              <div className="bg-indigo-50/70 border border-indigo-200/70 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-start text-xs">
                  <span className="text-slate-500">Услуга:</span>
                  <span className="font-bold text-slate-900 text-right">{selectedService?.nameRu}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Мастер:</span>
                  <span className="font-bold text-slate-900">
                    {selectedStaff === "any" ? "Любой свободный мастер" : selectedStaff.fullName}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Дата и время:</span>
                  <span className="font-bold text-indigo-700">
                    {selectedDate} в {selectedTime}
                  </span>
                </div>
                <div className="border-t border-indigo-200/50 pt-2 flex justify-between items-center">
                  <span className="text-xs font-semibold text-slate-700">К оплате:</span>
                  <span className="text-sm font-extrabold text-indigo-600">
                    {formatUZS(selectedService?.price || 0)}
                  </span>
                </div>
              </div>

              {/* Поля ввода */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Ваше имя <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Например, Азиз"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Номер телефона Узбекистана <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+998 (90) 123-45-67"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    На этот номер придет напоминание перед визитом
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Комментарий для мастера (необязательно)
                  </label>
                  <input
                    type="text"
                    placeholder="Пожелания, аллергии, ориентир"
                    value={clientComment}
                    onChange={(e) => setClientComment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
                  {errorMsg}
                </div>
              )}
            </form>
          )}

          {/* ШАГ 5: УСПЕШНОЕ БРОНИРОВАНИЕ */}
          {step === 5 && confirmedAppointment && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900">Вы успешно записаны!</h2>
                <p className="text-xs text-slate-500">
                  Ждем вас в {salon.name}. Запись добавлена в рабочий журнал мастера.
                </p>
              </div>

              {/* Чек */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2.5">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Номер записи:</span>
                  <span className="font-mono font-bold text-slate-800">
                    #{confirmedAppointment.id.slice(0, 8)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Услуга:</span>
                  <span className="font-bold text-slate-900">{confirmedAppointment.service.nameRu}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Мастер:</span>
                  <span className="font-bold text-slate-900">{confirmedAppointment.staff.fullName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Дата и время:</span>
                  <span className="font-bold text-indigo-600">
                    {selectedDate} в {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Адрес:</span>
                  <span className="font-bold text-slate-900 text-right">{salon.address}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-700">Итого к оплате:</span>
                  <span className="text-sm font-extrabold text-indigo-600">
                    {formatUZS(confirmedAppointment.price)}
                  </span>
                </div>
              </div>

              {/* Уведомление о Telegram */}
              <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-sky-950">Telegram-уведомление отправлено</p>
                  <p className="text-[11px] text-sky-700">
                    Детали записи и напоминание продублированы вам в Telegram-чат
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href={`/b/${slug}`}
                  onClick={() => {
                    setStep(1);
                    setSelectedService(null);
                    setSelectedTime("");
                  }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-sm font-bold transition-all"
                >
                  Записаться на другую услугу
                </Link>
                <Link
                  href="/dashboard"
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-semibold transition-all"
                >
                  Перейти в панель мастера (CRM)
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Нижняя фиксированная панель действий */}
        {step < 5 && (
          <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-3 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-bold flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Назад
              </button>
            ) : (
              <div />
            )}

            {step === 1 && (
              <button
                type="button"
                disabled={!selectedService}
                onClick={() => setStep(2)}
                className={`flex-1 py-3 px-5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  selectedService
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                Далее: Выбор мастера <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-3 px-5 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                Далее: Выбор времени <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={!selectedTime}
                onClick={() => setStep(4)}
                className={`flex-1 py-3 px-5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  selectedTime
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                }`}
              >
                Далее: Ввод данных <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleBookingSubmit}
                className="flex-1 py-3 px-5 rounded-2xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {submitting ? "Бронируем..." : "Подтвердить запись"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
