import { NextResponse } from "next/server";
import { prisma } from "@dikidi/database";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      salonName,
      categoryType = "BARBERSHOP",
      city = "Ташкент",
      address,
      landmark,
      ownerName,
      phone,
    } = body;

    if (!salonName || !phone || !address) {
      return NextResponse.json(
        { error: "Укажите название заведения, адрес и номер телефона" },
        { status: 400 }
      );
    }

    let cleanPhone = phone.replace(/[^\d+]/g, "");
    if (!cleanPhone.startsWith("+")) {
      cleanPhone = "+" + cleanPhone;
    }
    const phoneWithoutPlus = cleanPhone.replace("+", "");

    // 1. Создаем или обновляем пользователя как OWNER
    let user = await prisma.user.findFirst({
      where: { phone: { in: [cleanPhone, phoneWithoutPlus] } },
    });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: "OWNER",
          fullName: ownerName || user.fullName || salonName,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          phone: cleanPhone,
          fullName: ownerName || salonName,
          role: "OWNER",
        },
      });
    }

    // 2. Генерируем уникальный slug
    const baseSlug = salonName
      .toLowerCase()
      .trim()
      .replace(/[а-яё]/gi, (c: string) => {
        const ruToLat: Record<string, string> = {
          а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
          з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
          п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts",
          ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
        };
        return ruToLat[c.toLowerCase()] || c;
      })
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const slug = `${baseSlug || "salon"}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Создаем салон
    const salon = await prisma.salon.create({
      data: {
        ownerId: user.id,
        name: salonName,
        slug,
        phone: cleanPhone,
        city: city || "Ташкент",
        address,
        landmark: landmark || null,
        description: `Добро пожаловать в ${salonName}! Записывайтесь онлайн в любое удобное время.`,
        rating: 5.0,
        reviewCount: 0,
        isVerified: true,
      },
    });

    // 4. Создаем стартовую категорию и услуги
    let categoryName = "Основные услуги";
    let starterServices = [
      { nameRu: "Стрижка и стайлинг", duration: 45, price: 120000 },
      { nameRu: "Моделирование и уход", duration: 30, price: 70000 },
      { nameRu: "Комплексный уход", duration: 60, price: 170000 },
    ];

    if (categoryType === "BARBERSHOP") {
      categoryName = "Барбершоп и бритье";
      starterServices = [
        { nameRu: "Мужская стрижка", duration: 45, price: 120000 },
        { nameRu: "Моделирование бороды", duration: 30, price: 70000 },
        { nameRu: "Стрижка + Борода (Комплекс)", duration: 60, price: 180000 },
      ];
    } else if (categoryType === "NAILS") {
      categoryName = "Ногтевой сервис";
      starterServices = [
        { nameRu: "Маникюр с покрытием гель-лак", duration: 60, price: 150000 },
        { nameRu: "Smart-педикюр", duration: 60, price: 180000 },
        { nameRu: "Снятие и уход", duration: 30, price: 60000 },
      ];
    } else if (categoryType === "COSMETOLOGY" || categoryType === "SPA") {
      categoryName = "Косметология и SPA";
      starterServices = [
        { nameRu: "Чистка лица / Уходовая маска", duration: 60, price: 250000 },
        { nameRu: "Расслабляющий массаж", duration: 60, price: 200000 },
        { nameRu: "Комплекс омоложения", duration: 90, price: 400000 },
      ];
    }

    const category = await prisma.category.create({
      data: {
        salonId: salon.id,
        nameRu: categoryName,
      },
    });

    // Создаем мастера по умолчанию
    const master = await prisma.staff.create({
      data: {
        salonId: salon.id,
        fullName: ownerName || "Топ-мастер",
        specialty: categoryType === "BARBERSHOP" ? "Барбер" : "Мастер-стилист",
        phone: cleanPhone,
        rating: 5.0,
        reviewCount: 0,
        isActive: true,
      },
    });

    // Создаем услуги и привязываем к мастеру
    for (const s of starterServices) {
      const createdService = await prisma.service.create({
        data: {
          salonId: salon.id,
          categoryId: category.id,
          nameRu: s.nameRu,
          durationMinutes: s.duration,
          price: s.price,
          isActive: true,
        },
      });

      await prisma.staffService.create({
        data: {
          staffId: master.id,
          serviceId: createdService.id,
        },
      });
    }

    // Полный обновленный пользователь со связанными салонами
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        ownedSalons: true,
        staffProfile: true,
      },
    });

    const response = NextResponse.json({
      success: true,
      salon,
      user: fullUser,
      message: "Заведение успешно зарегистрировано!",
    });

    // Устанавливаем куки авторизации
    response.cookies.set("dikidi_user_id", user.id, {
      path: "/",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
    response.cookies.set("dikidi_user_phone", user.phone, {
      path: "/",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Salon registration error:", error);
    return NextResponse.json(
      { error: "Не удалось зарегистрировать салон", details: error?.message },
      { status: 500 }
    );
  }
}
