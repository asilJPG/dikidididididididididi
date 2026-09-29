import { NextResponse } from "next/server";
import { prisma } from "@dikidi/database";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();
    const { nameRu, price, durationMinutes = 45, categoryId, staffIds } = body;

    if (!nameRu || !price) {
      return NextResponse.json(
        { error: "Укажите название и стоимость услуги" },
        { status: 400 }
      );
    }

    const salon = await prisma.salon.findUnique({
      where: { slug },
      include: {
        categories: { orderBy: { sortOrder: "asc" } },
        staff: { where: { isActive: true } },
      },
    });

    if (!salon) {
      return NextResponse.json({ error: "Салон не найден" }, { status: 404 });
    }

    // Привязываем к существующей категории или создаем дефолтную
    let targetCategoryId = categoryId;
    if (!targetCategoryId) {
      if (salon.categories.length > 0) {
        targetCategoryId = salon.categories[0].id;
      } else {
        const newCat = await prisma.category.create({
          data: {
            salonId: salon.id,
            nameRu: "Основные услуги",
          },
        });
        targetCategoryId = newCat.id;
      }
    }

    const service = await prisma.service.create({
      data: {
        salonId: salon.id,
        categoryId: targetCategoryId,
        nameRu,
        price: Number(price),
        durationMinutes: Number(durationMinutes),
        isActive: true,
      },
    });

    // Привязываем мастеров к услуге
    const targetStaffIds: string[] =
      Array.isArray(staffIds) && staffIds.length > 0
        ? staffIds
        : salon.staff.map((st: any) => st.id);

    if (targetStaffIds.length > 0) {
      await prisma.staffService.createMany({
        data: targetStaffIds.map((staffId: string) => ({
          serviceId: service.id,
          staffId,
        })),
        skipDuplicates: true,
      });
    }

    const fullService = await prisma.service.findUnique({
      where: { id: service.id },
      include: {
        staffServices: {
          select: { staffId: true },
        },
      },
    });

    return NextResponse.json({ success: true, service: fullService });
  } catch (error) {
    console.error("Create service error:", error);
    return NextResponse.json(
      { error: "Не удалось создать услугу" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, nameRu, price, durationMinutes, isActive, categoryId, staffIds } = body;

    if (!id) {
      return NextResponse.json({ error: "ID услуги обязателен" }, { status: 400 });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(nameRu ? { nameRu } : {}),
        ...(price !== undefined ? { price: Number(price) } : {}),
        ...(durationMinutes !== undefined ? { durationMinutes: Number(durationMinutes) } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
        ...(categoryId !== undefined ? { categoryId } : {}),
      },
    });

    // Обновляем связь мастеров с услугой, если передан массив staffIds
    if (Array.isArray(staffIds)) {
      await prisma.staffService.deleteMany({
        where: { serviceId: id },
      });

      if (staffIds.length > 0) {
        await prisma.staffService.createMany({
          data: staffIds.map((staffId: string) => ({
            serviceId: id,
            staffId,
          })),
          skipDuplicates: true,
        });
      }
    }

    const fullUpdated = await prisma.service.findUnique({
      where: { id },
      include: {
        staffServices: {
          select: { staffId: true },
        },
      },
    });

    return NextResponse.json({ success: true, service: fullUpdated });
  } catch (error) {
    console.error("Update service error:", error);
    return NextResponse.json(
      { error: "Не удалось обновить услугу" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID услуги обязателен" }, { status: 400 });
    }

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Услуга удалена" });
  } catch (error) {
    console.error("Delete service error:", error);
    return NextResponse.json(
      { error: "Не удалось удалить услугу" },
      { status: 500 }
    );
  }
}
