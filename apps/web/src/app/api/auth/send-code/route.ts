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

    // Нормализация номера (только цифры и плюс)
    const cleanedPhone = phone.replace(/[^\d+]/g, "");

    // 1. Проверяем, есть ли пользователь или клиент с привязанным Telegram
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        phone: cleanedPhone,
        telegramChatId: { not: null },
      },
    });

    const existingUser = await prisma.user.findFirst({
      where: {
        phone: cleanedPhone,
        telegramChatId: { not: null },
      },
    });

    const telegramChatId = existingUser?.telegramChatId || existingCustomer?.telegramChatId;

    // 2. Генерируем OTP код (пока дефолт 12121)
    const code = "12121";
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    // Удаляем старые неиспользованные коды для этого номера
    await prisma.verificationCode.deleteMany({
      where: { phone: cleanedPhone },
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
      const res = await sendTelegramOtp(telegramChatId, code);
      return NextResponse.json({
        success: true,
        channel: "TELEGRAM",
        message: "Код подтверждения отправлен в ваш Telegram!",
        // В dev режиме показываем код для удобства тестирования
        devCode: process.env.NODE_ENV !== "production" ? code : undefined,
      });
    } else {
      // Имитация отправки SMS через Eskiz.uz
      console.log(`[SMS Gateway Eskiz] Отправка SMS на ${cleanedPhone}: Код ${code}`);
      return NextResponse.json({
        success: true,
        channel: "SMS",
        message: "Код подтверждения отправлен по SMS",
        devCode: code, // возвращаем для тестирования
      });
    }
  } catch (err) {
    console.error("Error sending code:", err);
    return NextResponse.json(
      { error: "Не удалось отправить код подтверждения" },
      { status: 500 }
    );
  }
}
