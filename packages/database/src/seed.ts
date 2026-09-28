import { PrismaClient } from "@prisma/client";
import { UserRole, BookingStatus, BookingSource, PaymentMethod, PaymentStatus } from "./index";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Начинаем наполнение базы данных тестовыми данными для Узбекистана...");

  // Очистка старых данных
  await prisma.review.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.break.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.staffService.deleteMany();
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.salon.deleteMany();
  await prisma.user.deleteMany();

  // 1. Создаем владельца салона
  const owner = await prisma.user.create({
    data: {
      phone: "+998901234567",
      fullName: "Сардор Алимов",
      role: UserRole.OWNER,
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
  });

  // 2. Создаем салон
  const salon = await prisma.salon.create({
    data: {
      ownerId: owner.id,
      name: "Bro Barbershop Tashkent",
      slug: "bro-barbershop",
      phone: "+998712001122",
      city: "Ташкент",
      address: "Мирабадский район, ул. Тараса Шевченко, 21",
      landmark: "Ориентир: кафе Perfectum / метро Минг Урик",
      description: "Премиальный мужской барбершоп в центре Ташкента. Стильные стрижки, оформление бороды, кофе и атмосфера.",
      logoUrl: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200",
      rating: 4.95,
      reviewCount: 48,
    },
  });

  // 3. Создаем категории услуг
  const catHair = await prisma.category.create({
    data: {
      salonId: salon.id,
      nameRu: "Стрижки и укладки",
      nameUz: "Soch turmagi va parvarish",
      sortOrder: 1,
    },
  });

  const catBeard = await prisma.category.create({
    data: {
      salonId: salon.id,
      nameRu: "Борода и усы",
      nameUz: "Soqol va mo'ylov",
      sortOrder: 2,
    },
  });

  const catComplex = await prisma.category.create({
    data: {
      salonId: salon.id,
      nameRu: "Комплексные пакеты",
      nameUz: "Kompleks xizmatlar",
      sortOrder: 3,
    },
  });

  // 4. Создаем услуги
  const srvHaircut = await prisma.service.create({
    data: {
      salonId: salon.id,
      categoryId: catHair.id,
      nameRu: "Мужская стрижка",
      nameUz: "Erkaklar soch turmagi",
      description: "Мытье головы, индивидуальный подбор формы, стрижка ножницами и машинкой, стайлинг.",
      durationMinutes: 45,
      price: 150000, // 150 000 UZS
    },
  });

  const srvFade = await prisma.service.create({
    data: {
      salonId: salon.id,
      categoryId: catHair.id,
      nameRu: "Стрижка Fade (Фейд)",
      nameUz: "Fade soch turmagi",
      description: "Идеальный плавный дымчатый переход с нуля с полировкой контуров.",
      durationMinutes: 45,
      price: 170000,
    },
  });

  const srvBeard = await prisma.service.create({
    data: {
      salonId: salon.id,
      categoryId: catBeard.id,
      nameRu: "Моделирование бороды",
      nameUz: "Soqol shakllantirish",
      description: "Распаривание горячим полотенцем, оформление четких контуров опасной бритвой, масла.",
      durationMinutes: 30,
      price: 100000,
    },
  });

  const srvCombo = await prisma.service.create({
    data: {
      salonId: salon.id,
      categoryId: catComplex.id,
      nameRu: "Комплекс «Стрижка + Борода»",
      nameUz: "Kompleks «Soch + Soqol»",
      description: "Полный образ для истинного джентльмена по выгодной цене.",
      durationMinutes: 75,
      price: 220000,
    },
  });

  // 5. Создаем мастеров (Staff)
  const master1 = await prisma.staff.create({
    data: {
      salonId: salon.id,
      fullName: "Азиз Рустамов",
      specialty: "Шеф-барбер (Топ-мастер)",
      phone: "+998931112233",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
      rating: 5.0,
      reviewCount: 32,
      commissionPercent: 50,
    },
  });

  const master2 = await prisma.staff.create({
    data: {
      salonId: salon.id,
      fullName: "Тимур Ибрагимов",
      specialty: "Барбер-стилист",
      phone: "+998974445566",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
      rating: 4.9,
      reviewCount: 16,
      commissionPercent: 40,
    },
  });

  // Привязка услуг к мастерам
  await prisma.staffService.createMany({
    data: [
      { staffId: master1.id, serviceId: srvHaircut.id },
      { staffId: master1.id, serviceId: srvFade.id },
      { staffId: master1.id, serviceId: srvBeard.id },
      { staffId: master1.id, serviceId: srvCombo.id },
      { staffId: master2.id, serviceId: srvHaircut.id },
      { staffId: master2.id, serviceId: srvBeard.id },
    ],
  });

  // График работы мастеров (Понедельник - Суббота: 10:00 - 20:00)
  for (let day = 1; day <= 6; day++) {
    const sched1 = await prisma.schedule.create({
      data: {
        staffId: master1.id,
        dayOfWeek: day,
        startTime: "10:00",
        endTime: "20:00",
        isDayOff: false,
      },
    });

    await prisma.break.create({
      data: {
        scheduleId: sched1.id,
        startTime: "14:00",
        endTime: "15:00",
        title: "Обед",
      },
    });

    await prisma.schedule.create({
      data: {
        staffId: master2.id,
        dayOfWeek: day,
        startTime: "11:00",
        endTime: "21:00",
        isDayOff: day === 1,
      },
    });
  }

  // 6. База клиентов (CRM)
  const cust1 = await prisma.customer.create({
    data: {
      salonId: salon.id,
      fullName: "Джамшид Каримов",
      phone: "+998909998877",
      notes: "Любит кофе американо без сахара. Всегда стрижется под насадку 1.5 по бокам.",
      totalVisits: 5,
      totalSpent: 750000,
    },
  });

  const cust2 = await prisma.customer.create({
    data: {
      salonId: salon.id,
      fullName: "Бобур Мирзаев",
      phone: "+998993332211",
      notes: "Обычно записывается через Telegram.",
      totalVisits: 2,
      totalSpent: 320000,
    },
  });

  // 7. Создаем тестовые записи на сегодня
  const today = new Date();
  const slot1Start = new Date(today);
  slot1Start.setHours(11, 0, 0, 0);
  const slot1End = new Date(today);
  slot1End.setHours(11, 45, 0, 0);

  const slot2Start = new Date(today);
  slot2Start.setHours(15, 30, 0, 0);
  const slot2End = new Date(today);
  slot2End.setHours(16, 45, 0, 0);

  await prisma.appointment.create({
    data: {
      salonId: salon.id,
      staffId: master1.id,
      serviceId: srvHaircut.id,
      customerId: cust1.id,
      startDateTime: slot1Start,
      endDateTime: slot1End,
      status: BookingStatus.CONFIRMED,
      source: BookingSource.TELEGRAM_BOT,
      price: 150000,
      clientName: cust1.fullName,
      clientPhone: cust1.phone,
      paymentMethod: PaymentMethod.CLICK,
      paymentStatus: PaymentStatus.PAID,
      paidAmount: 150000,
    },
  });

  await prisma.appointment.create({
    data: {
      salonId: salon.id,
      staffId: master1.id,
      serviceId: srvCombo.id,
      customerId: cust2.id,
      startDateTime: slot2Start,
      endDateTime: slot2End,
      status: BookingStatus.PENDING,
      source: BookingSource.ONLINE_WIDGET,
      price: 220000,
      clientName: cust2.fullName,
      clientPhone: cust2.phone,
      paymentMethod: PaymentMethod.CASH,
      paymentStatus: PaymentStatus.UNPAID,
    },
  });

  console.log("✅ Тестовые данные успешно загружены!");
  console.log(`Салон: ${salon.name} (ссылка: /b/${salon.slug})`);
  console.log(`Мастера: ${master1.fullName}, ${master2.fullName}`);
}

main()
  .catch((e) => {
    console.error("Ошибка сидинга:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
