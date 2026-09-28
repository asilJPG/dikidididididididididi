import { NextResponse } from "next/server";
import { prisma } from "@dikidi/database";

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();
    const { nameRu, price, durationMinutes = 45 } = body;

    if (!nameRu || !price) {
      return NextResponse.json(
        { error: "Укажите название и стоимость услуги" },
        { status: 400 }
      );
    }

    const salon = await prisma.salon.findUnique({
      where: { slug },
    });

    if (!salon) {
      return NextResponse.json({ error: "Салон не найден" }, { status: 404 });
    }

    const service = await prisma.service.create({
      data: {
        salonId: salon.id,
        nameRu,
        price: Number(price),
        durationMinutes: Number(durationMinutes),
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, service });
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
    const { id, nameRu, price, durationMinutes, isActive } = body;

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
      },
    });

    return NextResponse.json({ success: true, service: updated });
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
