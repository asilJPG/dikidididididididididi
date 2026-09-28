import Link from "next/link";
import {
  ArrowRight,
  MapPin,
  Star,
  Check,
  Smartphone,
  Calendar,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#111111] flex flex-col font-sans selection:bg-black selection:text-white">
      {/* Навигация */}
      <header className="sticky top-0 z-40 bg-[#f5f5f7]/80 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold text-base tracking-[-0.03em] text-neutral-900">
              DIKIDI
            </span>
            <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-black/[0.06] text-neutral-600 tracking-wider">
              UZ
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/b/bro-barbershop"
              className="text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors hidden sm:block"
            >
              Онлайн-запись
            </Link>
            <Link
              href="/dashboard"
              className="h-8 px-3.5 rounded-full bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition-all flex items-center gap-1 active:scale-[0.985]"
            >
              Вход в CRM
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 max-w-5xl mx-auto px-6 pt-16 pb-20 w-full space-y-16">
        <section className="space-y-4 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-400">
            Узбекистан · Сервис записи
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.04em] text-neutral-950 leading-[1.08]">
            Онлайн-запись и CRM для сферы услуг
          </h1>
          <p className="text-base text-neutral-500 leading-relaxed font-normal">
            Единая платформа для мастеров, салонов и клиентов. Мгновенная бронь без звонков, Telegram Mini App и касса в сумах UZS.
          </p>
        </section>

        {/* Две основные части: Клиент и Салон */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Портал 1: ДЛЯ КЛИЕНТОВ */}
          <div className="bg-white rounded-3xl p-8 border border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between group">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-medium text-neutral-400 tracking-tight">
                  Для клиентов
                </span>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-900">
                  Запись в два клика
                </h2>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Выбирайте услугу, мастера и реальное свободное окно. Работает в браузере и прямо в Telegram.
                </p>
              </div>

              {/* Пример карточки реального салона */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-900">
                    Bro Barbershop Tashkent
                  </span>
                  <span className="text-xs font-medium text-neutral-600 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 4.95
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-neutral-400 shrink-0" /> ул. Тараса Шевченко, 21
                </p>
              </div>
            </div>

            <div className="pt-8">
              <Link
                href="/b/bro-barbershop"
                className="w-full h-11 px-5 rounded-full bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 active:scale-[0.985]"
              >
                <span>Открыть запись</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Портал 2: ДЛЯ САЛОНОВ И МАСТЕРОВ */}
          <div className="bg-white rounded-3xl p-8 border border-black/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col justify-between group">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-medium text-neutral-400 tracking-tight">
                  Для мастеров и салонов
                </span>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-neutral-900">
                  Business CRM
                </h2>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Журнал расписания без накладок, история клиентов, расчет зарплат и персональная ссылка для шапки Instagram.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100">
                  <p className="text-[10px] uppercase font-medium text-neutral-400">Напоминания</p>
                  <p className="font-semibold text-neutral-900 mt-1">В Telegram-бот</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100">
                  <p className="text-[10px] uppercase font-medium text-neutral-400">Касса</p>
                  <p className="font-semibold text-neutral-900 mt-1">В сумах UZS</p>
                </div>
              </div>
            </div>

            <div className="pt-8">
              <Link
                href="/dashboard"
                className="w-full h-11 px-5 rounded-full bg-white text-neutral-900 border border-neutral-300 text-xs font-semibold hover:border-neutral-900 transition-all flex items-center justify-center gap-2 active:scale-[0.985]"
              >
                <span>Войти в панель CRM</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Локальные преимущества (Без AI-slop сеток из 3 одинаковых карточек) */}
        <section className="bg-white rounded-3xl p-8 border border-black/[0.08] space-y-6">
          <div className="max-w-md">
            <h3 className="text-xl font-semibold tracking-tight text-neutral-900">
              Оптимизировано для рынка Узбекистана
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Учитывает привычки местных клиентов и потребности бизнеса
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 text-xs">
            <div className="space-y-1.5">
              <p className="font-semibold text-neutral-900 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-neutral-900" />
                Telegram Mini App вместо скачивания приложений
              </p>
              <p className="text-neutral-500 leading-relaxed pl-5">
                Клиент переходит по ссылке из Instagram и сразу видит свободные окна мастера внутри Telegram. Напоминания приходят через бота бесплатно.
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="font-semibold text-neutral-900 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-neutral-900" />
                Локальные платежные шлюзы
              </p>
              <p className="text-neutral-500 leading-relaxed pl-5">
                Поддержка Click, Payme и Uzum Pay для приема предоплаты или депозита. Никаких неявок без предупреждения.
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="font-semibold text-neutral-900 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-neutral-900" />
                Авторизация по номеру +998
              </p>
              <p className="text-neutral-500 leading-relaxed pl-5">
                Коды подтверждения сначала бесплатно отправляются в Telegram пользователю. Если чата нет, подключается локальный SMS шлюз Eskiz.
              </p>
            </div>

            <div className="space-y-1.5">
              <p className="font-semibold text-neutral-900 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-neutral-900" />
                Узбекский и русский языки
              </p>
              <p className="text-neutral-500 leading-relaxed pl-5">
                Интерфейс и тексты автоматических уведомлений доступны на узбекском (латиница) и русском языках.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Футер */}
      <footer className="border-t border-black/[0.06] py-6 px-6 text-center text-xs text-neutral-400">
        <p>© 2026 DIKIDI UZ. Ташкент, Узбекистан.</p>
      </footer>
    </div>
  );
}
