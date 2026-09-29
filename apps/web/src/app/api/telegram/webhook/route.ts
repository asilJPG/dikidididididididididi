import { NextResponse } from "next/server";
import { prisma } from "@dikidi/database";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const update = await request.json();

    if (!update.message) {
      return NextResponse.json({ ok: true });
    }

    const { chat, from, text, contact } = update.message;
    const chatId = chat.id;
    const telegramId = String(from.id);
    const telegramUsername = from.username || null;
    const fullName = `${from.first_name || ""} ${from.last_name || ""}`.trim() || "Клиент";

    // 1. Если пользователь нажал /start (поддерживаем deep-link: /start <slug>)
    if (text && text.startsWith("/start")) {
      const parts = text.split(" ");
      const requestedSlug = parts.length > 1 ? parts[1].trim() : null;

      // Ищем салон по slug или берем первый салон в системе
      let salon = null;
      if (requestedSlug) {
        salon = await prisma.salon.findUnique({
          where: { slug: requestedSlug },
        });
      }
      if (!salon) {
        salon = await prisma.salon.findFirst();
      }

      const slug = salon ? salon.slug : "bro-barbershop";
      const salonName = salon ? salon.name : "LOOK UZ";

      // Базовый URL приложения
      const host = request.headers.get("host") || "localhost:3000";
      const proto = request.headers.get("x-forwarded-proto") || "http";
      const appUrl = `${proto}://${host}/b/${slug}`;

      // Приветствие только с кнопкой открытия Mini App — никакого лишнего текста и баннеров!
      await sendTelegramMessage(
        chatId,
        `👋 Здравствуйте, <b>${from.first_name}</b>!\n\n` +
          `Онлайн-запись в <b>${salonName}</b>:\n` +
          `Выберите услугу, мастера и удобное время в один клик.`,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "📅 Открыть онлайн-запись",
                  web_app: { url: appUrl },
                },
              ],
            ],
          },
        }
      );

      return NextResponse.json({ ok: true });
    }

    // 2. Если пользователь отправил свой контакт (номер телефона)
    if (contact && contact.phone_number) {
      let rawPhone = contact.phone_number;
      if (!rawPhone.startsWith("+")) {
        rawPhone = "+" + rawPhone;
      }

      // Привязываем номер к Telegram ID в базе данных
      const salon = await prisma.salon.findFirst();
      if (salon) {
        await prisma.customer.upsert({
          where: {
            salonId_phone: {
              salonId: salon.id,
              phone: rawPhone,
            },
          },
          update: {
            telegramId,
            telegramChatId: String(chatId),
            telegramUsername,
          },
          create: {
            salonId: salon.id,
            fullName,
            phone: rawPhone,
            telegramId,
            telegramChatId: String(chatId),
            telegramUsername,
          },
        });
      }

      await sendTelegramMessage(
        chatId,
        `✅ Ваш номер <b>${rawPhone}</b> успешно привязан!\nТеперь все коды входа и напоминания о визитах будут приходить прямо сюда бесплатно.`
      );

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
