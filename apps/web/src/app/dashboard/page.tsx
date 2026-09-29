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
  CreditCard,
  Banknote,
  LogOut,
  Building2,
  Check,
  Edit2,
  Trash2,
  UserPlus,
  Save,
  Grid,
  List,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import {
  formatUZS,
  formatPhoneUZ,
  formatTashkentTime,
} from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<
    "journal" | "clients" | "services" | "finance" | "settings"
  >("journal");
  const [journalView, setJournalView] = useState<"cards" | "timeline">("cards");

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

  // Детали записи
  const [activeAppointment, setActiveAppointment] = useState<any | null>(null);

  // Создание записи вручную
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
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [customerNotes, setCustomerNotes] = useState("");
  const [savingCustomerNotes, setSavingCustomerNotes] = useState(false);

  // Управление услугами
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [serviceNameRu, setServiceNameRu] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceDuration, setServiceDuration] = useState("45");
  const [serviceStaffIds, setServiceStaffIds] = useState<string[]>([]);
  const [savingService, setSavingService] = useState(false);

  // Управление мастерами
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [staffFullName, setStaffFullName] = useState("");
  const [staffSpecialty, setStaffSpecialty] = useState("");
  const [staffPhone, setStaffPhone] = useState("+998 ");
  const [staffCommission, setStaffCommission] = useState("40");
  const [savingStaff, setSavingStaff] = useState(false);

  // Настройки салона
  const [salonName, setSalonName] = useState("");
  const [salonPhone, setSalonPhone] = useState("");
  const [salonCity, setSalonCity] = useState("Ташкент");
  const [salonAddress, setSalonAddress] = useState("");
  const [salonLandmark, setSalonLandmark] = useState("");
  const [salonDescription, setSalonDescription] = useState("");
  const [savingSalonSettings, setSavingSalonSettings] = useState(false);
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  // Копирование ссылки
  const [copiedLink, setCopiedLink] = useState(false);

  // 1. Инициализация пользователя и салонов
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

    async function loadSalons() {
      try {
        const res = await fetch("/api/salons");
        const data = await res.json();
        if (data.salons && data.salons.length > 0) {
          setSalonsList(data.salons);
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

  // 2. Загрузка данных выбранного салона
  const fetchSalonData = async () => {
    if (!currentSalonSlug) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/salons/${currentSalonSlug}`);
      const data = await res.json();
      if (data.salon) {
        setSalon(data.salon);
        setSalonName(data.salon.name || "");
        setSalonPhone(data.salon.phone || "");
        setSalonCity(data.salon.city || "Ташкент");
        setSalonAddress(data.salon.address || "");
        setSalonLandmark(data.salon.landmark || "");
        setSalonDescription(data.salon.description || "");

        if (data.salon.services?.length > 0) {
          setNewServiceId(data.salon.services[0].id);
        }
        if (data.salon.staff?.length > 0) {
          setNewStaffId(data.salon.staff[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalonData();
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

  // Смена статуса записи
  const handleUpdateStatus = async (
    id: string,
    newStatus: string,
    paymentMethod?: string
  ) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: newStatus,
          paymentStatus: newStatus === "COMPLETED" ? "PAID" : undefined,
          paymentMethod: paymentMethod || undefined,
        }),
      });
      if (res.ok) {
        fetchAppointments();
        if (activeAppointment && activeAppointment.id === id) {
          setActiveAppointment({
            ...activeAppointment,
            status: newStatus,
            paymentStatus: newStatus === "COMPLETED" ? "PAID" : activeAppointment.paymentStatus,
            ...(paymentMethod ? { paymentMethod } : {}),
          });
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
      } else {
        alert("Не удалось создать запись");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingAppointment(false);
    }
  };

  // Создание или обновление услуги
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon || !serviceNameRu || !servicePrice) return;
    setSavingService(true);
    try {
      if (editingService) {
        await fetch(`/api/salons/${salon.slug}/services`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingService.id,
            nameRu: serviceNameRu,
            price: Number(servicePrice),
            durationMinutes: Number(serviceDuration),
            staffIds: serviceStaffIds,
          }),
        });
      } else {
        await fetch(`/api/salons/${salon.slug}/services`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nameRu: serviceNameRu,
            price: Number(servicePrice),
            durationMinutes: Number(serviceDuration),
            staffIds: serviceStaffIds,
          }),
        });
      }
      setShowServiceModal(false);
      setEditingService(null);
      setServiceNameRu("");
      setServicePrice("");
      setServiceDuration("45");
      setServiceStaffIds([]);
      fetchSalonData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingService(false);
    }
  };

  // Удаление услуги
  const handleDeleteService = async (serviceId: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту услугу?")) return;
    try {
      await fetch(`/api/salons/${salon.slug}/services?id=${serviceId}`, {
        method: "DELETE",
      });
      fetchSalonData();
    } catch (err) {
      console.error(err);
    }
  };

  // Создание или обновление мастера
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon || !staffFullName || !staffSpecialty) return;
    setSavingStaff(true);
    try {
      if (editingStaff) {
        await fetch(`/api/salons/${salon.slug}/staff`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingStaff.id,
            fullName: staffFullName,
            specialty: staffSpecialty,
            phone: staffPhone,
            commissionPercent: Number(staffCommission),
          }),
        });
      } else {
        await fetch(`/api/salons/${salon.slug}/staff`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: staffFullName,
            specialty: staffSpecialty,
            phone: staffPhone,
            commissionPercent: Number(staffCommission),
          }),
        });
      }
      setShowStaffModal(false);
      setEditingStaff(null);
      setStaffFullName("");
      setStaffSpecialty("");
      setStaffPhone("+998 ");
      setStaffCommission("40");
      fetchSalonData();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingStaff(false);
    }
  };

  // Сохранение настроек салона
  const handleSaveSalonSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon) return;
    setSavingSalonSettings(true);
    try {
      const res = await fetch(`/api/salons/${salon.slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: salonName,
          phone: salonPhone,
          city: salonCity,
          address: salonAddress,
          landmark: salonLandmark,
          description: salonDescription,
        }),
      });
      if (res.ok) {
        setSavedSettingsNotice(true);
        setTimeout(() => setSavedSettingsNotice(false), 2500);
        fetchSalonData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSalonSettings(false);
    }
  };

  // Сохранение заметок о клиенте
  const handleSaveCustomerNotes = async () => {
    if (!editingCustomer || !salon) return;
    setSavingCustomerNotes(true);
    try {
      await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonId: salon.id,
          phone: editingCustomer.phone,
          fullName: editingCustomer.fullName,
          notes: customerNotes,
        }),
      });
      setEditingCustomer(null);
      setCustomerNotes("");
      fetchCustomers();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingCustomerNotes(false);
    }
  };

  // Копирование ссылки
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

  // Статус бейдж
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
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            В кресле
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
      case "NO_SHOW":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-200 text-neutral-800">
            Не пришел
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200">
            Новая заявка
          </span>
        );
    }
  };

  // Финансовые расчеты
  const completedAppointments = appointments.filter(
    (a: any) => a.status === "COMPLETED" || a.paymentStatus === "PAID"
  );
  const totalRevenue = completedAppointments.reduce((sum: number, a: any) => sum + a.price, 0);

  const cashRevenue = completedAppointments
    .filter((a: any) => !a.paymentMethod || a.paymentMethod === "CASH")
    .reduce((sum: number, a: any) => sum + a.price, 0);

  const onlineRevenue = completedAppointments
    .filter((a: any) => a.paymentMethod === "CLICK" || a.paymentMethod === "PAYME")
    .reduce((sum: number, a: any) => sum + a.price, 0);

  const terminalRevenue = completedAppointments
    .filter((a: any) => a.paymentMethod === "TERMINAL")
    .reduce((sum: number, a: any) => sum + a.price, 0);

  // Расчет зарплат каждого мастера
  const staffPayroll = (salon?.staff || []).map((m: any) => {
    const staffAppts = completedAppointments.filter((a: any) => a.staffId === m.id);
    const staffGross = staffAppts.reduce((sum: number, a: any) => sum + a.price, 0);
    const commission = m.commissionPercent || 40;
    const earned = Math.round((staffGross * commission) / 100);
    return {
      staff: m,
      count: staffAppts.length,
      gross: staffGross,
      commission,
      earned,
    };
  });

  const totalPayroll = staffPayroll.reduce((sum: number, p: any) => sum + p.earned, 0);

  // Сетка часов для шахматки (Timeline): 09:00 - 20:00
  const timelineHours = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#111111] flex flex-col md:flex-row font-sans selection:bg-neutral-900 selection:text-white">
      {/* Боковое меню */}
      <aside className="w-full md:w-64 bg-white border-r border-black/[0.06] flex flex-col justify-between shrink-0">
        <div>
          {/* Бренд */}
          <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-tight text-neutral-900">
                DIKIDI
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-black/[0.06] text-neutral-600">
                CRM
              </span>
            </Link>
          </div>

          {/* Салон */}
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
                        {s.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p className="text-xs font-semibold text-neutral-900 truncate">
                {salon.name}
              </p>
              <div className="flex items-center gap-3 pt-1">
                <Link
                  href={`/b/${salon.slug}`}
                  target="_blank"
                  className="text-[11px] text-neutral-600 hover:text-neutral-900 font-medium flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3 text-neutral-400" /> Виджет
                </Link>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-[11px] text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1"
                >
                  {copiedLink ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3 text-neutral-400" />
                  )}
                  <span>{copiedLink ? "Скопировано" : "Ссылка"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Вкладки CRM */}
          <nav className="p-3 space-y-1">
            {[
              { id: "journal", label: "Журнал записей", icon: Calendar },
              { id: "clients", label: "База клиентов", icon: Users },
              { id: "services", label: "Услуги и мастера", icon: Scissors },
              { id: "finance", label: "Касса и зарплаты", icon: DollarSign },
              { id: "settings", label: "Настройки салона", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
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
              {currentUser?.fullName || "Владелец бизнеса"}
            </p>
            <p className="text-[11px] text-neutral-500 truncate">
              {currentUser?.phone ? formatPhoneUZ(currentUser.phone) : "+998 90 123-45-67"}
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

      {/* Основной контент */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-black/[0.06] bg-white px-6 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-sm font-bold text-neutral-900">
              {activeTab === "journal" && "Журнал записей"}
              {activeTab === "clients" && "Клиентская база"}
              {activeTab === "services" && "Услуги и сотрудники"}
              {activeTab === "finance" && "Касса, аналитика и расчет зарплат"}
              {activeTab === "settings" && "Настройки и параметры заведения"}
            </h1>
            <p className="text-xs text-neutral-500">
              {activeTab === "journal" && "Расписание и бронирования на день"}
              {activeTab === "clients" && "История визитов, суммарный чек и заметки"}
              {activeTab === "services" && "Прайс-лист услуг и штат специалистов"}
              {activeTab === "finance" && "Выручка, типы оплат и начисления мастерам"}
              {activeTab === "settings" && "Профиль заведения, контакты и ссылка записи"}
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
            {activeTab === "services" && (
              <button
                type="button"
                onClick={() => {
                  setEditingService(null);
                  setServiceNameRu("");
                  setServicePrice("");
                  setServiceDuration("45");
                  setServiceStaffIds(salon?.staff?.map((st: any) => st.id) || []);
                  setShowServiceModal(true);
                }}
                className="h-9 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Добавить услугу
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

        {/* Контент вкладок */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* ===================== ВКЛАДКА 1: ЖУРНАЛ ЗАПИСЕЙ ===================== */}
          {activeTab === "journal" && (
            <div className="space-y-5">
              {/* Панель управления датой и видом */}
              <div className="bg-white p-4 rounded-2xl border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-neutral-500">Дата:</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-1.5 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900 bg-white"
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

                  <div className="flex items-center gap-1 border-l pl-3 ml-1 border-neutral-200">
                    <span className="text-xs font-medium text-neutral-500">Мастер:</span>
                    <select
                      value={filterStaff}
                      onChange={(e) => setFilterStaff(e.target.value)}
                      className="px-2.5 py-1.5 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 bg-white"
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

                {/* Переключатель вида: Карточки vs Шахматка */}
                <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setJournalView("cards")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      journalView === "cards"
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-900"
                    }`}
                  >
                    <List className="w-3.5 h-3.5" /> Карточки
                  </button>
                  <button
                    type="button"
                    onClick={() => setJournalView("timeline")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      journalView === "timeline"
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-900"
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" /> Шахматка
                  </button>
                </div>
              </div>

              {/* ВИД 1: СПИСОК КАРТОЧЕК */}
              {journalView === "cards" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-medium text-neutral-500 px-1">
                    <span>Записей на выбранный день: {appointments.length}</span>
                    <span>
                      Выручка дня:{" "}
                      <span className="text-neutral-900 font-bold">
                        {formatUZS(totalRevenue)}
                      </span>
                    </span>
                  </div>

                  {appointments.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-black/[0.08] p-12 text-center space-y-3">
                      <Calendar className="w-8 h-8 text-neutral-300 mx-auto" />
                      <p className="text-sm font-bold text-neutral-900">
                        На этот день записей нет
                      </p>
                      <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                        Вы можете создать запись вручную или отправить клиентам ссылку на виджет
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-neutral-800 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Создать первую запись
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
                                  <p className="text-sm font-bold text-neutral-900">
                                    {appt.clientName}
                                  </p>
                                  <p className="text-xs text-neutral-500 font-medium">
                                    {formatPhoneUZ(appt.clientPhone)}
                                  </p>
                                </div>
                              </div>
                              <div>{renderStatusBadge(appt.status)}</div>
                            </div>

                            <div className="bg-neutral-50 p-3 rounded-xl flex items-center justify-between text-xs">
                              <div>
                                <p className="font-semibold text-neutral-900">
                                  {appt.service.nameRu}
                                </p>
                                <p className="text-neutral-400 text-[11px]">
                                  Мастер: {appt.staff.fullName}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-neutral-900">
                                  {formatUZS(appt.price)}
                                </span>
                                <span className="block text-[10px] text-neutral-400">
                                  {appt.paymentStatus === "PAID"
                                    ? `Оплачено (${appt.paymentMethod || "CASH"})`
                                    : "Не оплачено"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ВИД 2: ШАХМАТКА (TIMELINE ПО МАСТЕРАМ) */}
              {journalView === "timeline" && (
                <div className="bg-white rounded-2xl border border-black/[0.08] overflow-x-auto shadow-sm">
                  <div className="min-w-[650px]">
                    <div className="grid grid-cols-[80px_repeat(auto-fit,minmax(140px,1fr))] border-b border-neutral-100 bg-neutral-50/70 text-xs font-semibold text-neutral-700">
                      <div className="p-3 text-neutral-400">Время</div>
                      {(salon?.staff || []).map((m: any) => (
                        <div key={m.id} className="p-3 border-l border-neutral-100 truncate">
                          {m.fullName}
                        </div>
                      ))}
                    </div>

                    <div className="divide-y divide-neutral-100">
                      {timelineHours.map((hour) => {
                        const hourNum = parseInt(hour.split(":")[0]);

                        return (
                          <div
                            key={hour}
                            className="grid grid-cols-[80px_repeat(auto-fit,minmax(140px,1fr))] text-xs min-h-[56px]"
                          >
                            <div className="p-3 font-mono text-[11px] text-neutral-400 border-r border-neutral-100">
                              {hour}
                            </div>

                            {(salon?.staff || []).map((m: any) => {
                              // Находим запись этого мастера в этот час
                              const slotAppt = appointments.find((a) => {
                                if (a.staffId !== m.id) return false;
                                const apptDate = new Date(a.startDateTime);
                                return apptDate.getHours() === hourNum;
                              });

                              return (
                                <div
                                  key={m.id}
                                  className="p-1 border-r border-neutral-100 relative"
                                >
                                  {slotAppt ? (
                                    <div
                                      onClick={() => setActiveAppointment(slotAppt)}
                                      className="h-full bg-neutral-900 text-white p-2 rounded-xl text-left cursor-pointer hover:bg-neutral-800 transition-colors space-y-0.5"
                                    >
                                      <p className="font-bold text-[11px] truncate">
                                        {slotAppt.clientName}
                                      </p>
                                      <p className="text-[10px] text-neutral-300 truncate">
                                        {slotAppt.service.nameRu}
                                      </p>
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => {
                                        setNewStaffId(m.id);
                                        setNewTime(hour);
                                        setShowAddModal(true);
                                      }}
                                      className="h-full rounded-xl hover:bg-neutral-50 flex items-center justify-center text-neutral-300 hover:text-neutral-500 cursor-pointer transition-colors text-[11px]"
                                    >
                                      + Запись
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================== ВКЛАДКА 2: КЛИЕНТСКАЯ БАЗА ===================== */}
          {activeTab === "clients" && (
            <div className="space-y-4">
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

              <div className="bg-white rounded-2xl border border-black/[0.08] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50/70 border-b border-neutral-100 text-neutral-400 uppercase tracking-wider text-[10px] font-semibold">
                    <tr>
                      <th className="px-5 py-3.5">Клиент</th>
                      <th className="px-5 py-3.5">Телефон</th>
                      <th className="px-5 py-3.5 text-center">Визитов</th>
                      <th className="px-5 py-3.5 text-right">Потрачено всего (LTV)</th>
                      <th className="px-5 py-3.5">Заметки о клиенте</th>
                      <th className="px-5 py-3.5 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                    {customers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-neutral-400">
                          Клиентов не найдено
                        </td>
                      </tr>
                    ) : (
                      customers.map((c) => (
                        <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-neutral-900">
                            {c.fullName}
                          </td>
                          <td className="px-5 py-3.5 text-neutral-700 font-medium">
                            {formatPhoneUZ(c.phone)}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-neutral-100 font-semibold text-neutral-800 text-[11px]">
                              {c.totalVisits}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-neutral-900">
                            {formatUZS(c.totalSpent)}
                          </td>
                          <td className="px-5 py-3.5 text-neutral-500 text-xs italic max-w-xs truncate">
                            {c.notes || "—"}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCustomer(c);
                                setCustomerNotes(c.notes || "");
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-neutral-700 hover:text-neutral-950 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                            >
                              Заметка
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================== ВКЛАДКА 3: УСЛУГИ И СОТРУДНИКИ ===================== */}
          {activeTab === "services" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Услуги */}
              <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900">Прайс-лист услуг</h2>
                    <p className="text-xs text-neutral-400">Цены и длительность для записи</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingService(null);
                      setServiceNameRu("");
                      setServicePrice("");
                      setServiceDuration("45");
                      setServiceStaffIds(salon?.staff?.map((st: any) => st.id) || []);
                      setShowServiceModal(true);
                    }}
                    className="px-3 py-1.5 bg-neutral-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-neutral-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Услуга
                  </button>
                </div>

                <div className="space-y-2">
                  {salon?.services?.map((srv: any) => {
                    const assignedStaffIds = (srv.staffServices || []).map((ss: any) => ss.staffId);
                    return (
                      <div
                        key={srv.id}
                        className="p-3.5 rounded-xl border border-neutral-100 bg-neutral-50/50 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-neutral-900">{srv.nameRu}</p>
                          <p className="text-[11px] text-neutral-400">
                            {srv.durationMinutes} мин · {formatUZS(srv.price)}
                          </p>
                          {/* Бейджи мастеров */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="text-[10px] font-semibold text-neutral-400">Мастера:</span>
                            {assignedStaffIds.length > 0 ? (
                              assignedStaffIds.map((stId: string) => {
                                const foundMaster = salon?.staff?.find((m: any) => m.id === stId);
                                return (
                                  <span
                                    key={stId}
                                    className="px-2 py-0.5 rounded-md bg-white border border-neutral-200/80 text-neutral-700 text-[10px] font-semibold"
                                  >
                                    {foundMaster?.fullName || "Мастер"}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-[10px] text-neutral-400 italic">Все мастера</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingService(srv);
                              setServiceNameRu(srv.nameRu);
                              setServicePrice(String(srv.price));
                              setServiceDuration(String(srv.durationMinutes));
                              setServiceStaffIds(
                                Array.isArray(srv.staffServices) && srv.staffServices.length > 0
                                  ? srv.staffServices.map((ss: any) => ss.staffId)
                                  : salon?.staff?.map((st: any) => st.id) || []
                              );
                              setShowServiceModal(true);
                            }}
                            className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteService(srv.id)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Сотрудники */}
              <div className="bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900">Штат мастеров</h2>
                    <p className="text-xs text-neutral-400">Специалисты и комиссионные ставки</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStaff(null);
                      setStaffFullName("");
                      setStaffSpecialty("");
                      setStaffPhone("+998 ");
                      setStaffCommission("40");
                      setShowStaffModal(true);
                    }}
                    className="px-3 py-1.5 bg-neutral-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1 hover:bg-neutral-800 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Мастер
                  </button>
                </div>

                <div className="space-y-3">
                  {salon?.staff?.map((master: any) => (
                    <div
                      key={master.id}
                      className="p-3.5 rounded-xl border border-neutral-100 bg-neutral-50/50 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {master.fullName.slice(0, 1)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-900">{master.fullName}</p>
                          <p className="text-[11px] text-neutral-400">
                            {master.specialty} · Ставка {master.commissionPercent}%
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href="/staff"
                          className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-[11px] font-semibold transition-colors"
                        >
                          График
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStaff(master);
                            setStaffFullName(master.fullName);
                            setStaffSpecialty(master.specialty);
                            setStaffPhone(master.phone || "+998 ");
                            setStaffCommission(String(master.commissionPercent || 40));
                            setShowStaffModal(true);
                          }}
                          className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-200/60 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================== ВКЛАДКА 4: ФИНАНСЫ И ЗАРПЛАТЫ ===================== */}
          {activeTab === "finance" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-black/[0.08] shadow-sm space-y-1">
                  <p className="text-xs font-medium text-neutral-500">Выручка за {selectedDate}</p>
                  <p className="text-2xl font-bold text-neutral-950 tracking-tight">
                    {formatUZS(totalRevenue)}
                  </p>
                  <p className="text-[11px] text-neutral-400">Завершено записей: {completedAppointments.length}</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-black/[0.08] shadow-sm space-y-1">
                  <p className="text-xs font-medium text-neutral-500">Наличные (Naqd)</p>
                  <p className="text-2xl font-bold text-neutral-950 tracking-tight">
                    {formatUZS(cashRevenue)}
                  </p>
                  <p className="text-[11px] text-neutral-400">В кассе заведения</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-black/[0.08] shadow-sm space-y-1">
                  <p className="text-xs font-medium text-neutral-500">Click & Payme</p>
                  <p className="text-2xl font-bold text-neutral-950 tracking-tight">
                    {formatUZS(onlineRevenue)}
                  </p>
                  <p className="text-[11px] text-neutral-400">Безналичная оплата</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-black/[0.08] shadow-sm space-y-1">
                  <p className="text-xs font-medium text-neutral-500">Зарплатный фонд мастеров</p>
                  <p className="text-2xl font-bold text-emerald-700 tracking-tight">
                    {formatUZS(totalPayroll)}
                  </p>
                  <p className="text-[11px] text-neutral-400">К выплате сотрудникам</p>
                </div>
              </div>

              {/* Ведомость зарплат мастеров */}
              <div className="bg-white rounded-2xl border border-black/[0.08] overflow-hidden shadow-sm space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neutral-900">
                    Ведомость начислений мастерам за {selectedDate}
                  </h3>
                  <span className="text-xs text-neutral-400">
                    Автоматический расчет по ставкам
                  </span>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50/70 border-b border-neutral-100 text-neutral-400 uppercase tracking-wider text-[10px] font-semibold">
                    <tr>
                      <th className="px-4 py-3">Сотрудник</th>
                      <th className="px-4 py-3 text-center">Выполнено визитов</th>
                      <th className="px-4 py-3 text-right">Валовая касса</th>
                      <th className="px-4 py-3 text-center">Ставка %</th>
                      <th className="px-4 py-3 text-right">Начислено мастеру</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                    {staffPayroll.map((p: any) => (
                      <tr key={p.staff.id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-neutral-900">
                          {p.staff.fullName} ({p.staff.specialty})
                        </td>
                        <td className="px-4 py-3 text-center font-semibold">
                          {p.count}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-neutral-900">
                          {formatUZS(p.gross)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 text-[11px] font-bold">
                            {p.commission}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-700">
                          {formatUZS(p.earned)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================== ВКЛАДКА 5: НАСТРОЙКИ САЛОНА ===================== */}
          {activeTab === "settings" && salon && (
            <div className="max-w-2xl bg-white p-6 rounded-2xl border border-black/[0.08] shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-neutral-900">
                  Параметры и профиль заведения
                </h2>
                <p className="text-xs text-neutral-500">
                  Информация, отображаемая клиентам в виджете и онлайн-каталоге
                </p>
              </div>

              {/* Персональная ссылка */}
              <div className="p-4 bg-neutral-50 border border-neutral-200/80 rounded-2xl space-y-2">
                <span className="text-xs font-semibold text-neutral-700">
                  Прямая ссылка для Instagram био:
                </span>
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

              {/* Форма редактирования информации о салоне */}
              <form onSubmit={handleSaveSalonSettings} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 block mb-1">
                      Название заведения
                    </label>
                    <input
                      type="text"
                      value={salonName}
                      onChange={(e) => setSalonName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900 font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 block mb-1">
                      Контактный телефон
                    </label>
                    <input
                      type="tel"
                      value={salonPhone}
                      onChange={(e) => setSalonPhone(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-700 block mb-1">
                      Город
                    </label>
                    <select
                      value={salonCity}
                      onChange={(e) => setSalonCity(e.target.value)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900 font-medium"
                    >
                      <option value="Ташкент">Ташкент</option>
                      <option value="Самарканд">Самарканд</option>
                      <option value="Бухара">Бухара</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 block mb-1">
                      Ориентир
                    </label>
                    <input
                      type="text"
                      value={salonLandmark}
                      onChange={(e) => setSalonLandmark(e.target.value)}
                      placeholder="Рядом с метро / ТЦ"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Физический адрес
                  </label>
                  <input
                    type="text"
                    value={salonAddress}
                    onChange={(e) => setSalonAddress(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Краткое описание салона
                  </label>
                  <textarea
                    value={salonDescription}
                    onChange={(e) => setSalonDescription(e.target.value)}
                    rows={3}
                    placeholder="Барбершоп премиум-класса с профессиональными мастерами и авторским сервисом..."
                    className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900 font-medium"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  {savedSettingsNotice ? (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                      <Check className="w-4 h-4" /> Настройки успешно сохранены
                    </span>
                  ) : <span />}

                  <button
                    type="submit"
                    disabled={savingSalonSettings}
                    className="px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingSalonSettings ? "Сохранение..." : "Сохранить изменения"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* МОДАЛКА ДЕТАЛЕЙ ЗАПИСИ */}
      {activeAppointment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Карточка визита
                </span>
                <h3 className="text-base font-bold text-neutral-900">
                  {activeAppointment.clientName}
                </h3>
                <a
                  href={`tel:${activeAppointment.clientPhone}`}
                  className="text-xs text-neutral-600 hover:text-neutral-900 font-medium flex items-center gap-1 mt-0.5"
                >
                  <Phone className="w-3 h-3 text-neutral-400" />{" "}
                  {formatPhoneUZ(activeAppointment.clientPhone)}
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

            <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Услуга:</span>
                <span className="font-semibold text-neutral-900">
                  {activeAppointment.service.nameRu}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Мастер:</span>
                <span className="font-medium text-neutral-900">
                  {activeAppointment.staff.fullName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Стоимость:</span>
                <span className="font-bold text-neutral-900">
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
                  className="py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-semibold transition-colors"
                >
                  Подтвердить
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(activeAppointment.id, "IN_PROGRESS")}
                  className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors border border-amber-200"
                >
                  В кресле
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(activeAppointment.id, "COMPLETED", "CASH")}
                  className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold transition-colors border border-emerald-200"
                >
                  Завершить (Наличные)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(activeAppointment.id, "COMPLETED", "CLICK")}
                  className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-semibold transition-colors border border-blue-200"
                >
                  Завершить (Click/Payme)
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(activeAppointment.id, "CANCELLED")}
                  className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold transition-colors border border-rose-200"
                >
                  Отменить
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(activeAppointment.id, "NO_SHOW")}
                  className="py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-600 text-xs font-semibold transition-colors"
                >
                  Не пришел
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛКА ДОБАВЛЕНИЯ ЗАПИСИ ВРУЧНУЮ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900">
                Новая запись клиента
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-neutral-900 flex items-center justify-center text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Имя клиента
                </label>
                <input
                  type="text"
                  required
                  placeholder="Азиз Каримов"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Телефон
                </label>
                <input
                  type="tel"
                  required
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Услуга
                  </label>
                  <select
                    value={newServiceId}
                    onChange={(e) => setNewServiceId(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 font-medium"
                  >
                    {salon?.services?.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.nameRu} ({formatUZS(s.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Мастер
                  </label>
                  <select
                    value={newStaffId}
                    onChange={(e) => setNewStaffId(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 font-medium"
                  >
                    {salon?.staff?.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Дата
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Время
                  </label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Комментарий (необязательно)
                </label>
                <input
                  type="text"
                  placeholder="Пожелания к стрижке..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={addingAppointment}
                  className="px-5 py-2 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 disabled:opacity-50"
                >
                  {addingAppointment ? "Сохранение..." : "Записать"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА СОЗДАНИЯ / РЕДАКТИРОВАНИЯ УСЛУГИ */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900">
                {editingService ? "Редактировать услугу" : "Новая услуга"}
              </h3>
              <button
                type="button"
                onClick={() => setShowServiceModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-neutral-900 flex items-center justify-center text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Название услуги (RU)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Мужская стрижка + моделирование бороды"
                  value={serviceNameRu}
                  onChange={(e) => setServiceNameRu(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Стоимость (UZS)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="120000"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Длительность (мин)
                  </label>
                  <select
                    value={serviceDuration}
                    onChange={(e) => setServiceDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 font-medium"
                  >
                    <option value="15">15 минут</option>
                    <option value="30">30 минут</option>
                    <option value="45">45 минут</option>
                    <option value="60">60 минут</option>
                    <option value="90">90 минут</option>
                    <option value="120">120 минут</option>
                  </select>
                </div>
              </div>

              {/* Выбор мастеров, которые могут выполнять данную услугу */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-neutral-700 block">
                    Кто выполняет услугу (мастера) *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (serviceStaffIds.length === (salon?.staff?.length || 0)) {
                        setServiceStaffIds([]);
                      } else {
                        setServiceStaffIds(salon?.staff?.map((st: any) => st.id) || []);
                      }
                    }}
                    className="text-[10px] text-neutral-500 hover:text-neutral-900 font-medium"
                  >
                    {serviceStaffIds.length === (salon?.staff?.length || 0) ? "Снять все" : "Выбрать всех"}
                  </button>
                </div>

                <div className="space-y-1.5 max-h-44 overflow-y-auto p-2.5 bg-neutral-50 rounded-2xl border border-neutral-200">
                  {salon?.staff?.length === 0 ? (
                    <p className="text-neutral-400 text-center py-2">Сначала добавьте хотя бы одного мастера</p>
                  ) : (
                    salon?.staff?.map((master: any) => {
                      const isChecked = serviceStaffIds.includes(master.id);
                      return (
                        <label
                          key={master.id}
                          className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                            isChecked
                              ? "bg-white border-neutral-300 shadow-xs"
                              : "bg-transparent border-transparent hover:bg-white/60"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setServiceStaffIds([...serviceStaffIds, master.id]);
                                } else {
                                  setServiceStaffIds(serviceStaffIds.filter((id) => id !== master.id));
                                }
                              }}
                              className="w-4 h-4 rounded text-neutral-950 border-neutral-300 focus:ring-0 cursor-pointer"
                            />
                            <div>
                              <p className="font-bold text-neutral-900">{master.fullName}</p>
                              <p className="text-[10px] text-neutral-400">{master.specialty}</p>
                            </div>
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                              isChecked ? "bg-emerald-50 text-emerald-700" : "text-neutral-400"
                            }`}
                          >
                            {isChecked ? "Выполняет" : "Не выполняет"}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
                {serviceStaffIds.length === 0 && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">
                    Выберите хотя бы одного мастера, иначе клиенты не смогут записаться на эту услугу.
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowServiceModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  className="px-5 py-2 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 disabled:opacity-50"
                >
                  {savingService ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА СОЗДАНИЯ / РЕДАКТИРОВАНИЯ МАСТЕРА */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neutral-900">
                {editingStaff ? "Редактировать мастера" : "Добавить мастера"}
              </h3>
              <button
                type="button"
                onClick={() => setShowStaffModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 hover:text-neutral-900 flex items-center justify-center text-xs font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  ФИО специалиста
                </label>
                <input
                  type="text"
                  required
                  placeholder="Тимур Султанов"
                  value={staffFullName}
                  onChange={(e) => setStaffFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 block mb-1">
                  Специализация / Должность
                </label>
                <input
                  type="text"
                  required
                  placeholder="Шеф-барбер / Топ-колорист"
                  value={staffSpecialty}
                  onChange={(e) => setStaffSpecialty(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Телефон мастера
                  </label>
                  <input
                    type="tel"
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 font-medium"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">
                    Ставка комиссии (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={staffCommission}
                    onChange={(e) => setStaffCommission(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={savingStaff}
                  className="px-5 py-2 bg-neutral-900 text-white rounded-xl font-semibold hover:bg-neutral-800 disabled:opacity-50"
                >
                  {savingStaff ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА РЕДАКТИРОВАНИЯ ЗАМЕТОК О КЛИЕНТЕ */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                Заметка о клиенте: {editingCustomer.fullName}
              </h3>
              <p className="text-xs text-neutral-500">
                {formatPhoneUZ(editingCustomer.phone)}
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">
                Индивидуальные предпочтения, чай/кофе, особенности:
              </label>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                rows={4}
                placeholder="Предпочитает зеленый чай, стрижка фейд 1.5мм, краситель без аммиака..."
                className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs focus:outline-none focus:border-neutral-900 font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSaveCustomerNotes}
                disabled={savingCustomerNotes}
                className="px-5 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold hover:bg-neutral-800 disabled:opacity-50"
              >
                {savingCustomerNotes ? "Сохранение..." : "Сохранить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
