import { NextResponse } from "next/server";
import { prisma } from "@dikidi/database";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const salon = await prisma.salon.findUnique({
      where: { slug },
      include: {
        categories: {
          orderBy: { sortOrder: "asc" },
          include: {
            services: {
              where: { isActive: true },
            },
          },
        },
        services: {
          where: { isActive: true },
        },
        staff: {
          where: { isActive: true },
          include: {
            staffServices: true,
            schedules: {
              include: {
                breaks: true,
              },
            },
          },
        },
      },
    });

    if (!salon) {
      return NextResponse.json(
        { error: "Салон не найден" },
        { status: 404 }
      );
    }

    return NextResponse.json({ salon });
  } catch (error) {
    console.error("Error fetching salon:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    const body = await request.json();
    const { name, phone, city, address, landmark, description } = body;

    const updated = await prisma.salon.update({
      where: { slug },
      data: {
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
        ...(city ? { city } : {}),
        ...(address ? { address } : {}),
        ...(landmark !== undefined ? { landmark } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });

    return NextResponse.json({ success: true, salon: updated });
  } catch (error) {
    console.error("Error updating salon:", error);
    return NextResponse.json(
      { error: "Не удалось обновить настройки заведения" },
      { status: 500 }
    );
  }
}

