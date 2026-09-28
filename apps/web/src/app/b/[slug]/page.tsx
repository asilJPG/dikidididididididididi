"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  MapPin,
  Star,
  Check,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Send,
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

  // Шаги: 1: Услуга, 2: Мастер, 3: Время, 4: Контакты, 5: Подтверждение
  const [step, setStep] = useState(1);

  // Данные выбора
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | "any">("any");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Telegram окружение
  const [tgUser, setTgUser] = useState<any>(null);

  // Форма клиента
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
    const fetchSalon = async () => {
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
    };
    fetchSalon();
  }, [slug]);

  // Дни для выбора (7 дней вперед)
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

      const dayNames = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
      const monthNames = [
        "янв", "фев", "мар", "апр", "май", "июн",
        "июл", "авг", "сен", "окт", "ноя", "дек"
      ];

      list.push({
        dateStr,
        dayOfWeek: dayNames[d.getDay()],
        dayNum: d.getDate(),
        month: monthNames[d.getMonth()],
      });
    }
    return list;
  }, []);

  useEffect(() => {
    if (step === 3 && !selectedDate && daysList.length > 0) {
      setSelectedDate(daysList[0].dateStr);
    }
  }, [step, selectedDate, daysList]);

  // Загрузка слотов времени
  useEffect(() => {
    if (step === 3 && selectedService && selectedDate) {
      const fetchSlots = async () => {
        setLoadingSlots(true);
        setSelectedTime("");
        try {
          const staffParam = selectedStaff === "any" ? "any" : selectedStaff.id;
          const res = await fetch(
            `/api/salons/${slug}/slots?date=${selectedDate}&serviceId=${selectedService.id}&staffId=${staffParam}`
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

  // Отправка формы бронирования
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || clientPhone.replace(/\D/g, "").length < 9) {
      setErrorMsg("Укажите имя и телефон в формате +998");
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
        setErrorMsg(data.error || "Ошибка бронирования");
        return;
      }

      setConfirmedAppointment(data.appointment);
      setStep(5);
    } catch (err) {
      setErrorMsg("Ошибка сети при отправке записи");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium tracking-tight text-neutral-500">Загрузка...</span>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-center space-y-4">
          <p className="text-sm font-semibold text-neutral-900">Салон не найден</p>
          <p className="text-xs text-neutral-500">Возможно, ссылка изменилась или салон временно недоступен.</p>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#111111] flex flex-col items-center justify-start py-0 sm:py-10 px-0 sm:px-4">
      {/* Главный контейнер (Mobile Frame) */}
      <div className="w-full max-w-[480px] bg-white sm:rounded-[32px] sm:border border-black/[0.08] sm:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col min-h-screen sm:min-h-[740px]">
        
        {/* Верхний бар салона (Apple-style Header) */}
        <header className="px-6 pt-7 pb-5 border-b border-neutral-100 bg-white">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold tracking-[-0.02em] text-neutral-900 leading-tight">
                {salon.name}
              </h1>
              <p className="text-xs text-neutral-500 flex items-center gap-1 leading-normal">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="truncate">{salon.address}</span>
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-50 border border-neutral-200/70 text-xs font-medium text-neutral-700">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{salon.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Индикатор шагов */}
          {step < 5 && (
            <div className="mt-5 flex items-center gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    step >= s ? "bg-neutral-900" : "bg-neutral-100"
                  }`}
                />
              ))}
            </div>
          )}
        </header>

        {/* Интерактивный контент с анимациями переходов */}
        <main className="flex-1 p-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {/* ШАГ 1: ВЫБОР УСЛУГИ */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
                    Выберите услугу
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Цены указаны в сумах UZS</p>
                </div>

                <div className="space-y-6">
                  {salon.categories.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <h3 className="text-[11px] font-medium uppercase tracking-[0.06em] text-neutral-400 px-1">
                        {category.nameRu}
                      </h3>
                      <div className="space-y-1.5">
                        {category.services.map((service) => {
                          const isSelected = selectedService?.id === service.id;
                          return (
                            <div
                              key={service.id}
                              onClick={() => setSelectedService(service)}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isSelected
                                  ? "border-neutral-900 bg-neutral-50 shadow-sm"
                                  : "border-neutral-200/70 bg-white hover:border-neutral-300"
                              }`}
                            >
                              <div className="space-y-1 pr-2">
                                <p className="text-sm font-medium tracking-tight text-neutral-900">
                                  {service.nameRu}
                                </p>
                                {service.description && (
                                  <p className="text-xs text-neutral-500 leading-relaxed line-clamp-1">
                                    {service.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                                  <Clock className="w-3 h-3" />
                                  <span>{service.durationMinutes} мин</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0 flex items-center gap-3">
                                <span className="text-sm font-semibold text-neutral-900">
                                  {formatUZS(service.price)}
                                </span>
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                                    isSelected
                                      ? "bg-neutral-900 border-neutral-900 text-white"
                                      : "border-neutral-300 bg-white"
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3" />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ШАГ 2: ВЫБОР МАСТЕРА */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
                    Выберите мастера
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">К кому вы хотите записаться</p>
                </div>

                {/* Опция: Любой мастер */}
                <div
                  onClick={() => setSelectedStaff("any")}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedStaff === "any"
                      ? "border-neutral-900 bg-neutral-50 shadow-sm"
                      : "border-neutral-200/70 bg-white hover:border-neutral-300"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-semibold text-neutral-700">
                      ★
                    </div>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">Любой мастер</p>
                      <p className="text-xs text-neutral-500">Ближайшее доступное окно</p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                      selectedStaff === "any"
                        ? "bg-neutral-900 border-neutral-900 text-white"
                        : "border-neutral-300 bg-white"
                    }`}
                  >
                    {selectedStaff === "any" && <Check className="w-3 h-3" />}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h3 className="text-[11px] font-medium uppercase tracking-[0.06em] text-neutral-400 px-1">
                    Специалисты
                  </h3>
                  <div className="space-y-1.5">
                    {salon.staff.map((master) => {
                      const isSelected = selectedStaff !== "any" && selectedStaff.id === master.id;
                      return (
                        <div
                          key={master.id}
                          onClick={() => setSelectedStaff(master)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "border-neutral-900 bg-neutral-50 shadow-sm"
                              : "border-neutral-200/70 bg-white hover:border-neutral-300"
                          }`}
                        >
                          <div className="flex items-center gap-3.5">
                            <img
                              src={master.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                              alt={master.fullName}
                              className="w-11 h-11 rounded-full object-cover border border-neutral-200"
                            />
                            <div>
                              <p className="text-sm font-medium text-neutral-900">{master.fullName}</p>
                              <p className="text-xs text-neutral-500">{master.specialty}</p>
                              <div className="flex items-center gap-1 mt-0.5 text-xs text-neutral-700">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="font-semibold">{master.rating.toFixed(1)}</span>
                                <span className="text-neutral-400 text-[11px]">({master.reviewCount})</span>
                              </div>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                              isSelected
                                ? "bg-neutral-900 border-neutral-900 text-white"
                                : "border-neutral-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ШАГ 3: ДАТА И ВРЕМЯ */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
                    Выберите день
                  </h2>
                  <div className="flex gap-2 overflow-x-auto py-3 scrollbar-none">
                    {daysList.map((item) => {
                      const isSelected = selectedDate === item.dateStr;
                      return (
                        <button
                          key={item.dateStr}
                          type="button"
                          onClick={() => setSelectedDate(item.dateStr)}
                          className={`flex flex-col items-center justify-center min-w-[58px] py-2.5 px-2 rounded-2xl border transition-all ${
                            isSelected
                              ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                              : "border-neutral-200/80 bg-white text-neutral-700 hover:border-neutral-300"
                          }`}
                        >
                          <span className={`text-[10px] uppercase font-medium ${isSelected ? "text-neutral-300" : "text-neutral-400"}`}>
                            {item.dayOfWeek}
                          </span>
                          <span className="text-base font-semibold my-0.5">{item.dayNum}</span>
                          <span className={`text-[9px] uppercase ${isSelected ? "text-neutral-300" : "text-neutral-400"}`}>
                            {item.month}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between pb-2">
                    <h3 className="text-sm font-semibold tracking-tight text-neutral-900">
                      Свободные слоты
                    </h3>
                    {loadingSlots && (
                      <span className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" />
                        Поиск окон...
                      </span>
                    )}
                  </div>

                  {!loadingSlots && availableSlots.length === 0 ? (
                    <div className="bg-neutral-50 rounded-2xl p-6 text-center border border-neutral-200/60">
                      <p className="text-xs font-medium text-neutral-700">Нет свободных окон на этот день</p>
                      <p className="text-[11px] text-neutral-400 mt-1">Попробуйте выбрать другую дату</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((time) => {
                        const isSelected = selectedTime === time;
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={`py-2.5 px-1 rounded-xl text-center text-xs font-semibold tracking-tight transition-all border ${
                              isSelected
                                ? "bg-neutral-900 border-neutral-900 text-white shadow-sm"
                                : "bg-white border-neutral-200/80 text-neutral-800 hover:border-neutral-300"
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ШАГ 4: КОНТАКТЫ */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-neutral-900">
                    Ваши данные
                  </h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Для связи и напоминания о визите</p>
                </div>

                {/* Сводка визита (Editorial Receipt) */}
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/70 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500">Услуга:</span>
                    <span className="font-semibold text-neutral-900">{selectedService?.nameRu}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500">Мастер:</span>
                    <span className="font-semibold text-neutral-900">
                      {selectedStaff === "any" ? "Любой мастер" : selectedStaff.fullName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500">Дата и время:</span>
                    <span className="font-semibold text-neutral-900">
                      {selectedDate} в {selectedTime}
                    </span>
                  </div>
                  <div className="border-t border-neutral-200/80 pt-2 flex justify-between items-center">
                    <span className="text-xs font-medium text-neutral-700">К оплате:</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {formatUZS(selectedService?.price || 0)}
                    </span>
                  </div>
                </div>

                {/* Инпуты */}
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Имя
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Азиз"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Номер телефона
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+998 (90) 123-45-67"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">
                      Комментарий (необязательно)
                    </label>
                    <input
                      type="text"
                      placeholder="Особые пожелания к визиту"
                      value={clientComment}
                      onChange={(e) => setClientComment(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-neutral-200 bg-white text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-xs text-red-600 font-medium px-1">{errorMsg}</p>
                )}
              </motion.div>
            )}

            {/* ШАГ 5: ПОДТВЕРЖДЕНИЕ */}
            {step === 5 && confirmedAppointment && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 text-center py-4"
              >
                <div className="w-12 h-12 bg-neutral-900 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                    Запись подтверждена
                  </h2>
                  <p className="text-xs text-neutral-500">
                    Ждем вас в {salon.name}
                  </p>
                </div>

                {/* Чек */}
                <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200/80 text-left space-y-3">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-neutral-200/70">
                    <span className="text-neutral-500">Номер брони:</span>
                    <span className="font-mono text-neutral-800">
                      #{confirmedAppointment.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500">Услуга:</span>
                    <span className="font-semibold text-neutral-900">{confirmedAppointment.service.nameRu}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500">Мастер:</span>
                    <span className="font-semibold text-neutral-900">{confirmedAppointment.staff.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500">Время:</span>
                    <span className="font-semibold text-neutral-900">{selectedDate} в {selectedTime}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-500">Адрес:</span>
                    <span className="font-medium text-neutral-800 text-right">{salon.address}</span>
                  </div>
                  <div className="border-t border-neutral-200/80 pt-2 flex justify-between items-center">
                    <span className="text-xs font-medium text-neutral-600">Сумма:</span>
                    <span className="text-sm font-semibold text-neutral-900">
                      {formatUZS(confirmedAppointment.price)}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/70 flex items-center gap-3 text-left">
                  <Send className="w-4 h-4 text-neutral-600 shrink-0" />
                  <p className="text-xs text-neutral-600 leading-normal">
                    Детали визита и напоминание также отправлены в ваш Telegram.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setSelectedService(null);
                      setSelectedTime("");
                    }}
                    className="w-full h-11 rounded-full bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
                  >
                    Записаться еще раз
                  </button>
                  <Link
                    href="/dashboard"
                    className="w-full h-10 flex items-center justify-center rounded-full text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                  >
                    Перейти в панель CRM
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Фиксированная нижняя панель (Apple Action Bar) */}
        {step < 5 && (
          <footer className="p-5 bg-white border-t border-neutral-100 flex items-center justify-between gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="h-11 px-4 rounded-full border border-neutral-200 text-neutral-700 text-xs font-medium hover:bg-neutral-50 transition-colors flex items-center gap-1"
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
                className={`flex-1 h-11 px-5 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-[0.985] ${
                  selectedService
                    ? "bg-neutral-900 text-white hover:bg-neutral-800 shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
                    : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                }`}
              >
                Выбрать мастера <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 h-11 px-5 rounded-full bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-all flex items-center justify-center gap-1.5 active:scale-[0.985] shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
              >
                Выбрать дату и время <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={!selectedTime}
                onClick={() => setStep(4)}
                className={`flex-1 h-11 px-5 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 active:scale-[0.985] ${
                  selectedTime
                    ? "bg-neutral-900 text-white hover:bg-neutral-800 shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
                    : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                }`}
              >
                Ввести данные <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleBookingSubmit}
                className="flex-1 h-11 px-5 rounded-full bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-all flex items-center justify-center gap-1.5 active:scale-[0.985] shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
              >
                {submitting ? "Бронирование..." : "Подтвердить запись"}
              </button>
            )}
          </footer>
        )}
      </div>
    </div>
  );
}
