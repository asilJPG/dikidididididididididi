import { NextResponse } from "next/server";
import { prisma } from "@dikidi/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, salonName, category, address, videoName, city = "Ташкент" } = body;

    if (!phone || !salonName || !address) {
      return NextResponse.json(
        { error: "Пожалуйста, укажите телефон, название салона и адрес" },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/[^\d+]/g, "");

    // Создаем запись заявки или салон со статусом проверки isVerified = false
    const slug = salonName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9а-яё]+/gi, "-")
      .replace(/^-+|-+$/g, "") + "-" + Math.floor(1000 + Math.random() * 9000);

    // Ищем или создаем пользователя
    let user = await prisma.user.findUnique({
      where: { phone: cleanPhone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: cleanPhone,
          fullName: salonName,
          role: "PENDING_VERIFICATION",
        },
      });
    }

    // Создаем предварительный салон с isVerified = false (на модерации)
    const salon = await prisma.salon.create({
      data: {
        ownerId: user.id,
        name: salonName,
        slug,
        phone: cleanPhone,
        city,
        address,
        isVerified: false, // На проверке!
        description: `Заявка на подключение. Видео рабочего места: ${videoName || "загружено"}. Категория: ${category || "Общая"}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Заявка успешно отправлена на модерацию",
      applicationId: salon.id,
    });
  } catch (error) {
    console.error("Business application error:", error);
    return NextResponse.json(
      { error: "Не удалось отправить заявку" },
      { status: 500 }
    );
  }
}
