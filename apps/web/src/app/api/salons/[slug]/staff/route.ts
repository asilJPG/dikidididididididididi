import { NextResponse } from "next/server";
import { prisma } from "@dikidi/database";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();
    const { fullName, specialty, phone, commissionPercent = 40 } = body;

    if (!fullName || !specialty) {
      return NextResponse.json(
        { error: "Укажите имя и специальность мастера" },
        { status: 400 }
      );
    }

    const salon = await prisma.salon.findUnique({
      where: { slug },
      include: { services: true },
    });

    if (!salon) {
      return NextResponse.json({ error: "Салон не найден" }, { status: 404 });
    }

    let userId: string | undefined = undefined;

    // Если указан телефон мастера, ищем или создаем пользователя User с ролью MASTER
    if (phone) {
      const cleanPhone = phone.replace(/[^\d+]/g, "");
      let user = await prisma.user.findUnique({
        where: { phone: cleanPhone },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            phone: cleanPhone,
            fullName,
            role: "MASTER",
          },
        });
      }
      userId = user.id;
    }

    const staff = await prisma.staff.create({
      data: {
        salonId: salon.id,
        userId: userId || null,
        fullName,
        specialty,
        phone: phone ? phone.replace(/[^\d+]/g, "") : null,
        commissionPercent: Number(commissionPercent),
        isActive: true,
      },
    });

    // Автоматически привязываем мастера ко всем текущим услугам салона
    if (salon.services.length > 0) {
      await prisma.staffService.createMany({
        data: salon.services.map((s: { id: string }) => ({
          staffId: staff.id,
          serviceId: s.id,
        })),
      });
    }

    return NextResponse.json({ success: true, staff });
  } catch (error) {
    console.error("Create staff error:", error);
    return NextResponse.json(
      { error: "Не удалось добавить мастера" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, fullName, specialty, phone, commissionPercent, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID мастера обязателен" }, { status: 400 });
    }

    const updated = await prisma.staff.update({
      where: { id },
      data: {
        ...(fullName ? { fullName } : {}),
        ...(specialty ? { specialty } : {}),
        ...(phone ? { phone: phone.replace(/[^\d+]/g, "") } : {}),
        ...(commissionPercent !== undefined ? { commissionPercent: Number(commissionPercent) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
      },
    });

    return NextResponse.json({ success: true, staff: updated });
  } catch (error) {
    console.error("Update staff error:", error);
    return NextResponse.json(
      { error: "Не удалось обновить мастера" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID мастера обязателен" }, { status: 400 });
    }

    await prisma.staff.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Мастер удален" });
  } catch (error) {
    console.error("Delete staff error:", error);
    return NextResponse.json(
      { error: "Не удалось удалить мастера" },
      { status: 500 }
    );
  }
}
