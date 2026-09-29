"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scissors,
  Sparkles,
  Smile,
  Flame,
  Eye,
  User,
  MapPin,
  Phone,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  ChevronLeft,
  Building2,
  ShieldCheck,
  Star,
  Store,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const CATEGORIES = [
  { id: "BARBERSHOP", label: "Барбершоп", desc: "Мужские стрижки и борода", icon: Scissors },
  { id: "BEAUTY_SALON", label: "Салон красоты", desc: "Стрижки, окрашивание, стиль", icon: Sparkles },
  { id: "NAILS", label: "Ногтевой сервис", desc: "Маникюр, педикюр, наращивание", icon: Smile },
  { id: "COSMETOLOGY", label: "Косметология", desc: "Уход за лицом и кожей", icon: Eye },
  { id: "SPA", label: "SPA и массаж", desc: "Релакс, массаж, процедуры", icon: Flame },
  { id: "MASTER", label: "Частный мастер", desc: "Индивидуальный прием", icon: User },
];

const CITIES = [
  "Ташкент",
  "Самарканд",
  "Бухара",
  "Андижан",
  "Фергана",
  "Наманган",
];

export default function BusinessRegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);

  // Поля формы
  const [salonName, setSalonName] = useState("");
  const [categoryType, setCategoryType] = useState("BARBERSHOP");
  const [city, setCity] = useState("Ташкент");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");

  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("+998 ");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("+998")) {
      val = "+998 ";
    }
    setPhone(val);
    setErrorMsg("");
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonName.trim()) {
      setErrorMsg("Укажите название заведения");
      return;
    }
    if (!address.trim()) {
      setErrorMsg("Укажите точный адрес");
      return;
    }
    setErrorMsg("");
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawPhone = phone.replace(/\D/g, "");
    if (rawPhone.length < 12) {
      setErrorMsg("Введите корректный номер телефона (+998 XX XXX-XX-XX)");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/business/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salonName: salonName.trim(),
          categoryType,
          city,
          address: address.trim(),
          landmark: landmark.trim(),
          ownerName: ownerName.trim() || salonName.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Ошибка при регистрации заведения");
        setLoading(false);
        return;
      }

      // Сохраняем сессию
      if (data.user) {
        localStorage.setItem("dikidi_user", JSON.stringify(data.user));
        if (data.user.phone) {
          localStorage.setItem("dikidi_user_phone", data.user.phone);
        }
      }

      // Перенаправляем прямо в CRM панель
      router.push(`/dashboard?salon=${data.salon.slug}&welcome=true`);
    } catch (err) {
      setErrorMsg("Сетевая ошибка при отправке формы");
      setLoading(false);
    }
  };

  const selectedCategoryObj = CATEGORIES.find((c) => c.id === categoryType);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#111111] flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full space-y-8">
        {/* Заголовок страницы */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 text-white text-[11px] font-bold tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>DIKIDI Business Onboarding</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-neutral-950">
            Подключение заведения
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed">
            Создайте салон, настройте онлайн-запись в Telegram и получите доступ к CRM за 2 минуты
          </p>
        </div>

        {/* Прогресс шагов */}
        <div className="max-w-md mx-auto flex items-center justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <div className={`h-1.5 rounded-full transition-all ${step >= 1 ? "bg-neutral-950" : "bg-neutral-200"}`} />
            <p className="text-[11px] font-bold text-neutral-700">1. О заведении</p>
          </div>
          <div className="flex-1 space-y-1.5">
            <div className={`h-1.5 rounded-full transition-all ${step >= 2 ? "bg-neutral-950" : "bg-neutral-200"}`} />
            <p className="text-[11px] font-bold text-neutral-700">2. Контакты владельца</p>
          </div>
        </div>

        {/* Контейнер формы + Живое превью */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start max-w-4xl mx-auto">
          {/* Левая колонка: Форма */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-black/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-6">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl">
                {errorMsg}
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleNextStep} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-neutral-900 mb-1.5">
                    Название салона / студии / имя мастера *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Например: Barbershop Chop-Chop"
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                    className="w-full h-12 px-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm font-semibold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-950 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-900 mb-1.5">
                    Категория заведения
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = categoryType === cat.id;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => setCategoryType(cat.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                            isSelected
                              ? "bg-neutral-950 text-white border-neutral-950 shadow-sm"
                              : "bg-neutral-50/70 border-neutral-200/80 text-neutral-800 hover:border-neutral-400"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <Icon className={`w-4 h-4 ${isSelected ? "text-amber-400" : "text-neutral-600"}`} />
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className="text-xs font-bold">{cat.label}</span>
                          <span className={`text-[10px] leading-tight ${isSelected ? "text-neutral-300" : "text-neutral-400"}`}>
                            {cat.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-900 mb-1.5">
                      Город
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full h-12 px-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-950"
                    >
                      {CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-900 mb-1.5">
                      Ориентир (необязательно)
                    </label>
                    <input
                      type="text"
                      placeholder="метро Ойбек, ЦУМ"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      className="w-full h-12 px-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-950"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-900 mb-1.5">
                    Улица и номер дома *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ул. Амира Темура, 45"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full h-12 px-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:border-neutral-950"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full h-12 bg-neutral-950 hover:bg-neutral-800 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.99]"
                >
                  <span>Продолжить: Данные владельца</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-neutral-900 mb-1.5">
                    Ваше имя (владелец / директор / мастер) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Сардор"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full h-12 px-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm font-semibold text-neutral-900 focus:outline-none focus:border-neutral-950"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-900 mb-1.5">
                    Номер телефона для входа в CRM *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+998 90 123-45-67"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full h-12 px-4 bg-neutral-50 border border-neutral-200 rounded-2xl text-sm font-semibold text-neutral-900 focus:outline-none focus:border-neutral-950"
                  />
                  <p className="text-[11px] text-neutral-400 mt-1">
                    По этому номеру вы будете входить в CRM-систему
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-neutral-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Что будет создано автоматически:</span>
                  </div>
                  <ul className="space-y-1 text-neutral-500 pl-6 list-disc">
                    <li>Личный кабинет CRM со всеми разделами (Журнал, Клиенты, Касса)</li>
                    <li>Стартовый прайс-лист для категории {selectedCategoryObj?.label}</li>
                    <li>Персональная ссылка на онлайн-запись для Instagram и Telegram</li>
                  </ul>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="h-12 px-5 rounded-2xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Назад</span>
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-12 bg-neutral-950 hover:bg-neutral-800 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Store className="w-4 h-4" />
                        <span>Создать салон и перейти в CRM</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Правая колонка: Живое превью карточки заведения */}
          <div className="lg:col-span-5 space-y-4">
            <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider px-1">
              Превью заведения на витрине
            </div>

            <div className="bg-white rounded-3xl p-6 border border-black/[0.08] shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="w-12 h-12 rounded-2xl bg-neutral-950 text-white flex items-center justify-center font-black text-lg shadow-sm">
                  {(salonName || "D").slice(0, 2).toUpperCase()}
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>Верифицировано</span>
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-black tracking-tight text-neutral-950">
                  {salonName || "Название вашего салона"}
                </h3>
                <p className="text-xs text-neutral-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate">
                    {city}, {address || "Адрес заведения"}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-1 font-bold text-neutral-900 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>5.0</span>
                </div>
                <span className="text-[11px] font-semibold text-neutral-500">
                  {selectedCategoryObj?.label || "Услуги"}
                </span>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                <span className="text-neutral-400">Онлайн-запись 24/7</span>
                <span className="font-bold text-neutral-900">DIKIDI UZ</span>
              </div>
            </div>

            <div className="p-4 bg-neutral-100/70 rounded-2xl text-xs text-neutral-500 leading-relaxed space-y-1">
              <p className="font-bold text-neutral-800">Бесплатный старт без абонплаты:</p>
              <p>Подключение, журнал записей и Telegram-виджет предоставляются сразу после регистрации.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
