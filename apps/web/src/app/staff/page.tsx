"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Scissors,
  Calendar,
  Clock,
  User,
  Phone,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  Coffee,
  Check,
  ArrowLeft,
  LogOut,
  Save,
} from "lucide-react";
import { formatUZS, formatPhoneUZ, formatTashkentTime } from "@/lib/utils";

const DAYS_OF_WEEK = [
  { day: 1, label: "Понедельник", short: "Пн" },
  { day: 2, label: "Вторник", short: "Вт" },
  { day: 3, label: "Среда", short: "Ср" },
  { day: 4, label: "Четверг", short: "Чт" },
  { day: 5, label: "Пятница", short: "Пт" },
  { day: 6, label: "Суббота", short: "Сб" },
  { day: 0, label: "Воскресенье", short: "Вс" },
];

export default function StaffPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<"day" | "schedule" | "earnings">("day");

  // Мастера и выбор
  const [salons, setSalons] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [staffData, setStaffData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Выбранная дата для записей
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [appointments, setAppointments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalAppointments: 0,
    completedAppointments: 0,
    totalRevenue: 0,
    commissionPercent: 40,
    staffEarnings: 0,
  });

  // Расписание мастера (7 дней)
  const [schedules, setSchedules] = useState<any[]>([]);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  // Заметки о клиенте
  const [editingNotesCustomer, setEditingNotesCustomer] = useState<any | null>(null);
  const [clientNotesText, setClientNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("dikidi_user");
    localStorage.removeItem("dikidi_user_phone");
    localStorage.removeItem("dikidi_staff_id");
    document.cookie = "dikidi_user_id=; path=/; max-age=0";
    document.cookie = "dikidi_user_phone=; path=/; max-age=0";
    router.push("/login");
  };

  // 1. Проверка авторизации и загрузка данных
  useEffect(() => {
    async function loadInitialData() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meData = await meRes.json();

        if (!meData.user) {
          router.push("/login?redirect=/staff");
          return;
        }

        const user = meData.user;
        setCurrentUser(user);
        localStorage.setItem("dikidi_user", JSON.stringify(user));

        const isMaster = user.role === "MASTER" || Boolean(user.staffProfile);
        const isOwner = user.role === "OWNER" || (user.ownedSalons && user.ownedSalons.length > 0);

        if (!isMaster && !isOwner) {
          // Обычный клиент не имеет доступа к кабинету мастера
          router.push("/");
          return;
        }

        setIsAuthorized(true);

        const res = await fetch("/api/salons");
        const data = await res.json();
        if (data.salons && data.salons.length > 0) {
          setSalons(data.salons);

          // Если у пользователя есть привязанный профиль мастера — жестко закрепляем его
          if (user.staffProfile?.id) {
            setSelectedStaffId(user.staffProfile.id);
            localStorage.setItem("dikidi_staff_id", user.staffProfile.id);
          } else {
            // Если зашел владелец салона — позволяем переключаться между своими мастерами
            const savedStaffId = localStorage.getItem("dikidi_staff_id");
            let initialStaffId = "";

            if (savedStaffId) {
              initialStaffId = savedStaffId;
            } else {
              for (const s of data.salons) {
                if (s.staff && s.staff.length > 0) {
                  initialStaffId = s.staff[0].id;
                  break;
                }
              }
            }

            if (initialStaffId) {
              setSelectedStaffId(initialStaffId);
            }
          }
        }
      } catch (err) {
        console.error("Error loading salons for staff page:", err);
        router.push("/login?redirect=/staff");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, [router]);

  // 2. Загрузка данных выбранного мастера при смене selectedStaffId или selectedDate
  const loadStaffDetails = async () => {
    if (!selectedStaffId) return;
    try {
      const res = await fetch(
        `/api/staff/${selectedStaffId}/stats?date=${selectedDate}`
      );
      const data = await res.json();
      if (res.ok) {
        setStaffData(data.staff);
        setAppointments(data.appointments || []);
        if (data.stats) setStats(data.stats);

        // Инициализируем 7 дней расписания
        const existingSchedules = data.staff.schedules || [];
        const normalized = DAYS_OF_WEEK.map((d) => {
          const found = existingSchedules.find((s: any) => s.dayOfWeek === d.day);
          const lunch = found?.breaks?.[0];
          return {
            dayOfWeek: d.day,
            label: d.label,
            short: d.short,
            isDayOff: found ? found.isDayOff : false,
            startTime: found?.startTime || "09:00",
            endTime: found?.endTime || "19:00",
            breakStart: lunch?.startTime || "13:00",
            breakEnd: lunch?.endTime || "14:00",
          };
        });
        setSchedules(normalized);
        localStorage.setItem("dikidi_staff_id", selectedStaffId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (selectedStaffId) {
      loadStaffDetails();
    }
  }, [selectedStaffId, selectedDate]);

  // Смена статуса записи
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: newStatus,
          paymentStatus: newStatus === "COMPLETED" ? "PAID" : undefined,
        }),
      });
      if (res.ok) {
        loadStaffDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Сохранение графика
  const handleSaveSchedule = async () => {
    if (!selectedStaffId) return;
    setSavingSchedule(true);
    setScheduleSuccess(false);
    try {
      const res = await fetch(`/api/staff/${selectedStaffId}/schedule`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedules: schedules.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            isDayOff: s.isDayOff,
            startTime: s.startTime,
            endTime: s.endTime,
            breakStart: s.breakStart,
            breakEnd: s.breakEnd,
          })),
        }),
      });

      if (res.ok) {
        setScheduleSuccess(true);
        setTimeout(() => setScheduleSuccess(false), 2500);
      } else {
        alert("Не удалось сохранить график");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSchedule(false);
    }
  };

  // Сохранение заметок о клиенте
  const handleSaveCustomerNotes = async () => {
    if (!editingNotesCustomer || !staffData?.salonId) return;
    setSavingNotes(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId: staffData.salonId,
          phone: editingNotesCustomer.phone,
          fullName: editingNotesCustomer.fullName,
          notes: clientNotesText,
        }),
      });
      if (res.ok) {
        setEditingNotesCustomer(null);
        setClientNotesText("");
        loadStaffDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingNotes(false);
    }
  };

  // Все мастера из всех салонов
  const allStaffList: any[] = [];
  salons.forEach((s) => {
    s.staff?.forEach((m: any) => {
      allStaffList.push({ ...m, salonName: s.name, salonSlug: s.slug });
    });
  });

  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col font-sans">
        <div className="h-14 border-b border-black/[0.06] bg-white animate-pulse" />
        <div className="max-w-4xl mx-auto px-5 py-6 w-full space-y-6">
          <div className="h-24 bg-white rounded-2xl animate-pulse" />
          <div className="h-64 bg-white rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#111111] flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
      {/* Шапка кабинета мастера */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-4xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Главная
          </Link>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-neutral-900">
              Кабинет мастера
            </span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-900">
              Staff
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {currentUser?.ownedSalons?.length > 0 && (
              <Link
                href="/dashboard"
                className="text-xs font-semibold px-3 py-1 rounded-full bg-black/[0.05] hover:bg-neutral-900 hover:text-white transition-all text-neutral-700"
              >
                В CRM
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              title="Выйти из аккаунта"
              className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto px-5 py-6 w-full space-y-6">
        {/* Карточка выбора мастера */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
              {staffData?.avatarUrl ? (
                <img
                  src={staffData.avatarUrl}
                  alt={staffData.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Scissors className="w-5 h-5 text-neutral-300" />
              )}
            </div>
            <div>
              <p className="text-base font-bold text-neutral-950">
                {staffData?.fullName || "Выберите мастера"}
              </p>
              <p className="text-xs text-neutral-500 font-medium">
                {staffData?.specialty} · {staffData?.salon?.name} · Ставка {staffData?.commissionPercent || 40}%
              </p>
            </div>
          </div>

          {!currentUser?.staffProfile && allStaffList.length > 1 ? (
            <div className="w-full sm:w-auto">
              <label className="text-[10px] uppercase font-semibold text-neutral-400 block mb-1">
                Переключить мастера:
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 border border-neutral-200 rounded-xl text-xs font-semibold bg-white text-neutral-900 focus:outline-none focus:border-neutral-900 cursor-pointer"
              >
                {allStaffList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.specialty} — {m.salonName})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="w-full sm:w-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 text-xs font-medium text-neutral-600">
                <Scissors className="w-3.5 h-3.5 text-neutral-400" />
                <span>Личный кабинет</span>
              </span>
            </div>
          )}
        </div>

        {/* Навигационные табы кабинета мастера */}
        <div className="flex border-b border-neutral-200">
          {[
            { id: "day", label: "Мой день (Записи)", icon: Calendar },
            { id: "schedule", label: "Мой график работы", icon: Clock },
            { id: "earnings", label: "Мой заработок", icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  isActive
                    ? "border-neutral-900 text-neutral-900"
                    : "border-transparent text-neutral-400 hover:text-neutral-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ===================== ВКЛАДКА 1: МОЙ ДЕНЬ ===================== */}
        {activeTab === "day" && (
          <div className="space-y-4">
            {/* Переключатель даты */}
            <div className="bg-white p-3.5 rounded-2xl border border-black/[0.08] flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-neutral-500">Дата:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1 border border-neutral-200 rounded-lg text-xs font-medium bg-white text-neutral-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const today = new Date();
                    const yyyy = today.getFullYear();
                    const mm = String(today.getMonth() + 1).padStart(2, "0");
                    const dd = String(today.getDate()).padStart(2, "0");
                    setSelectedDate(`${yyyy}-${mm}-${dd}`);
                  }}
                  className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-medium transition-colors"
                >
                  Сегодня
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + 1);
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, "0");
                    const dd = String(d.getDate()).padStart(2, "0");
                    setSelectedDate(`${yyyy}-${mm}-${dd}`);
                  }}
                  className="px-3 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-medium transition-colors"
                >
                  Завтра
                </button>
              </div>

              <div className="text-xs text-neutral-500 font-medium">
                Записей:{" "}
                <strong className="text-neutral-900">{appointments.length}</strong>
              </div>
            </div>

            {/* Список записей к мастеру */}
            {appointments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-black/[0.08] p-10 text-center space-y-2">
                <Scissors className="w-8 h-8 text-neutral-300 mx-auto" />
                <p className="text-sm font-semibold text-neutral-900">
                  На этот день у вас нет записей
                </p>
                <p className="text-xs text-neutral-500">
                  Отдыхайте или проверьте расписание на другие дни
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => {
                  const startTime = formatTashkentTime(appt.startDateTime);
                  const endTime = formatTashkentTime(appt.endDateTime);

                  return (
                    <div
                      key={appt.id}
                      className="bg-white p-4 sm:p-5 rounded-2xl border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="px-3 py-1.5 bg-neutral-900 text-white rounded-xl text-center shrink-0">
                            <span className="block text-xs font-bold">{startTime}</span>
                            <span className="block text-[10px] text-neutral-400">{endTime}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-neutral-950">
                                {appt.clientName}
                              </span>
                              <a
                                href={`tel:${appt.clientPhone}`}
                                className="text-neutral-400 hover:text-neutral-900"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                            </div>
                            <span className="text-xs text-neutral-500">
                              {formatPhoneUZ(appt.clientPhone)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex sm:flex-col items-center sm:items-end justify-between">
                          <span className="text-xs font-bold text-neutral-900">
                            {formatUZS(appt.price)}
                          </span>
                          <span className="text-[11px] text-neutral-500">
                            Ваша выплата:{" "}
                            <strong className="text-emerald-700 font-semibold">
                              {formatUZS(
                                Math.round(
                                  (appt.price * (staffData?.commissionPercent || 40)) / 100
                                )
                              )}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="bg-neutral-50 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div>
                          <span className="font-semibold text-neutral-900">
                            {appt.service.nameRu}
                          </span>
                          <span className="text-neutral-400 ml-2">
                            ({appt.service.durationMinutes} мин)
                          </span>
                        </div>

                        {appt.customer?.notes && (
                          <div className="text-neutral-600 italic bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                            Заметка: {appt.customer.notes}
                          </div>
                        )}
                      </div>

                      {/* Кнопки управления статусом записи мастера */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingNotesCustomer({
                              fullName: appt.clientName,
                              phone: appt.clientPhone,
                              notes: appt.customer?.notes || "",
                            });
                            setClientNotesText(appt.customer?.notes || "");
                          }}
                          className="text-[11px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
                        >
                          {appt.customer?.notes ? "Редактировать заметку" : "+ Заметка о клиенте"}
                        </button>

                        <div className="flex items-center gap-2">
                          {appt.status !== "IN_PROGRESS" && appt.status !== "COMPLETED" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(appt.id, "IN_PROGRESS")}
                              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Клиент в кресле
                            </button>
                          )}

                          {appt.status !== "COMPLETED" && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(appt.id, "COMPLETED")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                            >
                              Завершить визит
                            </button>
                          )}

                          {appt.status === "COMPLETED" && (
                            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Визит завершен
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== ВКЛАДКА 2: МОЙ ГРАФИК РАБОТЫ ===================== */}
        {activeTab === "schedule" && (
          <div className="bg-white p-5 rounded-2xl border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Недельный график смен и перерывов
                </h3>
                <p className="text-xs text-neutral-500">
                  Настройте ваши рабочие часы и обед для генерации свободных слотов в онлайн-записи
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveSchedule}
                disabled={savingSchedule}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                {savingSchedule ? (
                  "Сохранение..."
                ) : scheduleSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Сохранено!
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> Сохранить график
                  </>
                )}
              </button>
            </div>

            <div className="divide-y divide-neutral-100">
              {schedules.map((item, idx) => (
                <div
                  key={item.dayOfWeek}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 w-40">
                    <button
                      type="button"
                      onClick={() => {
                        const next = [...schedules];
                        next[idx].isDayOff = !next[idx].isDayOff;
                        setSchedules(next);
                      }}
                      className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                        !item.isDayOff ? "bg-neutral-900" : "bg-neutral-200"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          !item.isDayOff ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <div>
                      <span className="text-xs font-semibold text-neutral-900 block">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {item.isDayOff ? "Выходной" : "Рабочий день"}
                      </span>
                    </div>
                  </div>

                  {!item.isDayOff ? (
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-neutral-500 text-[11px]">Смена:</span>
                        <input
                          type="time"
                          value={item.startTime}
                          onChange={(e) => {
                            const next = [...schedules];
                            next[idx].startTime = e.target.value;
                            setSchedules(next);
                          }}
                          className="px-2 py-1 border border-neutral-200 rounded-lg text-xs bg-white"
                        />
                        <span className="text-neutral-400">—</span>
                        <input
                          type="time"
                          value={item.endTime}
                          onChange={(e) => {
                            const next = [...schedules];
                            next[idx].endTime = e.target.value;
                            setSchedules(next);
                          }}
                          className="px-2 py-1 border border-neutral-200 rounded-lg text-xs bg-white"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Coffee className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="text-neutral-500 text-[11px]">Обед:</span>
                        <input
                          type="time"
                          value={item.breakStart}
                          onChange={(e) => {
                            const next = [...schedules];
                            next[idx].breakStart = e.target.value;
                            setSchedules(next);
                          }}
                          className="px-2 py-1 border border-neutral-200 rounded-lg text-xs bg-white"
                        />
                        <span className="text-neutral-400">—</span>
                        <input
                          type="time"
                          value={item.breakEnd}
                          onChange={(e) => {
                            const next = [...schedules];
                            next[idx].breakEnd = e.target.value;
                            setSchedules(next);
                          }}
                          className="px-2 py-1 border border-neutral-200 rounded-lg text-xs bg-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-neutral-400 italic">Смена отключена</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== ВКЛАДКА 3: МОЙ ЗАРАБОТОК ===================== */}
        {activeTab === "earnings" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-black/[0.08] shadow-sm space-y-1">
                <span className="text-xs font-medium text-neutral-500">
                  Мой чистый доход за {selectedDate}
                </span>
                <p className="text-2xl font-bold text-emerald-700 tracking-tight">
                  {formatUZS(stats.staffEarnings)}
                </p>
                <p className="text-[11px] text-neutral-400">
                  Ставка: {stats.commissionPercent}% от суммы услуг
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-black/[0.08] shadow-sm space-y-1">
                <span className="text-xs font-medium text-neutral-500">
                  Касса выполненных услуг
                </span>
                <p className="text-2xl font-bold text-neutral-900 tracking-tight">
                  {formatUZS(stats.totalRevenue)}
                </p>
                <p className="text-[11px] text-neutral-400">
                  Завершено визитов: {stats.completedAppointments} из {stats.totalAppointments}
                </p>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-black/[0.08] shadow-sm space-y-1">
                <span className="text-xs font-medium text-neutral-500">
                  Рейтинг специалиста
                </span>
                <p className="text-2xl font-bold text-amber-500 tracking-tight flex items-center gap-1">
                  ★ {staffData?.rating || 5.0}
                </p>
                <p className="text-[11px] text-neutral-400">
                  Всего отзывов: {staffData?.reviewCount || 0}
                </p>
              </div>
            </div>

            {/* Детализация записей дня */}
            <div className="bg-white p-5 rounded-2xl border border-black/[0.08] shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-neutral-900">
                Детализация начислений за день
              </h3>

              {appointments.filter((a) => a.status === "COMPLETED" || a.paymentStatus === "PAID").length === 0 ? (
                <p className="text-xs text-neutral-400 py-3 text-center">
                  Пока нет завершенных визитов за этот день
                </p>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {appointments
                    .filter((a) => a.status === "COMPLETED" || a.paymentStatus === "PAID")
                    .map((a) => (
                      <div key={a.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-neutral-900 block">
                            {a.service.nameRu} · {a.clientName}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            {formatTashkentTime(a.startDateTime)} · {a.paymentMethod}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-neutral-500 block">
                            Чек: {formatUZS(a.price)}
                          </span>
                          <span className="font-bold text-emerald-700">
                            + {formatUZS(Math.round((a.price * stats.commissionPercent) / 100))}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ ЗАМЕТКИ О КЛИЕНТЕ */}
      {editingNotesCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-neutral-900">
                Заметка о госте: {editingNotesCustomer.fullName}
              </h3>
              <p className="text-xs text-neutral-500">
                {formatPhoneUZ(editingNotesCustomer.phone)}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">
                Пожелания, длина насадок, напиток, аллергии:
              </label>
              <textarea
                value={clientNotesText}
                onChange={(e) => setClientNotesText(e.target.value)}
                rows={3}
                placeholder="Например: Стричь насадкой 3мм по бокам, ножницами сверху, кофе с сахаром"
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingNotesCustomer(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSaveCustomerNotes}
                disabled={savingNotes}
                className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {savingNotes ? "Сохранение..." : "Сохранить заметку"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
