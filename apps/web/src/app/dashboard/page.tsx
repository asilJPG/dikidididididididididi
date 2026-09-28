"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Clock3,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  CreditCard,
  Banknote,
  Sparkles,
} from "lucide-react";
import { formatUZS, formatPhoneUZ } from "@/lib/utils";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"journal" | "clients" | "services" | "finance" | "settings">("journal");
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

  // Загрузка салона
  useEffect(() => {
    async function loadSalonData() {
      try {
        const res = await fetch("/api/salons/bro-barbershop");
        const data = await res.json();
        if (data.salon) {
          setSalon(data.salon);
          if (data.salon.services.length > 0) setNewServiceId(data.salon.services[0].id);
          if (data.salon.staff.length > 0) setNewStaffId(data.salon.staff[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSalonData();
  }, []);

  // Загрузка записей на выбранную дату
  const fetchAppointments = async () => {
    if (!salon) return;
    try {
      const res = await fetch(`/api/appointments?salonId=${salon.id}&date=${selectedDate}&staffId=${filterStaff}`);
      const data = await res.json();
      if (data.appointments) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (salon) {
      fetchAppointments();
    }
  }, [salon, selectedDate, filterStaff]);

  // Загрузка клиентов
  const fetchCustomers = async () => {
    if (!salon) return;
    try {
      const res = await fetch(`/api/customers?salonId=${salon.id}&query=${encodeURIComponent(clientSearch)}`);
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

  // Создание записи
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
    const url = `${window.location.origin}/b/bro-barbershop`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Статус бейдж
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            Подтверждена
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            Клиент в кресле
          </span>
        );
      case "COMPLETED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Завершена
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            Отменена
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
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
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Боковое меню навигации */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0">
        <div>
          {/* Бренд */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-md shadow-indigo-500/30">
                D
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white">DIKIDI</span>
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 font-bold">
                  UZ
                </span>
                <p className="text-[11px] text-slate-400">Business CRM</p>
              </div>
            </div>
          </div>

          {/* Информация о текущем салоне */}
          {salon && (
            <div className="px-5 py-4 bg-slate-800/60 border-b border-slate-800/80">
              <p className="text-xs font-medium text-slate-400">Текущий салон:</p>
              <p className="text-sm font-bold text-white truncate">{salon.name}</p>
              <div className="mt-2 flex items-center gap-2">
                <Link
                  href="/b/bro-barbershop"
                  target="_blank"
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                  <ExternalLink className="w-3 h-3" /> Онлайн-запись
                </Link>
                <button
                  onClick={handleCopyLink}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> {copiedLink ? "Скопировано!" : "Копировать"}
                </button>
              </div>
            </div>
          )}

          {/* Вкладки */}
          <nav className="p-3 space-y-1">
            {[
              { id: "journal", label: "Журнал записей", icon: Calendar },
              { id: "clients", label: "Клиентская база", icon: Users },
              { id: "services", label: "Услуги и Мастера", icon: Scissors },
              { id: "finance", label: "Касса и Зарплаты", icon: DollarSign },
              { id: "settings", label: "Настройки и Telegram", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Профиль владельца внизу */}
        <div className="p-4 border-t border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-indigo-300">
            СА
          </div>
          <div className="truncate flex-1">
            <p className="text-xs font-bold text-white truncate">Сардор Алимов</p>
            <p className="text-[11px] text-slate-400 truncate">+998 90 123-45-67</p>
          </div>
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white"
            title="Выход на главную"
          >
            Выход
          </Link>
        </div>
      </aside>

      {/* Основной контент */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Верхняя панель */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {activeTab === "journal" && "📅 Журнал записей"}
              {activeTab === "clients" && "👥 База постоянных клиентов"}
              {activeTab === "services" && "✂️ Услуги и Сотрудники"}
              {activeTab === "finance" && "💰 Финансы и Выручка"}
              {activeTab === "settings" && "⚙️ Настройки и Продвижение"}
            </h1>
            <p className="text-xs text-slate-500">
              {activeTab === "journal" && "Управление расписанием и клиентами на сегодня"}
              {activeTab === "clients" && "История посещений, заметки мастеров и персональные скидки"}
              {activeTab === "services" && "Прайс-лист в сумах UZS и графики работы мастеров"}
              {activeTab === "finance" && "Касса за день, разбивка по Click/Payme и расчет зарплат"}
              {activeTab === "settings" && "Интеграция с Telegram-ботом, ссылка для Instagram, SMS"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "journal" && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" /> Добавить запись
              </button>
            )}
            <Link
              href="/b/bro-barbershop"
              target="_blank"
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Виджет записи
            </Link>
          </div>
        </header>

        {/* Содержимое вкладок */}
        <div className="p-6 flex-1 overflow-y-auto">
          {/* ВКЛАДКА 1: ЖУРНАЛ ЗАПИСЕЙ */}
          {activeTab === "journal" && (
            <div className="space-y-6">
              {/* Фильтры даты и мастера */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-500">Дата:</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const today = new Date();
                      const yyyy = today.getFullYear();
                      const mm = String(today.getMonth() + 1).padStart(2, "0");
                      const dd = String(today.getDate()).padStart(2, "0");
                      setSelectedDate(`${yyyy}-${mm}-${dd}`);
                    }}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all"
                  >
                    Сегодня
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Мастер:</span>
                  <select
                    value={filterStaff}
                    onChange={(e) => setFilterStaff(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="all">Все мастера салона</option>
                    {salon?.staff.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Список записей */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
                  <span>Записей на дату: {appointments.length}</span>
                  <span>
                    Выручка на этот день:{" "}
                    <span className="text-indigo-600 font-extrabold">{formatUZS(totalRevenue)}</span>
                  </span>
                </div>

                {appointments.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">На этот день записей нет</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Вы можете записать клиента вручную по кнопке «Добавить запись» или поделиться ссылкой в Instagram.
                    </p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Записать первого клиента
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                    {appointments.map((appt) => {
                      const startTime = new Date(appt.startDateTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      const endTime = new Date(appt.endDateTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={appt.id}
                          onClick={() => setActiveAppointment(appt)}
                          className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="px-3 py-2 bg-slate-900 text-white rounded-xl text-center shrink-0">
                                <span className="block text-sm font-black">{startTime}</span>
                                <span className="block text-[10px] text-slate-400">{endTime}</span>
                              </div>
                              <div>
                                <p className="text-sm font-extrabold text-slate-900">{appt.clientName}</p>
                                <p className="text-xs text-slate-500 font-medium">
                                  {formatPhoneUZ(appt.clientPhone)}
                                </p>
                              </div>
                            </div>
                            <div>{renderStatusBadge(appt.status)}</div>
                          </div>

                          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-800">{appt.service.nameRu}</span>
                              <p className="text-slate-400">Мастер: {appt.staff.fullName}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-extrabold text-indigo-600">
                                {formatUZS(appt.price)}
                              </span>
                              <span className="block text-[10px] text-slate-400">
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
              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Поиск по имени, номеру телефона +998... или заметкам"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>

              {/* Список клиентов */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                    <tr>
                      <th className="px-5 py-3.5">Клиент</th>
                      <th className="px-5 py-3.5">Телефон</th>
                      <th className="px-5 py-3.5 text-center">Визитов</th>
                      <th className="px-5 py-3.5 text-right">Потрачено всего</th>
                      <th className="px-5 py-3.5">Заметки мастера</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {customers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900">{c.fullName}</td>
                        <td className="px-5 py-3.5 text-indigo-600 font-bold">
                          {formatPhoneUZ(c.phone)}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 font-bold text-slate-800">
                            {c.totalVisits}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-extrabold text-slate-900">
                          {formatUZS(c.totalSpent)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs italic">
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
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">Прайс-лист услуг:</h2>
                  <span className="text-xs text-slate-400">Цены в сумах UZS</span>
                </div>
                <div className="space-y-2.5">
                  {salon?.services.map((srv: any) => (
                    <div
                      key={srv.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{srv.nameRu}</p>
                        <p className="text-[11px] text-slate-400">{srv.durationMinutes} мин</p>
                      </div>
                      <span className="text-xs font-extrabold text-indigo-600">
                        {formatUZS(srv.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Сотрудники */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-slate-900">Мастера салона:</h2>
                <div className="space-y-3">
                  {salon?.staff.map((master: any) => (
                    <div
                      key={master.id}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={master.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"}
                          alt={master.fullName}
                          className="w-10 h-10 rounded-full object-cover border"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{master.fullName}</p>
                          <p className="text-[11px] text-slate-400">{master.specialty}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
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
              {/* Карточки метрик */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <p className="text-xs font-bold text-slate-400">Выручка за сегодня:</p>
                  <p className="text-2xl font-black text-indigo-600">{formatUZS(totalRevenue)}</p>
                  <p className="text-[11px] text-slate-500">Записей: {totalBookingsCount}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <p className="text-xs font-bold text-slate-400">Способы оплаты:</p>
                  <div className="pt-1 space-y-1 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-blue-500" /> Click / Payme:
                      </span>
                      <span className="text-slate-900">150 000 UZS</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Banknote className="w-3.5 h-3.5 text-emerald-500" /> Наличные (Naqd):
                      </span>
                      <span className="text-slate-900">220 000 UZS</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
                  <p className="text-xs font-bold text-slate-400">Зарплатный фонд мастеров:</p>
                  <p className="text-2xl font-black text-emerald-600">
                    {formatUZS(Math.round(totalRevenue * 0.45))}
                  </p>
                  <p className="text-[11px] text-slate-500">Авторасчет по ставке 40-50%</p>
                </div>
              </div>
            </div>
          )}

          {/* ВКЛАДКА 5: НАСТРОЙКИ И TELEGRAM */}
          {activeTab === "settings" && (
            <div className="max-w-2xl bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Онлайн-запись и продвижение</h2>
                <p className="text-xs text-slate-500">
                  Поделитесь этой ссылкой с клиентами в Instagram и Telegram-канале
                </p>
              </div>

              {/* Ссылка */}
              <div className="p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-2">
                <span className="text-xs font-bold text-slate-700">Ваша персональная ссылка:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/b/bro-barbershop`}
                    className="flex-1 px-3 py-2 bg-white rounded-xl border border-indigo-200 text-xs font-mono font-bold text-indigo-700 select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copiedLink ? "Скопировано!" : "Копировать"}
                  </button>
                </div>
              </div>

              {/* Интеграция с Telegram */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Telegram-бот & Уведомления
                </h3>
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <Send className="w-4 h-4 text-sky-500" />
                    Telegram Mini App для ваших клиентов
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Клиенты смогут открывать запись в 1 клик прямо из вашего Telegram-канала или бота
                    без установки приложений. Автоматические напоминания за 2 часа до записи отправляются
                    через бота бесплатно.
                  </p>
                </div>
              </div>

              {/* Язык интерфейса */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Язык интерфейса
                </h3>
                <div className="flex gap-2">
                  <button className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white">
                    Русский
                  </button>
                  <button className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200">
                    O'zbekcha (Lotin)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* МОДАЛКА ДЕТАЛЕЙ ЗАПИСИ */}
      {activeAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Карточка записи
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {activeAppointment.clientName}
                </h3>
                <a
                  href={`tel:${activeAppointment.clientPhone}`}
                  className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:underline"
                >
                  <Phone className="w-3 h-3" /> {formatPhoneUZ(activeAppointment.clientPhone)}
                </a>
              </div>
              <button
                onClick={() => setActiveAppointment(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Детали */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Услуга:</span>
                <span className="font-bold text-slate-900">{activeAppointment.service.nameRu}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Мастер:</span>
                <span className="font-bold text-slate-900">{activeAppointment.staff.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Стоимость:</span>
                <span className="font-extrabold text-indigo-600">
                  {formatUZS(activeAppointment.price)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                <span className="text-slate-500">Текущий статус:</span>
                <div>{renderStatusBadge(activeAppointment.status)}</div>
              </div>
            </div>

            {/* Смена статуса */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Изменить статус:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleUpdateStatus(activeAppointment.id, "CONFIRMED")}
                  className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all border border-blue-200"
                >
                  ✓ Подтвердить
                </button>
                <button
                  onClick={() => handleUpdateStatus(activeAppointment.id, "IN_PROGRESS")}
                  className="py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all border border-purple-200"
                >
                  💈 В кресле
                </button>
                <button
                  onClick={() => handleUpdateStatus(activeAppointment.id, "COMPLETED")}
                  className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all border border-emerald-200"
                >
                  🎉 Завершить (Оплачено)
                </button>
                <button
                  onClick={() => handleUpdateStatus(activeAppointment.id, "CANCELLED")}
                  className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200"
                >
                  ✕ Отменить
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={`https://t.me/${activeAppointment.clientPhone.replace(/\D/g, "")}`}
                target="_blank"
                className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Send className="w-3.5 h-3.5" /> Написать в Telegram
              </a>
              <a
                href={`tel:${activeAppointment.clientPhone}`}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Phone className="w-3.5 h-3.5" /> Позвонить
              </a>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА СОЗДАНИЯ ЗАПИСИ ВРУЧНУЮ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateAppointment}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-base font-extrabold text-slate-900">Новая запись клиента</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Имя клиента *</label>
              <input
                type="text"
                required
                placeholder="Например, Олимхон"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Телефон Узбекистана (+998...) *
              </label>
              <input
                type="tel"
                required
                placeholder="+998 (90) 123-45-67"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Услуга *</label>
                <select
                  value={newServiceId}
                  onChange={(e) => setNewServiceId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {salon?.services.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.nameRu} ({formatUZS(s.price)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Мастер *</label>
                <select
                  value={newStaffId}
                  onChange={(e) => setNewStaffId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {salon?.staff.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Время записи *</label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Заметка для CRM (необязательно)
              </label>
              <input
                type="text"
                placeholder="Пожелания, особенности"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
              />
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={addingAppointment}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
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
