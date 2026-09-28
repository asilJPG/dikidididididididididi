import Link from "next/link";
import {
  Calendar,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Users,
  Send,
  CreditCard,
  Scissors,
  ChevronRight,
  Star,
  CheckCircle,
  MapPin,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Навигационная панель */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-indigo-500/30">
              D
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900">DIKIDI</span>
              <span className="ml-1.5 text-xs px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-bold border border-indigo-200">
                UZ
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/b/bro-barbershop"
              className="text-xs font-bold text-slate-600 hover:text-indigo-600 px-3 py-2 transition-colors hidden sm:block"
            >
              Клиентская запись
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              Войти в CRM <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Создано специально для рынка Узбекистана
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Сервис онлайн-записи и CRM <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              нового поколения
            </span>
          </h1>

          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Платформа объединяет клиентов и мастеров бьюти-сферы Узбекистана: запись в 2 клика через
            Telegram Mini App, автоматические напоминания, журнал расписания и касса в сумах (UZS).
          </p>
        </div>

        {/* ДВА ГЛАВНЫХ ПОРТАЛА (Для Клиента и Для Бизнеса) */}
        <div className="max-w-5xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Портал 1: ДЛЯ КЛИЕНТОВ */}
          <div className="bg-white rounded-3xl p-7 border-2 border-slate-200/80 shadow-sm hover:border-indigo-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Часть 1: Для клиентов
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  Онлайн-запись и выбор мастера
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Записывайтесь на стрижку, маникюр или спа без звонков и долгого ожидания ответа в Instagram.
                  Смотрите реальные свободные окна и получайте напоминание в Telegram.
                </p>
              </div>

              {/* Пример карточки салона */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">Bro Barbershop Tashkent</span>
                  <div className="flex items-center text-amber-500 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 mr-1" /> 4.95
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo-500 shrink-0" /> Мирабадский р-н, ул. Шевченко, 21
                </p>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/b/bro-barbershop"
                className="w-full py-3.5 px-5 bg-slate-900 group-hover:bg-indigo-600 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-slate-900/10"
              >
                <span>Записаться онлайн (Виджет клиента)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Портал 2: ДЛЯ МАСТЕРОВ И САЛОНОВ */}
          <div className="bg-white rounded-3xl p-7 border-2 border-slate-200/80 shadow-sm hover:border-indigo-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-violet-600">
                  Часть 2: Для мастеров и салонов
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  Business CRM & Календарь
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Полная автоматизация вашего бизнеса: журнал записей с защитой от накладок, база клиентов,
                  расчет зарплаты мастеров, учет оплат (Click / Payme / Наличные) и персональная ссылка для Instagram.
                </p>
              </div>

              {/* Метрики CRM */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-slate-400 text-[10px]">Журнал записей</p>
                  <p className="font-bold text-slate-800 mt-0.5">В реальном времени</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-slate-400 text-[10px]">Напоминания</p>
                  <p className="font-bold text-slate-800 mt-0.5">Через Telegram-бот</p>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <Link
                href="/dashboard"
                className="w-full py-3.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
              >
                <span>Войти в панель мастера (Business CRM)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Особенности для Узбекистана */}
      <section className="bg-white border-t border-slate-200 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Почему наше решение лучше зарубежных аналогов в Узбекистане
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              DIKIDI и Altegio сложны в настройке и не учитывают особенности местного рынка
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Telegram Mini App</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Клиенты записываются прямо в Telegram. Напоминания приходят через бота бесплатно и без затрат на SMS.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Click & Payme</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Поддержка местных платежных систем для предоплаты или депозита. Никаких «не пришел без предупреждения».
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Номера +998 и SMS</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Интеграция с локальными шлюзами Eskiz.uz и PlayMobile. Быстрая авторизация по узбекскому номеру.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Узбекский & Русский</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Полная локализация на узбекский (латиница) и русский языки во всех интерфейсах и шаблонах сообщений.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
        <p>© 2026 DIKIDI UZ — Платформа онлайн-записи для бьюти-сферы Узбекистана. Все права защищены.</p>
      </footer>
    </div>
  );
}
