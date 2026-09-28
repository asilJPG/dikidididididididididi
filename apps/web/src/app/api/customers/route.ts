import { NextResponse } from "next/server";
import { prisma } from "@dikidi/database";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const salonId = searchParams.get("salonId");
    const query = searchParams.get("query")?.trim() || "";

    if (!salonId) {
      return NextResponse.json({ error: "salonId обязателен" }, { status: 400 });
    }

    const customers = await prisma.customer.findMany({
      where: {
        salonId,
        OR: query
          ? [
              { fullName: { contains: query } },
              { phone: { contains: query } },
              { notes: { contains: query } },
            ]
          : undefined,
      },
      include: {
        appointments: {
          orderBy: { startDateTime: "desc" },
          take: 3,
          include: {
            service: true,
            staff: true,
          },
        },
      },
      orderBy: { totalSpent: "desc" },
    });

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Customers fetch error:", error);
    return NextResponse.json({ error: "Ошибка загрузки клиентов" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { salonId, fullName, phone, notes, discountPercent = 0 } = body;

    if (!salonId || !fullName || !phone) {
      return NextResponse.json({ error: "Заполните обязательные поля" }, { status: 400 });
    }

    const customer = await prisma.customer.upsert({
      where: {
        salonId_phone: {
          salonId,
          phone,
        },
      },
      update: {
        fullName,
        notes,
        discountPercent: Number(discountPercent),
      },
      create: {
        salonId,
        fullName,
        phone,
        notes,
        discountPercent: Number(discountPercent),
      },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Customer creation error:", error);
    return NextResponse.json({ error: "Ошибка сохранения клиента" }, { status: 500 });
  }
}
