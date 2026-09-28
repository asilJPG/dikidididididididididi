"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, Send } from "lucide-react";
import { formatPhoneUZ } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("+998 ");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [channel, setChannel] = useState<string>("SMS");
  const [devCode, setDevCode] = useState<string | null>(null);

  // Форматирование ввода телефона
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith("+998")) {
      val = "+998 ";
    }
    setPhone(val);
    setErrorMsg("");
  };

  // Шаг 1: Отправка номера
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = phone.replace(/\D/g, "");
    if (raw.length < 12) {
      setErrorMsg("Введите корректный номер телефона (+998 ...)");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Не удалось отправить код");
        return;
      }

      setChannel(data.channel || "SMS");
      if (data.devCode) {
        setDevCode(data.devCode);
      }
      setStep("code");
    } catch (err) {
      setErrorMsg("Ошибка сети. Попробуйте еще раз.");
    } finally {
      setLoading(false);
    }
  };

  // Шаг 2: Верификация кода
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 4) {
      setErrorMsg("Введите 4-значный код");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Неверный код подтверждения");
        return;
      }

      // Сохраняем пользователя в localStorage
      if (data.user) {
        localStorage.setItem("dikidi_user", JSON.stringify(data.user));
      }

      router.push("/dashboard");
    } catch (err) {
      setErrorMsg("Ошибка при проверке кода");
    } finally {
      setLoading(false);
    }
  };

  // Быстрый вход для демо/MVP
  const handleQuickLogin = (demoPhone: string) => {
    setPhone(demoPhone);
    setCode("7777");
    setLoading(true);
    fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: demoPhone, code: "7777" }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          localStorage.setItem("dikidi_user", JSON.stringify(data.user));
          router.push("/dashboard");
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#111111] flex flex-col justify-between p-6">
      {/* Верхний бар */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> На главную
        </Link>
        <span className="text-xs font-semibold tracking-tight text-neutral-900">
          DIKIDI <span className="text-neutral-400">BUSINESS</span>
        </span>
      </header>

      {/* Центральная карточка */}
      <main className="max-w-sm w-full mx-auto my-auto py-10">
        <div className="bg-white rounded-3xl p-8 border border-black/[0.08] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] space-y-6">
          <div className="space-y-1.5 text-center">
            <h1 className="text-xl font-semibold tracking-[-0.02em] text-neutral-900">
              Вход для партнеров
            </h1>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Личный кабинет владельца салона и мастеров
            </p>
          </div>

          <AnimatePresence mode="wait">
            {step === "phone" ? (
              <motion.form
                key="step-phone"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                onSubmit={handleSendCode}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-neutral-600 block">
                    Номер телефона в Узбекистане
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="+998 90 123-45-67"
                    className="w-full h-11 px-4 rounded-xl border border-neutral-200/80 text-sm font-semibold text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
                    autoFocus
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs font-medium text-rose-500 text-center">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? "Отправка..." : "Получить код для входа"}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="step-code"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                onSubmit={handleVerifyCode}
                className="space-y-4"
              >
                <div className="space-y-1.5 text-center">
                  <span className="text-xs font-medium text-neutral-600">
                    Код отправлен на {phone}
                  </span>
                  <p className="text-[11px] text-neutral-400">
                    {channel === "TELEGRAM"
                      ? "Проверьте сообщения в Telegram боте"
                      : "В SMS сообщении"}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <input
                    type="text"
                    maxLength={4}
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value.replace(/\D/g, ""));
                      setErrorMsg("");
                    }}
                    placeholder="0000"
                    className="w-full h-12 text-center tracking-[0.5em] text-lg font-bold rounded-xl border border-neutral-200/80 text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
                    autoFocus
                  />
                  {devCode && (
                    <div className="p-2 bg-neutral-50 rounded-lg text-center">
                      <p className="text-[11px] text-neutral-500">
                        Тестовый код: <span className="font-bold text-neutral-900">{devCode}</span>
                      </p>
                    </div>
                  )}
                </div>

                {errorMsg && (
                  <p className="text-xs font-medium text-rose-500 text-center">{errorMsg}</p>
                )}

                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={loading || code.length < 4}
                    className="w-full h-11 rounded-xl bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {loading ? "Проверка..." : "Войти в панель управления"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setCode("");
                      setErrorMsg("");
                    }}
                    className="w-full text-center text-xs font-medium text-neutral-400 hover:text-neutral-900 transition-colors py-1"
                  >
                    Изменить номер
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Быстрый вход для тестирования демо */}
          <div className="pt-4 border-t border-neutral-100 space-y-2">
            <p className="text-[10px] uppercase font-semibold tracking-wider text-neutral-400 text-center">
              Быстрый вход для MVP
            </p>
            <button
              type="button"
              onClick={() => handleQuickLogin("+998901234567")}
              className="w-full py-2 px-3 rounded-xl border border-neutral-200 text-xs font-medium text-neutral-700 hover:border-neutral-900 transition-colors flex items-center justify-between"
            >
              <span>Bro Barbershop (Владелец)</span>
              <span className="text-[10px] text-neutral-400">+998 90 123-45-67</span>
            </button>
          </div>
        </div>
      </main>

      {/* Футер */}
      <footer className="max-w-md w-full mx-auto text-center text-[11px] text-neutral-400">
        DIKIDI UZ Business Platform · Безопасный вход по номеру телефона
      </footer>
    </div>
  );
}
