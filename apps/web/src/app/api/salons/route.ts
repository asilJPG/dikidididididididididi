import { NextResponse } from "next/server";
import { prisma } from "@dikidi/database";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId");
    const ownerPhone = searchParams.get("ownerPhone");

    let whereClause: any = { isVerified: true };

    if (ownerId) {
      whereClause = { ownerId };
    } else if (ownerPhone) {
      const user = await prisma.user.findUnique({
        where: { phone: ownerPhone },
      });
      if (user) {
        whereClause = { ownerId: user.id };
      }
    }

    const salons = await prisma.salon.findMany({
      where: whereClause,
      include: {
        services: {
          where: { isActive: true },
        },
        staff: {
          where: { isActive: true },
        },
        categories: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { rating: "desc" },
    });

    return NextResponse.json({ salons });
  } catch (error) {
    console.error("Error fetching salons list:", error);
    return NextResponse.json(
      { error: "Ошибка при получении списка салонов" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, city = "Ташкент", address, ownerId, ownerPhone, description } = body;

    if (!name || (!ownerId && !ownerPhone)) {
      return NextResponse.json(
        { error: "Название салона и владелец обязательны" },
        { status: 400 }
      );
    }

    let actualOwnerId = ownerId;
    if (!actualOwnerId && ownerPhone) {
      const cleaned = ownerPhone.replace(/[^\d+]/g, "");
      let user = await prisma.user.findUnique({ where: { phone: cleaned } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            phone: cleaned,
            fullName: name,
            role: "OWNER",
          },
        });
      }
      actualOwnerId = user.id;
    }

    // Генерируем slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 25);
    const slug = `${baseSlug || "salon"}-${Date.now().toString().slice(-4)}`;

    const salon = await prisma.salon.create({
      data: {
        name: name.trim(),
        slug,
        phone: phone?.trim() || ownerPhone || "+998",
        city: city?.trim() || "Ташкент",
        address: address?.trim() || "Ташкент",
        description: description?.trim() || null,
        ownerId: actualOwnerId,
        isVerified: true,
      },
      include: {
        services: true,
        staff: true,
        categories: true,
      },
    });

    // Обновляем роль пользователя на OWNER
    await prisma.user.update({
      where: { id: actualOwnerId },
      data: { role: "OWNER" },
    });

    return NextResponse.json({ salon, success: true }, { status: 201 });
  } catch (error) {
    console.error("Error creating salon:", error);
    return NextResponse.json(
      { error: "Не удалось создать салон" },
      { status: 500 }
    );
  }
}

