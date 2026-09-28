import { NextResponse } from "next/server";
import { prisma } from "@dikidi/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, code, role = "CLIENT", fullName } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Номер телефона и код обязательны" },
        { status: 400 }
      );
    }

    let cleanedPhone = phone.replace(/[^\d+]/g, "");
    if (!cleanedPhone.startsWith("+")) {
      cleanedPhone = "+" + cleanedPhone;
    }
    const phoneWithoutPlus = cleanedPhone.replace("+", "");

    // Ищем активный код в базе данных
    const validCode = await prisma.verificationCode.findFirst({
      where: {
        phone: { in: [cleanedPhone, phoneWithoutPlus] },
        code,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!validCode) {
      return NextResponse.json(
        { error: "Неверный код или срок его действия истек" },
        { status: 400 }
      );
    }

    if (validCode) {
      // Помечаем код как использованный
      await prisma.verificationCode.update({
        where: { id: validCode.id },
        data: { isUsed: true },
      });
    }

    // Находим или создаем пользователя
    let user = await prisma.user.findFirst({
      where: { phone: { in: [cleanedPhone, phoneWithoutPlus] } },
      include: {
        ownedSalons: true,
        staffProfile: {
          include: { salon: true },
        },
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: cleanedPhone,
          fullName: fullName || "Пользователь",
          role,
        },
        include: {
          ownedSalons: true,
          staffProfile: {
            include: { salon: true },
          },
        },
      });
    }

    const response = NextResponse.json({
      success: true,
      user,
      message: "Успешная авторизация!",
    });

    // Устанавливаем cookie сессии
    response.cookies.set("dikidi_user_id", user.id, {
      path: "/",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30, // 30 дней
      sameSite: "lax",
    });
    response.cookies.set("dikidi_user_phone", user.phone, {
      path: "/",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });

    return response;
  } catch (err) {
    console.error("Verification error:", err);
    return NextResponse.json(
      { error: "Ошибка при проверке кода" },
      { status: 500 }
    );
  }
}
