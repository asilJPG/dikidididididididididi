const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Отправка сообщения в Telegram чат
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  extra: Record<string, any> = {}
) {
  if (!BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN не задан в .env");
    return null;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        ...extra,
      }),
    });

    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Ошибка отправки сообщения в Telegram:", err);
    return null;
  }
}

/**
 * Отправка OTP-кода для подтверждения входа (Бесплатно вместо SMS!)
 */
export async function sendTelegramOtp(chatId: string | number, code: string) {
  const message = `🔐 <b>DIKIDI UZ: Код для входа</b>\n\nВаш проверочный код: <code>${code}</code>\n\n<i>Никому не сообщайте этот код. Срок действия: 2 минуты.</i>`;
  return sendTelegramMessage(chatId, message);
}

/**
 * Отправка уведомления о подтвержденной записи
 */
export async function sendTelegramBookingNotice(
  chatId: string | number,
  booking: {
    salonName: string;
    serviceName: string;
    masterName: string;
    dateTime: string;
    price: number;
    address: string;
  }
) {
  const message = `✅ <b>Вы записаны в ${booking.salonName}!</b>\n\n` +
    `💈 <b>Услуга:</b> ${booking.serviceName}\n` +
    `👤 <b>Мастер:</b> ${booking.masterName}\n` +
    `📅 <b>Время:</b> ${booking.dateTime}\n` +
    `📍 <b>Адрес:</b> ${booking.address}\n` +
    `💰 <b>К оплате:</b> ${new Intl.NumberFormat("ru-RU").format(booking.price)} UZS\n\n` +
    `<i>Мы пришлем вам напоминание за 2 часа до начала визита.</i>`;

  return sendTelegramMessage(chatId, message);
}

/**
 * Настройка кнопки Menu Button в Telegram боте для быстрого открытия Mini App
 */
export async function setBotMenuButton(webAppUrl: string) {
  if (!BOT_TOKEN) return null;

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setChatMenuButton`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menu_button: {
          type: "web_app",
          text: "💈 Онлайн-запись",
          web_app: {
            url: webAppUrl,
          },
        },
      }),
    });
    return await res.json();
  } catch (err) {
    console.error("Ошибка установки меню бота:", err);
    return null;
  }
}
