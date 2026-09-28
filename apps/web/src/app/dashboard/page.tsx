"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Users,
  Scissors,
  DollarSign,
  Settings,
  Plus,
  Search,
  Phone,
  Send,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Banknote,
  LogOut,
  Building2,
  Check,
} from "lucide-react";
import {
  formatUZS,
  formatPhoneUZ,
  formatTashkentTime,
} from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"journal" | "clients" | "services" | "finance" | "settings">("journal");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [salonsList, setSalonsList] = useState<any[]>([]);
  const [currentSalonSlug, setCurrentSalonSlug] = useState<string>("");

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [salon, setSalon] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStaff, setFilterStaff] = useState<string>("all");

  // Модалка деталей записи
  const [activeAppointment, setActiveAppointment] = useState<any | null>(null);

  // Модалка создания новой записи вручную
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("+998 ");
  const [newServiceId, setNewServiceId] = useState("");
  const [newStaffId, setNewStaffId] = useState("");
  const [newTime, setNewTime] = useState("12:00");
  const [newComment, setNewComment] = useState("");
  const [addingAppointment, setAddingAppointment] = useState(false);

  // Поиск по клиентам
  const [clientSearch, setClientSearch] = useState("");

  // Копирование ссылки
  const [copiedLink, setCopiedLink] = useState(false);

  // 1. Инициализация пользователя и доступных салонов
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("dikidi_user");
      if (stored) {
        try {
          const u = JSON.parse(stored);
          setCurrentUser(u);
        } catch (e) {
          console.error(e);
        }
      }
    }

    // Загрузка списка салонов
    async function loadSalons() {
      try {
        const res = await fetch("/api/salons");
        const data = await res.json();
        if (data.salons && data.salons.length > 0) {
          setSalonsList(data.salons);
          // Определяем slug: из URL params или первого салона
          const urlParams = new URLSearchParams(window.location.search);
          const slugParam = urlParams.get("salon");
          const targetSlug = slugParam || data.salons[0].slug;
          setCurrentSalonSlug(targetSlug);
        }
      } catch (err) {
        console.error("Error loading salons list:", err);
      }
    }

    loadSalons();
  }, []);

  // 2. Загрузка данных конкретного салона при смене slug
  useEffect(() => {
    if (!currentSalonSlug) return;

    async function loadSalonData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/salons/${currentSalonSlug}`);
        const data = await res.json();
        if (data.salon) {
          setSalon(data.salon);
          if (data.salon.services?.length > 0) setNewServiceId(data.salon.services[0].id);
          if (data.salon.staff?.length > 0) setNewStaffId(data.salon.staff[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadSalonData();
  }, [currentSalonSlug]);

  // 3. Загрузка записей на выбранную дату
  const fetchAppointments = async () => {
    if (!salon) return;
    try {
      const res = await fetch(
        `/api/appointments?salonId=${salon.id}&date=${selectedDate}&staffId=${filterStaff}`
      );
      const data = await res.json();
      if (data.appointments) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (salon) {
      fetchAppointments();
    }
  }, [salon, selectedDate, filterStaff]);

  // 4. Загрузка клиентов
  const fetchCustomers = async () => {
    if (!salon) return;
    try {
      const res = await fetch(
        `/api/customers?salonId=${salon.id}&query=${encodeURIComponent(clientSearch)}`
      );
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (salon && activeTab === "clients") {
      fetchCustomers();
    }
  }, [salon, activeTab, clientSearch]);

  // Обновление статуса записи
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        fetchAppointments();
        if (activeAppointment && activeAppointment.id === id) {
          setActiveAppointment({ ...activeAppointment, status: newStatus });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Создание записи вручную
  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon || !newClientName || !newServiceId || !newStaffId) return;

    setAddingAppointment(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId: salon.id,
          staffId: newStaffId,
          serviceId: newServiceId,
          date: selectedDate,
          time: newTime,
          clientName: newClientName,
          clientPhone: newClientPhone,
          clientComment: newComment,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewClientName("");
        setNewClientPhone("+998 ");
        setNewComment("");
        fetchAppointments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingAppointment(false);
    }
  };

  // Копирование ссылки на запись
  const handleCopyLink = () => {
    if (!salon) return;
    const url = `${window.location.origin}/b/${salon.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Выход из системы
  const handleLogout = () => {
    localStorage.removeItem("dikidi_user");
    document.cookie = "dikidi_user_id=; path=/; max-age=0";
    document.cookie = "dikidi_user_phone=; path=/; max-age=0";
    router.push("/login");
  };

  // Статус бейдж в Apple-стилистике
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-900 text-white">
            Подтверждена
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/80">
            В процессе
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/80">
            Завершена
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200/80">
            Отменена
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200/80">
            Новая заявка
          </span>
        );
    }
  };

  // Финансовая сводка
  const totalRevenue = appointments
    .filter((a) => a.status === "COMPLETED" || a.paymentStatus === "PAID")
    .reduce((sum, a) => sum + a.price, 0);

  const totalBookingsCount = appointments.length;

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#111111] flex flex-col md:flex-row font-sans selection:bg-neutral-900 selection:text-white">
      {/* Боковое меню навигации (Apple-minimalist Sidebar) */}
      <aside className="w-full md:w-64 bg-white border-r border-black/[0.06] flex flex-col justify-between shrink-0">
        <div>
          {/* Бренд & Лого */}
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-[-0.03em] text-neutral-900">
                DIKIDI
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-black/[0.06] text-neutral-600 tracking-wider">
                CRM
              </span>
            </Link>
          </div>

          {/* Переключатель салона */}
          {salon && (
            <div className="p-4 border-b border-neutral-100 bg-neutral-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400">
                  Заведение
                </span>
                {salonsList.length > 1 && (
                  <select
                    value={currentSalonSlug}
                    onChange={(e) => setCurrentSalonSlug(e.target.value)}
                    className="text-xs bg-transparent text-neutral-600 font-medium focus:outline-none cursor-pointer"
                  >
                    {salonsList.map((s) => (
                      <option key={s.id} value={s.slug}>
                        Сменить: {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p className="text-xs font-semibold text-neutral-900 truncate">{salon.name}</p>
              <div className="flex items-center gap-3 pt-1">
                <Link
                  href={`/b/${salon.slug}`}
                  target="_blank"
                  className="text-[11px] text-neutral-600 hover:text-neutral-900 font-medium flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3 text-neutral-400" /> Виджет записи
                </Link>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                  <span>{copiedLink ? "Скопировано" : "Ссылка"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Вкладки */}
          <nav className="p-3 space-y-1">
            {[
              { id: "journal", label: "Журнал записей", icon: Calendar },
              { id: "clients", label: "База клиентов", icon: Users },
              { id: "services", label: "Услуги и мастера", icon: Scissors },
              { id: "finance", label: "Касса и финансы", icon: DollarSign },
              { id: "settings", label: "Настройки и Telegram", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Профиль внизу */}
        <div className="p-4 border-t border-neutral-100 flex items-center justify-between gap-3">
          <div className="truncate">
            <p className="text-xs font-semibold text-neutral-900 truncate">
              {currentUser?.fullName || "Администратор"}
            </p>
            <p className="text-[11px] text-neutral-500 truncate">
              {currentUser?.phone ? formatPhoneUZ(currentUser.phone) : "+998 (90) 123-45-67"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Выйти"
            className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Основная рабочая область */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Верхняя панель */}
        <header className="bg-white border-b border-black/[0.06] px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-semibold text-neutral-900 tracking-tight">
              {activeTab === "journal" && "Журнал записей"}
              {activeTab === "clients" && "База клиентов"}
              {activeTab === "services" && "Услуги и сотрудники"}
              {activeTab === "finance" && "Финансы и выручка"}
              {activeTab === "settings" && "Настройки и Telegram"}
            </h1>
            <p className="text-xs text-neutral-500">
              {activeTab === "journal" && "Расписание и бронирования на выбранную дату"}
              {activeTab === "clients" && "История визитов, контакты и заметки"}
              {activeTab === "services" && "Прайс-лист в сумах UZS и карточки специалистов"}
              {activeTab === "finance" && "Выручка за день и разбивка по способам оплаты"}
              {activeTab === "settings" && "Telegram-бот, ссылка для Instagram и параметры"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "journal" && (
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="h-9 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Добавить запись
              </button>
            )}
            {salon && (
              <Link
                href={`/b/${salon.slug}`}
                target="_blank"
                className="h-9 px-3.5 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> Виджет
              </Link>
            )}
          </div>
        </header>

        {/* Содержимое вкладок */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* ВКЛАДКА 1: ЖУРНАЛ ЗАПИСЕЙ */}
          {activeTab === "journal" && (
            <div className="space-y-6">
              {/* Фильтры даты и мастера */}
              <div className="bg-white p-4 rounded-2xl border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-neutral-500">Дата:</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-1.5 border border-neutral-200/80 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900 bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const today = new Date();
                      const yyyy = today.getFullYear();
                      const mm = String(today.getMonth() + 1).padStart(2, "0");
                      const dd = String(today.getDate()).padStart(2, "0");
                      setSelectedDate(`${yyyy}-${mm}-${dd}`);
                    }}
                    className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-medium transition-colors"
                  >
                    Сегодня
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-neutral-500">Мастер:</span>
                  <select
                    value={filterStaff}
                    onChange={(e) => setFilterStaff(e.target.value)}
                    className="px-3 py-1.5 border border-neutral-200/80 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900 bg-white"
                  >
                    <option value="all">Все мастера</option>
                    {salon?.staff?.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Список записей */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-neutral-500 px-1">
                  <span>Записей на выбранный день: {appointments.length}</span>
                  <span>
                    Выручка:{" "}
                    <span className="text-neutral-900 font-semibold">{formatUZS(totalRevenue)}</span>
                  </span>
                </div>

                {appointments.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-black/[0.08] p-12 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-neutral-900">На этот день записей нет</p>
                    <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                      Вы можете записать клиента вручную или отправить ссылку на виджет в Instagram.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowAddModal(true)}
                      className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-neutral-800 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Записать первого клиента
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {appointments.map((appt) => {
                      const startTime = formatTashkentTime(appt.startDateTime);
                      const endTime = formatTashkentTime(appt.endDateTime);

                      return (
                        <div
                          key={appt.id}
                          onClick={() => setActiveAppointment(appt)}
                          className="bg-white p-5 rounded-2xl border border-black/[0.08] hover:border-neutral-400 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all cursor-pointer flex flex-col justify-between gap-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="px-2.5 py-1.5 bg-neutral-900 text-white rounded-xl text-center shrink-0">
                                <span className="block text-xs font-bold">{startTime}</span>
                                <span className="block text-[10px] text-neutral-400">{endTime}</span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-neutral-900">{appt.clientName}</p>
                                <p className="text-xs text-neutral-500 font-medium">
                                  {formatPhoneUZ(appt.clientPhone)}
                                </p>
                              </div>
                            </div>
                            <div>{renderStatusBadge(appt.status)}</div>
                          </div>

                          <div className="border-t border-neutral-100 pt-3 flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <span className="font-medium text-neutral-800">{appt.service.nameRu}</span>
                              <p className="text-neutral-400 text-[11px]">Мастер: {appt.staff.fullName}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-semibold text-neutral-900">
                                {formatUZS(appt.price)}
                              </span>
                              <span className="block text-[10px] text-neutral-400">
                                {appt.paymentStatus === "PAID" ? "Оплачено" : "Не оплачено"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ВКЛАДКА 2: КЛИЕНТСКАЯ БАЗА */}
          {activeTab === "clients" && (
            <div className="space-y-4">
              {/* Поиск */}
              <div className="bg-white p-3 rounded-2xl border border-black/[0.08] flex items-center gap-3 shadow-sm">
                <Search className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
                <input
                  type="text"
                  placeholder="Поиск по имени, номеру телефона +998... или заметкам"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full text-xs font-medium text-neutral-900 focus:outline-none bg-transparent"
                />
              </div>

              {/* Список клиентов */}
              <div className="bg-white rounded-2xl border border-black/[0.08] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50/70 border-b border-neutral-100 text-neutral-400 uppercase tracking-wider text-[10px] font-semibold">
                    <tr>
                      <th className="px-5 py-3.5">Клиент</th>
                      <th className="px-5 py-3.5">Телефон</th>
                      <th className="px-5 py-3.5 text-center">Визитов</th>
                      <th className="px-5 py-3.5 text-right">Потрачено всего</th>
                      <th className="px-5 py-3.5">Заметки мастера</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-neutral-900">{c.fullName}</td>
                        <td className="px-5 py-3.5 text-neutral-700 font-medium">
                          {formatPhoneUZ(c.phone)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-neutral-100 font-semibold text-neutral-800 text-[11px]">
                            {c.totalVisits}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-neutral-900">
                          {formatUZS(c.totalSpent)}
                        </td>
                        <td className="px-5 py-3.5 text-neutral-500 text-xs italic">
                          {c.notes || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 3: УСЛУГИ И СОТРУДНИКИ */}
          {activeTab === "services" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Услуги */}
              <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-900">Прайс-лист услуг</h2>
                  <span className="text-[11px] text-neutral-400">Цены в сумах UZS</span>
                </div>
                <div className="space-y-2">
                  {salon?.services?.map((srv: any) => (
                    <div
                      key={srv.id}
                      className="p-3.5 rounded-xl border border-neutral-100 bg-neutral-50/40 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-semibold text-neutral-900">{srv.nameRu}</p>
                        <p className="text-[11px] text-neutral-400">{srv.durationMinutes} мин</p>
                      </div>
                      <span className="text-xs font-semibold text-neutral-900">
                        {formatUZS(srv.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Сотрудники */}
              <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm space-y-4">
                <h2 className="text-sm font-semibold text-neutral-900">Мастера заведения</h2>
                <div className="space-y-3">
                  {salon?.staff?.map((master: any) => (
                    <div
                      key={master.id}
                      className="p-3.5 rounded-xl border border-neutral-100 bg-neutral-50/40 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={master.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                          alt={master.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-neutral-200"
                        />
                        <div>
                          <p className="text-xs font-semibold text-neutral-900">{master.fullName}</p>
                          <p className="text-[11px] text-neutral-400">{master.specialty}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 text-[11px] font-medium border border-neutral-200/60">
                          {master.commissionPercent}% ставка
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 4: ФИНАНСЫ И КАССА */}
          {activeTab === "finance" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm space-y-1">
                  <p className="text-xs font-medium text-neutral-500">Выручка за сегодня</p>
                  <p className="text-2xl font-semibold text-neutral-950 tracking-tight">{formatUZS(totalRevenue)}</p>
                  <p className="text-[11px] text-neutral-400">Всего записей: {totalBookingsCount}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm space-y-1">
                  <p className="text-xs font-medium text-neutral-500">Способы оплаты</p>
                  <div className="pt-2 space-y-1.5 text-xs font-medium">
                    <div className="flex justify-between">
                      <span className="text-neutral-500 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-neutral-400" /> Click / Payme:
                      </span>
                      <span className="text-neutral-900 font-semibold">150 000 UZS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5 text-neutral-400" /> Наличные (Naqd):
                      </span>
                      <span className="text-neutral-900 font-semibold">220 000 UZS</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm space-y-1">
                  <p className="text-xs font-medium text-neutral-500">Зарплатный фонд мастеров</p>
                  <p className="text-2xl font-semibold text-neutral-950 tracking-tight">
                    {formatUZS(Math.round(totalRevenue * 0.45))}
                  </p>
                  <p className="text-[11px] text-neutral-400">Авторасчет по ставке мастеров</p>
                </div>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 5: НАСТРОЙКИ И TELEGRAM */}
          {activeTab === "settings" && salon && (
            <div className="max-w-2xl bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm space-y-6">
              <div>
                <h2 className="text-sm font-semibold text-neutral-900">Онлайн-запись и продвижение</h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Поделитесь этой ссылкой с клиентами в Instagram и Telegram
                </p>
              </div>

              {/* Персональная ссылка */}
              <div className="p-4 bg-neutral-50 border border-neutral-200/80 rounded-2xl space-y-2">
                <span className="text-xs font-medium text-neutral-700">Персональная ссылка для клиентов:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/b/${salon.slug}`}
                    className="flex-1 px-3 py-2 bg-white rounded-xl border border-neutral-200 text-xs font-mono font-medium text-neutral-800 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="h-9 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink ? "Скопировано!" : "Копировать"}</span>
                  </button>
                </div>
              </div>

              {/* Интеграция с Telegram */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Telegram-бот & Уведомления
                </h3>
                <div className="p-4 rounded-2xl border border-neutral-100 bg-neutral-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900">
                    <Send className="w-3.5 h-3.5 text-neutral-700" />
                    Telegram Mini App для клиентов заведения
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Клиенты смогут открывать онлайн-запись в 1 клик прямо из вашего Telegram-канала
                    без установки приложений. Автоматические уведомления и напоминания о визитах доставляются
                    бесплатно через Telegram-бот платформы.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* МОДАЛКА ДЕТАЛЕЙ ЗАПИСИ */}
      {activeAppointment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Карточка записи
                </span>
                <h3 className="text-base font-semibold text-neutral-900">
                  {activeAppointment.clientName}
                </h3>
                <a
                  href={`tel:${activeAppointment.clientPhone}`}
                  className="text-xs text-neutral-600 hover:text-neutral-900 font-medium flex items-center gap-1 mt-0.5"
                >
                  <Phone className="w-3 h-3 text-neutral-400" /> {formatPhoneUZ(activeAppointment.clientPhone)}
                </a>
              </div>
              <button
                type="button"
                onClick={() => setActiveAppointment(null)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-neutral-900 flex items-center justify-center text-xs font-semibold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Детали */}
            <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Услуга:</span>
                <span className="font-semibold text-neutral-900">{activeAppointment.service.nameRu}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Мастер:</span>
                <span className="font-medium text-neutral-900">{activeAppointment.staff.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Стоимость:</span>
                <span className="font-semibold text-neutral-900">
                  {formatUZS(activeAppointment.price)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-neutral-200/60">
                <span className="text-neutral-500">Статус:</span>
                <div>{renderStatusBadge(activeAppointment.status)}</div>
              </div>
            </div>

            {/* Смена статуса */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-neutral-800">Изменить статус:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(activeAppointment.id, "CONFIRMED")}
                  className="py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-medium transition-colors"
                >
                  Подтвердить
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(activeAppointment.id, "IN_PROGRESS")}
                  className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-medium transition-colors border border-amber-200/60"
                >
                  В кресле
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(activeAppointment.id, "COMPLETED")}
                  className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-medium transition-colors border border-emerald-200/60"
                >
                  Завершить
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(activeAppointment.id, "CANCELLED")}
                  className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-medium transition-colors border border-rose-200/60"
                >
                  Отменить
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={`https://t.me/${activeAppointment.clientPhone.replace(/\D/g, "")}`}
                target="_blank"
                className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" /> Написать в Telegram
              </a>
              <a
                href={`tel:${activeAppointment.clientPhone}`}
                className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Позвонить
              </a>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА СОЗДАНИЯ ЗАПИСИ ВРУЧНУЮ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAppointment}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-base font-semibold text-neutral-900">Новая запись клиента</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-neutral-900 flex items-center justify-center text-xs font-semibold transition-colors"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Имя клиента *</label>
              <input
                type="text"
                required
                placeholder="Имя клиента"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Телефон (+998...) *
              </label>
              <input
                type="tel"
                required
                placeholder="+998 (90) 123-45-67"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Услуга *</label>
                <select
                  value={newServiceId}
                  onChange={(e) => setNewServiceId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-neutral-900 bg-white"
                >
                  {salon?.services?.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.nameRu} ({formatUZS(s.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Мастер *</label>
                <select
                  value={newStaffId}
                  onChange={(e) => setNewStaffId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-neutral-900 bg-white"
                >
                  {salon?.staff?.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Время записи *</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Заметка для CRM
              </label>
              <input
                type="text"
                placeholder="Пожелания, особенности"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-medium focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 border border-neutral-200 text-neutral-700 rounded-xl text-xs font-medium hover:bg-neutral-50 transition-colors"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={addingAppointment}
                className="flex-1 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                {addingAppointment ? "Сохранение..." : "Сохранить запись"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
