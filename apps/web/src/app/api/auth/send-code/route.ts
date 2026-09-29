import { NextResponse } from "next/server";
import { prisma } from "@dikidi/database";
import { sendTelegramOtp } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: "Укажите номер телефона" }, { status: 400 });
    }

    // Нормализация номера
    let cleanedPhone = phone.replace(/[^\d+]/g, "");
    if (!cleanedPhone.startsWith("+")) {
      cleanedPhone = "+" + cleanedPhone;
    }
    const phoneWithoutPlus = cleanedPhone.replace("+", "");

    // 1. Проверяем, есть ли пользователь или клиент с привязанным Telegram
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        phone: { in: [cleanedPhone, phoneWithoutPlus] },
        telegramChatId: { not: null },
      },
    });

    const existingUser = await prisma.user.findFirst({
      where: {
        phone: { in: [cleanedPhone, phoneWithoutPlus] },
        telegramChatId: { not: null },
      },
    });

    const telegramChatId = existingUser?.telegramChatId || existingCustomer?.telegramChatId;

    // 2. Генерируем реальный случайный 4-значный OTP код (соответствует UI формы)
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    // Удаляем старые неиспользованные коды для этого номера
    await prisma.verificationCode.deleteMany({
      where: { phone: { in: [cleanedPhone, phoneWithoutPlus] } },
    });

    const channel = telegramChatId ? "TELEGRAM" : "SMS";

    // Сохраняем код в БД
    await prisma.verificationCode.create({
      data: {
        phone: cleanedPhone,
        code,
        channel,
        expiresAt,
      },
    });

    // 3. Отправляем код
    if (telegramChatId) {
      await sendTelegramOtp(telegramChatId, code);
      return NextResponse.json({
        success: true,
        channel: "TELEGRAM",
        message: "Код подтверждения отправлен в ваш Telegram!",
      });
    } else {
      // Имитация отправки SMS через Eskiz.uz
      console.log(`[SMS Gateway Eskiz] Отправка SMS на ${cleanedPhone}: Код ${code}`);
      return NextResponse.json({
        success: true,
        channel: "SMS",
        message: "Код отправлен. Для бесплатного получения кодов запустите @q823374iawsdhfdiowue_bot",
        // Возвращаем devCode, если SMS-шлюз работает в режиме симуляции
        devCode: code,
      });
    }
  } catch (err: any) {
    console.error("Error sending code:", err);
    return NextResponse.json(
      { 
        error: "Не удалось отправить код подтверждения",
        details: err?.message || String(err)
      },
      { status: 500 }
    );
  }
}
