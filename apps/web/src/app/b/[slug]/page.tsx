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
  CalendarPlus,
  Phone,
  Scissors,
  Users,
  Info,
  Sparkles,
  Calendar,
  X,
  ShieldCheck,
  Coffee,
  Wifi,
  CreditCard,
  RotateCcw,
} from "lucide-react";
import { formatUZS, formatPhoneUZ, formatTashkentTime } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

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
  const [activeTab, setActiveTab] = useState<"services" | "staff" | "about">("services");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Состояние модального окна бронирования
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [step, setStep] = useState(1);

  // Данные выбора бронирования
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

  // Инициализация Telegram WebApp и localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedPhone = localStorage.getItem("dikidi_user_phone");
      const storedUser = localStorage.getItem("dikidi_user");
      if (storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u.fullName && u.fullName !== "Пользователь") setClientName(u.fullName);
          if (u.phone) setClientPhone(u.phone);
        } catch (e) {}
      } else if (storedPhone) {
        setClientPhone(storedPhone);
      }

      if ((window as any).Telegram?.WebApp) {
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
    }
  }, []);

  // Загрузка данных заведения
  useEffect(() => {
    const fetchSalon = async () => {
      try {
        const res = await fetch(`/api/salons/${slug}`);
        const data = await res.json();
        if (data.salon) {
          setSalon(data.salon);
        }
      } catch (err) {
        console.error("Failed to load salon:", err);
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
        "июл", "авг", "сен", "окт", "ноя", "дек",
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
    if (isBookingOpen && step === 3 && selectedService && selectedDate) {
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
          console.error("Error loading slots:", err);
          setAvailableSlots([]);
        } finally {
          setLoadingSlots(false);
        }
      };
      fetchSlots();
    }
  }, [isBookingOpen, step, slug, selectedService, selectedStaff, selectedDate]);

  // Быстрый запуск записи на конкретную услугу
  const handleStartBookingService = (service: Service) => {
    setSelectedService(service);
    setStep(2);
    setIsBookingOpen(true);
  };

  // Быстрый запуск записи к конкретному мастеру
  const handleStartBookingStaff = (master: Staff) => {
    setSelectedStaff(master);
    setStep(1);
    setIsBookingOpen(true);
  };

  // Отправка формы бронирования
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || clientPhone.replace(/\D/g, "").length < 9) {
      setErrorMsg("Укажите имя и корректный номер телефона");
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
      try {
        localStorage.setItem("dikidi_user_phone", clientPhone);
        document.cookie = `dikidi_user_phone=${encodeURIComponent(clientPhone)}; path=/; max-age=2592000; SameSite=Lax`;
      } catch (e) {}
      setStep(5);
    } catch (err) {
      setErrorMsg("Ошибка сети при отправке записи");
    } finally {
      setSubmitting(false);
    }
  };

  // Экспорт в календарь .ics
  const downloadIcs = () => {
    if (!confirmedAppointment || !salon) return;
    const start = new Date(confirmedAppointment.startDateTime)
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, "");
    const end = new Date(confirmedAppointment.endDateTime)
      .toISOString()
      .replace(/-|:|\.\d\d\d/g, "");

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//DIKIDI UZ//Online Booking//RU
BEGIN:VEVENT
UID:${confirmedAppointment.id}@dikidi.uz
DTSTAMP:${start}
DTSTART:${start}
DTEND:${end}
SUMMARY:${confirmedAppointment.service.nameRu} - ${salon.name}
DESCRIPTION:Запись в ${salon.name}. Мастер: ${confirmedAppointment.staff.fullName}. Стоимость: ${confirmedAppointment.price} UZS
LOCATION:${salon.address}, ${salon.city}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `booking-${confirmedAppointment.id.slice(0, 8)}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 max-w-5xl mx-auto px-4 py-12 w-full space-y-6">
          <div className="w-full h-64 bg-white rounded-3xl animate-pulse" />
          <div className="w-full h-96 bg-white rounded-3xl animate-pulse" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-neutral-200/80 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto text-neutral-800">
              <Scissors className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900">Заведение не найдено</h2>
            <p className="text-xs text-neutral-500">
              Возможно, ссылка устарела или салон временно приостановил прием записей.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center h-10 px-5 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
            >
              Вернуться в каталог
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Фильтрация категорий
  const displayedCategories =
    selectedCategory === "all"
      ? salon.categories
      : salon.categories.filter((c) => c.id === selectedCategory);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#111111] flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
      {/* 1. ЕДИНЫЙ NAVBAR */}
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full space-y-8">
        {/* 2. ШАПКА ЗАВЕДЕНИЯ (HERO SHOWCASE) */}
        <section className="bg-white rounded-3xl border border-black/[0.06] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          {/* Обложка / градиент */}
          <div className="h-36 sm:h-52 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-950 relative p-6 flex items-end">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative z-10 flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md text-white border border-white/20 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Проверенный партнер DIKIDI</span>
              </span>
            </div>
          </div>

          {/* Инфо-блок заведения */}
          <div className="p-6 sm:p-8 relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4 sm:gap-5">
                {/* Логотип заведения */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 -mt-12 sm:-mt-16 rounded-2xl bg-white border-2 border-white shadow-lg flex items-center justify-center font-black text-2xl sm:text-3xl text-neutral-900 shrink-0">
                  {salon.name.slice(0, 2).toUpperCase()}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-950">
                      {salon.name}
                    </h1>
                  </div>

                  <p className="text-xs sm:text-sm text-neutral-600 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span>{salon.city}, {salon.address}</span>
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-xs">
                    <div className="flex items-center gap-1 font-bold text-neutral-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/70">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{salon.rating.toFixed(1)}</span>
                      <span className="text-neutral-500 font-normal">
                        ({salon.reviewCount || 12} отзывов)
                      </span>
                    </div>
                    <span className="text-neutral-300">·</span>
                    <span className="text-neutral-500">Пн-Вс: 10:00 – 21:00</span>
                  </div>
                </div>
              </div>

              {/* Главный CTA: Онлайн-запись */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsBookingOpen(true);
                    setStep(1);
                  }}
                  className="w-full sm:w-auto h-12 px-8 rounded-2xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Записаться онлайн</span>
                </button>
              </div>
            </div>

            {/* Вкладки: Услуги / Мастера / О салоне */}
            <div className="flex items-center gap-2 border-b border-neutral-100 mt-8 -mb-2">
              <button
                type="button"
                onClick={() => setActiveTab("services")}
                className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "services"
                    ? "border-neutral-950 text-neutral-950"
                    : "border-transparent text-neutral-400 hover:text-neutral-700"
                }`}
              >
                <Scissors className="w-4 h-4" />
                <span>Услуги и цены</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-100 text-neutral-700">
                  {salon.categories.reduce((acc, c) => acc + c.services.length, 0)}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("staff")}
                className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "staff"
                    ? "border-neutral-950 text-neutral-950"
                    : "border-transparent text-neutral-400 hover:text-neutral-700"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Мастера</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-100 text-neutral-700">
                  {salon.staff.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("about")}
                className={`pb-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === "about"
                    ? "border-neutral-950 text-neutral-950"
                    : "border-transparent text-neutral-400 hover:text-neutral-700"
                }`}
              >
                <Info className="w-4 h-4" />
                <span>О заведении и контакты</span>
              </button>
            </div>
          </div>
        </section>

        {/* 3. КОНТЕНТ ВКЛАДОК */}
        {/* ВКЛАДКА 1: УСЛУГИ */}
        {activeTab === "services" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              {/* Категории фильтр */}
              {salon.categories.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className={`h-9 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === "all"
                        ? "bg-neutral-950 text-white shadow-sm"
                        : "bg-white border border-neutral-200/80 text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    Все услуги
                  </button>
                  {salon.categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategory(c.id)}
                      className={`h-9 px-4 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedCategory === c.id
                          ? "bg-neutral-950 text-white shadow-sm"
                          : "bg-white border border-neutral-200/80 text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      {c.nameRu}
                    </button>
                  ))}
                </div>
              )}

              {/* Список услуг по категориям */}
              <div className="space-y-6">
                {displayedCategories.map((cat) => (
                  <div key={cat.id} className="bg-white rounded-3xl p-6 border border-black/[0.06] shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-neutral-950 uppercase tracking-wider text-neutral-500">
                      {cat.nameRu}
                    </h3>
                    <div className="divide-y divide-neutral-100">
                      {cat.services.map((srv) => (
                        <div
                          key={srv.id}
                          className="py-4 first:pt-0 last:pb-0 flex items-start sm:items-center justify-between gap-4 group"
                        >
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-neutral-900 group-hover:text-neutral-950 transition-colors">
                              {srv.nameRu}
                            </h4>
                            {srv.description && (
                              <p className="text-xs text-neutral-500 max-w-md leading-relaxed">
                                {srv.description}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-medium">
                              <Clock className="w-3 h-3" />
                              <span>{srv.durationMinutes} мин</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                              <span className="text-sm font-black text-neutral-950">
                                {formatUZS(srv.price)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStartBookingService(srv)}
                              className="h-9 px-4 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs transition-all shadow-sm active:scale-95"
                            >
                              Выбрать
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Боковая карточка контактов и преимуществ */}
            <div className="space-y-5 lg:sticky lg:top-24">
              <div className="bg-white rounded-3xl p-6 border border-black/[0.06] shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-neutral-950">
                  Информация о визите
                </h3>
                <div className="space-y-3 text-xs text-neutral-600">
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span>{formatPhoneUZ(salon.phone)}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span>{salon.address}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span>Ежедневно с 10:00 до 21:00</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsBookingOpen(true);
                      setStep(1);
                    }}
                    className="w-full h-11 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    <span>Выбрать время онлайн</span>
                  </button>
                </div>
              </div>

              {/* Удобства */}
              <div className="bg-white rounded-3xl p-6 border border-black/[0.06] shadow-sm space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Удобства заведения
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-neutral-700">
                  <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-xl">
                    <Wifi className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Wi-Fi</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-xl">
                    <Coffee className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Кофе / Чай</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-xl">
                    <CreditCard className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Click / Payme</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-neutral-50 rounded-xl">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Гарантия</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ВКЛАДКА 2: МАСТЕРА */}
        {activeTab === "staff" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {salon.staff.map((master) => (
              <div
                key={master.id}
                className="bg-white rounded-3xl p-6 border border-black/[0.06] shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-white flex items-center justify-center font-bold text-base shrink-0">
                      {master.fullName.slice(0, 1)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-950">
                        {master.fullName}
                      </h4>
                      <p className="text-xs text-neutral-500 font-medium">
                        {master.specialty}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-neutral-700 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-bold">{master.rating.toFixed(1)}</span>
                    <span className="text-neutral-400">· {master.reviewCount} отзывов</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartBookingStaff(master)}
                  className="w-full h-10 rounded-xl bg-neutral-100 hover:bg-neutral-950 hover:text-white text-neutral-900 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Записаться к мастеру</span>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ВКЛАДКА 3: О ЗАВЕДЕНИИ */}
        {activeTab === "about" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-black/[0.06] shadow-sm space-y-6">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-neutral-950">
                О заведении {salon.name}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-2xl">
                {salon.description ||
                  `Добро пожаловать в ${salon.name}! Мы предлагаем премиальный уровень сервиса, профессиональных мастеров и индивидуальный подход к каждому гостю в Ташкенте.`}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-100">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Адрес
                </span>
                <p className="text-sm font-bold text-neutral-900">
                  {salon.city}, {salon.address}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Контакты
                </span>
                <p className="text-sm font-bold text-neutral-900">
                  {formatPhoneUZ(salon.phone)}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. МОДАЛЬНОЕ ОКНО ОНЛАЙН-ЗАПИСИ (POPUP WIZARD) */}
      <AnimatePresence>
        {isBookingOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-black/[0.08]"
            >
              {/* Шапка модального окна */}
              <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-white shrink-0">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-bold text-neutral-950">
                    {step === 5 ? "Запись оформлена" : `Онлайн-запись · ${salon.name}`}
                  </h3>
                  {step < 5 && (
                    <p className="text-[11px] text-neutral-500">
                      Шаг {step} из 4:{" "}
                      {step === 1
                        ? "Выбор услуги"
                        : step === 2
                        ? "Выбор специалиста"
                        : step === 3
                        ? "Дата и время"
                        : "Ваши данные"}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsBookingOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Прогресс-бар */}
              {step < 5 && (
                <div className="flex h-1 bg-neutral-100 shrink-0">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className={`flex-1 transition-all duration-300 ${
                        step >= s ? "bg-neutral-950" : "bg-transparent"
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Тело модалки */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                {/* ШАГ 1: ВЫБОР УСЛУГИ */}
                {step === 1 && (
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Выберите желаемую процедуру
                    </p>
                    <div className="space-y-2">
                      {salon.categories.map((c) =>
                        c.services.map((srv) => {
                          const isSelected = selectedService?.id === srv.id;
                          return (
                            <div
                              key={srv.id}
                              onClick={() => setSelectedService(srv)}
                              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                isSelected
                                  ? "border-neutral-950 bg-neutral-50 shadow-sm"
                                  : "border-neutral-200/80 bg-white hover:border-neutral-300"
                              }`}
                            >
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-neutral-900">
                                  {srv.nameRu}
                                </p>
                                <span className="text-[11px] text-neutral-400">
                                  {srv.durationMinutes} мин
                                </span>
                              </div>
                              <div className="flex items-center gap-2.5">
                                <span className="text-xs font-bold text-neutral-950">
                                  {formatUZS(srv.price)}
                                </span>
                                <div
                                  className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                                    isSelected
                                      ? "bg-neutral-950 border-neutral-950 text-white"
                                      : "border-neutral-300"
                                  }`}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5" />}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* ШАГ 2: ВЫБОР МАСТЕРА */}
                {step === 2 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                      Выберите мастера
                    </p>

                    {/* Любой мастер */}
                    <div
                      onClick={() => setSelectedStaff("any")}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        selectedStaff === "any"
                          ? "border-neutral-950 bg-neutral-50 shadow-sm"
                          : "border-neutral-200/80 bg-white hover:border-neutral-300"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-neutral-100 flex items-center justify-center font-bold text-xs text-neutral-700">
                          ★
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-950">Любой свободный мастер</p>
                          <p className="text-[11px] text-neutral-500">Ближайшее доступное время</p>
                        </div>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                          selectedStaff === "any"
                            ? "bg-neutral-950 border-neutral-950 text-white"
                            : "border-neutral-300"
                        }`}
                      >
                        {selectedStaff === "any" && <Check className="w-2.5 h-2.5" />}
                      </div>
                    </div>

                    {salon.staff.map((m) => {
                      const isSelected = selectedStaff !== "any" && selectedStaff.id === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => setSelectedStaff(m)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "border-neutral-950 bg-neutral-50 shadow-sm"
                              : "border-neutral-200/80 bg-white hover:border-neutral-300"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center font-bold text-xs">
                              {m.fullName.slice(0, 1)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-neutral-950">{m.fullName}</p>
                              <p className="text-[11px] text-neutral-500">{m.specialty}</p>
                            </div>
                          </div>
                          <div
                            className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                              isSelected
                                ? "bg-neutral-950 border-neutral-950 text-white"
                                : "border-neutral-300"
                            }`}
                          >
                            {isSelected && <Check className="w-2.5 h-2.5" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ШАГ 3: ДАТА И ВРЕМЯ */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                        Выберите дату
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {daysList.map((item) => {
                          const isSelected = selectedDate === item.dateStr;
                          return (
                            <button
                              key={item.dateStr}
                              type="button"
                              onClick={() => setSelectedDate(item.dateStr)}
                              className={`flex flex-col items-center justify-center min-w-[54px] py-2 px-1.5 rounded-xl border transition-all ${
                                isSelected
                                  ? "border-neutral-950 bg-neutral-950 text-white shadow-sm"
                                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300"
                              }`}
                            >
                              <span className="text-[9px] uppercase font-bold opacity-70">
                                {item.dayOfWeek}
                              </span>
                              <span className="text-sm font-black my-0.5">{item.dayNum}</span>
                              <span className="text-[9px] uppercase opacity-70">{item.month}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                          Доступное время
                        </p>
                        {loadingSlots && (
                          <span className="text-[11px] text-neutral-400 animate-pulse">
                            Поиск слотов...
                          </span>
                        )}
                      </div>

                      {!loadingSlots && availableSlots.length === 0 ? (
                        <div className="bg-neutral-50 rounded-2xl p-5 text-center border border-neutral-200/60">
                          <p className="text-xs font-semibold text-neutral-700">
                            Все слоты заняты
                          </p>
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            Пожалуйста, выберите другой день
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2">
                          {availableSlots.map((t) => {
                            const isSelected = selectedTime === t;
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setSelectedTime(t)}
                                className={`py-2 px-1 rounded-xl text-center text-xs font-bold transition-all border ${
                                  isSelected
                                    ? "bg-neutral-950 border-neutral-950 text-white shadow-sm"
                                    : "bg-white border-neutral-200 text-neutral-800 hover:border-neutral-400"
                                }`}
                              >
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ШАГ 4: КОНТАКТЫ */}
                {step === 4 && (
                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    {/* Сводка */}
                    <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200/70 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Услуга:</span>
                        <span className="font-bold text-neutral-900">{selectedService?.nameRu}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Мастер:</span>
                        <span className="font-bold text-neutral-900">
                          {selectedStaff === "any" ? "Любой мастер" : selectedStaff.fullName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Время:</span>
                        <span className="font-bold text-neutral-900">{selectedDate} в {selectedTime}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-neutral-200/60">
                        <span className="font-semibold text-neutral-700">Итого:</span>
                        <span className="font-black text-neutral-950">
                          {formatUZS(selectedService?.price || 0)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Ваше имя
                        </label>
                        <input
                          type="text"
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Азиз"
                          className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Номер телефона
                        </label>
                        <input
                          type="tel"
                          required
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="+998 90 123-45-67"
                          className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-800 mb-1">
                          Комментарий к визиту
                        </label>
                        <input
                          type="text"
                          value={clientComment}
                          onChange={(e) => setClientComment(e.target.value)}
                          placeholder="Пожелания мастеру..."
                          className="w-full h-11 px-3.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900"
                        />
                      </div>
                    </div>

                    {errorMsg && (
                      <p className="text-xs font-bold text-rose-600">{errorMsg}</p>
                    )}
                  </form>
                )}

                {/* ШАГ 5: УСПЕХ */}
                {step === 5 && confirmedAppointment && (
                  <div className="space-y-5 text-center py-2">
                    <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
                      <Check className="w-7 h-7" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-neutral-950">
                        Вы успешно записаны!
                      </h4>
                      <p className="text-xs text-neutral-500">
                        Ждем вас в {salon.name} на {selectedDate} в {selectedTime}
                      </p>
                    </div>

                    <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200/80 text-left space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Услуга:</span>
                        <span className="font-bold text-neutral-900">{confirmedAppointment.service.nameRu}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Мастер:</span>
                        <span className="font-bold text-neutral-900">{confirmedAppointment.staff.fullName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Стоимость:</span>
                        <span className="font-black text-neutral-950">{formatUZS(confirmedAppointment.price)}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={downloadIcs}
                        className="w-full h-11 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <CalendarPlus className="w-4 h-4" />
                        <span>Добавить в календарь (.ics)</span>
                      </button>

                      <Link
                        href="/my-bookings"
                        className="w-full h-11 rounded-xl border border-neutral-200 text-neutral-800 hover:bg-neutral-100 text-xs font-bold flex items-center justify-center transition-colors"
                      >
                        Перейти в Мои записи
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Нижняя панель действий модалки */}
              {step < 5 && (
                <div className="p-4 border-t border-neutral-100 flex items-center justify-between gap-3 bg-white shrink-0">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="h-10 px-4 rounded-xl border border-neutral-200 text-neutral-700 text-xs font-semibold hover:bg-neutral-50 transition-colors flex items-center gap-1"
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
                      className={`h-10 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        selectedService
                          ? "bg-neutral-950 text-white hover:bg-neutral-800 shadow-sm"
                          : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                      }`}
                    >
                      <span>Выбрать мастера</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  {step === 2 && (
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="h-10 px-5 rounded-xl bg-neutral-950 text-white text-xs font-bold hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Выбрать дату и время</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  {step === 3 && (
                    <button
                      type="button"
                      disabled={!selectedTime}
                      onClick={() => setStep(4)}
                      className={`h-10 px-5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        selectedTime
                          ? "bg-neutral-950 text-white hover:bg-neutral-800 shadow-sm"
                          : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                      }`}
                    >
                      <span>Ввести контакты</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  {step === 4 && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleBookingSubmit}
                      className="h-10 px-6 rounded-xl bg-neutral-950 text-white text-xs font-bold hover:bg-neutral-800 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      <span>{submitting ? "Бронирование..." : "Подтвердить запись"}</span>
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. ЕДИНЫЙ FOOTER */}
      <Footer />
    </div>
  );
}
