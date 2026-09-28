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

    const cleanedPhone = phone.replace(/[^\d+]/g, "");

    // Ищем активный код
    const validCode = await prisma.verificationCode.findFirst({
      where: {
        phone: cleanedPhone,
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

    // Помечаем код как использованный
    await prisma.verificationCode.update({
      where: { id: validCode.id },
      data: { isUsed: true },
    });

    // Находим или создаем пользователя
    let user = await prisma.user.findUnique({
      where: { phone: cleanedPhone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone: cleanedPhone,
          fullName: fullName || "Пользователь",
          role,
        },
      });
    }

    return NextResponse.json({
      success: true,
      user,
      message: "Успешная авторизация!",
    });
  } catch (err) {
    console.error("Verification error:", err);
    return NextResponse.json(
      { error: "Ошибка при проверке кода" },
      { status: 500 }
    );
  }
}
