import Link from "next/link";
import { Footer } from "@/components/Footer";
import {
  Calendar,
  Send,
  Users,
  DollarSign,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Scissors,
  TrendingUp,
  Clock,
} from "lucide-react";

export const metadata = {
  title: "DIKIDI Business Узбекистан — CRM и онлайн-запись для салонов красоты и мастеров",
  description:
    "Управляйте расписанием, ведите базу клиентов и принимайте записи 24/7 через Telegram Mini App и сайт. Создано специально для рынка Узбекистана.",
};

export default function BusinessLandingPage() {
  const features = [
    {
      icon: Send,
      title: "Telegram Mini App и бот",
      description:
        "Ваши клиенты записываются в 1 клик прямо в Telegram. Никаких скачиваний сторонних приложений.",
      tag: "Telegram First",
    },
    {
      icon: DollarSign,
      title: "Бесплатные уведомления",
      description:
        "Напоминания о визитах отправляются через Telegram-бота. Экономьте сотни тысяч сумов на дорогих SMS.",
      tag: "Экономия на SMS",
    },
    {
      icon: Calendar,
      title: "Умный журнал записей",
      description:
        "Исключает накладки и овербукинг. Автоматически учитывает графики, перерывы и длительность услуг.",
      tag: "Без накладок",
    },
    {
      icon: Users,
      title: "База постоянных клиентов",
      description:
        "История всех посещений, средний чек, заметки мастера о предпочтениях клиента и персональные скидки.",
      tag: "CRM",
    },
    {
      icon: Smartphone,
      title: "Click, Payme и Наличные",
      description:
        "Учет оплат в сумах UZS. Раздельная фиксация онлайн-оплат через Click/Payme и наличных (Naqd) в кассе.",
      tag: "Платежи UZS",
    },
    {
      icon: TrendingUp,
      title: "Авторасчет зарплат мастеров",
      description:
        "Прозрачная система комиссий и процентов с услуг (40-50%). Мастера видят свой заработок за день.",
      tag: "Финансы",
    },
  ];

  const forWhom = [
    {
      title: "Барбершопы и мужские салоны",
      desc: "Быстрая запись на стрижки, уход за бородой и мужской спа.",
    },
    {
      title: "Студии маникюра и педикюра",
      desc: "Параллельные услуги в 4 руки, учет времени и материалов.",
    },
    {
      title: "Салоны красоты и косметологии",
      desc: "Управление несколькими филиалами, сложными услугами и врачами.",
    },
    {
      title: "Частные мастера и бьюти-коворкинги",
      desc: "Персональная ссылка в Instagram био и работа прямо с телефона.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#111111] font-sans selection:bg-neutral-900 selection:text-white flex flex-col">
      {/* Навигационная панель DIKIDI Business */}
      <header className="sticky top-0 z-40 bg-[#f5f5f7]/80 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-semibold text-base tracking-[-0.03em] text-neutral-900">
                DIKIDI
              </span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-neutral-900 text-white tracking-wider">
                Business
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-medium text-neutral-500 hover:text-neutral-900 transition-colors hidden sm:block"
            >
              Каталог заведений
            </Link>
            <Link
              href="/login"
              className="h-9 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Войти в CRM</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 sm:py-16 w-full space-y-20">
        {/* Главный Hero-экран */}
        <section className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-black/[0.08] text-xs font-medium text-neutral-700 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-neutral-900" />
            <span>Платформа автоматизации для сферы услуг в Узбекистане</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-semibold tracking-[-0.03em] text-neutral-950 leading-[1.15]">
            Управляйте салоном и получайте записи без звонков и администраторов
          </h1>

          <p className="text-sm sm:text-base text-neutral-500 max-w-xl mx-auto leading-relaxed">
            Подключите онлайн-запись через Telegram Mini App и виджет для Instagram.
            Ведите расписание мастеров, базу клиентов и финансовый учет в одной системе.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto h-12 px-7 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(0,0,0,0.12)] active:scale-[0.985]"
            >
              <span>Подключить свой бизнес</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200/80 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <span>Посмотреть каталог клиентов</span>
            </Link>
          </div>
        </section>

        {/* Сетка ключевых функций (Apple-style Cards) */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Всё необходимое для роста вашего бизнеса
            </h2>
            <p className="text-xs text-neutral-500">
              Создано с учетом специфики бьюти-рынка Ташкента и Узбекистана
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-6 border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between space-y-4 hover:border-neutral-400 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-neutral-100 flex items-center justify-center text-neutral-900">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                        {feat.tag}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-neutral-900">
                        {feat.title}
                      </h3>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Кому подходит платформа */}
        <section className="bg-white rounded-3xl p-8 sm:p-10 border border-black/[0.08] space-y-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-neutral-900">
              Подходит для любого формата в сфере услуг
            </h2>
            <p className="text-xs text-neutral-500">
              От частного мастера до крупных сетевых салонов
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {forWhom.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-neutral-50/70 border border-neutral-100 space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-neutral-900 shrink-0" />
                  <h4 className="text-xs font-semibold text-neutral-900">{item.title}</h4>
                </div>
                <p className="text-xs text-neutral-500 pl-6 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Простой и понятный старт */}
        <section className="text-center space-y-6 bg-white rounded-3xl p-10 border border-black/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-semibold text-neutral-900">
              Начните принимать записи уже сегодня
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Регистрация занимает 2 минуты. Укажите номер телефона, добавьте услуги и получите персональную ссылку для клиентов.
            </p>
          </div>

          <Link
            href="/login"
            className="inline-flex items-center justify-center h-12 px-8 rounded-2xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition-all gap-2 shadow-sm"
          >
            <span>Войти в DIKIDI Business</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </section>
      </main>

      {/* Единый брендовый футер */}
      <Footer />
    </div>
  );
}
