import { NextResponse } from "next/server";
import { prisma } from "@dikidi/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { login, password } = body;

    if (!login || !password) {
      return NextResponse.json(
        { error: "Введите логин и пароль" },
        { status: 400 }
      );
    }

    const cleanLogin = login.replace(/[^\d+]/g, "");

    // Ищем пользователя по номеру телефона
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanLogin },
          { phone: login },
        ],
      },
      include: {
        ownedSalons: true,
        staffProfile: {
          include: { salon: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Аккаунт не найден. Проверьте правильность логина или подайте заявку на подключение." },
        { status: 401 }
      );
    }

    // Проверяем, есть ли у пользователя подключенный салон
    const hasSalon = user.ownedSalons && user.ownedSalons.length > 0;
    const hasStaffProfile = !!user.staffProfile;

    if (!hasSalon && !hasStaffProfile) {
      return NextResponse.json(
        { error: "Этот аккаунт зарегистрирован как клиент. Для входа в CRM требуется подключенный бизнес." },
        { status: 403 }
      );
    }

    // Проверяем статус верификации
    const verifiedSalon = user.ownedSalons?.find((s: { isVerified: boolean }) => s.isVerified !== false);
    if (!verifiedSalon && !hasStaffProfile) {
      return NextResponse.json(
        { error: "Ваша заявка на подключение бизнеса еще находится на проверке. Ожидайте SMS с подтверждением." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
      message: "Успешный вход в DIKIDI Business",
    });
  } catch (error) {
    console.error("Business login error:", error);
    return NextResponse.json(
      { error: "Ошибка при авторизации бизнеса" },
      { status: 500 }
    );
  }
}
