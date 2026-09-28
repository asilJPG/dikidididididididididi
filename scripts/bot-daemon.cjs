const fs = require("fs");
const path = require("path");

// Загрузка .env переменных
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

async function handleUpdate(update) {
  if (!update.message) return;
  const { chat, from, text, contact } = update.message;
  if (!from || !chat) return;

  const chatId = chat.id;
  const telegramId = String(from.id);
  const telegramUsername = from.username || null;
  const fullName = `${from.first_name || ""} ${from.last_name || ""}`.trim() || "Пользователь";

  // 1. Команда /start
  if (text && text.startsWith("/start")) {
    console.log(`[Telegram Bot] /start от ${fullName} (@${telegramUsername || "no_user"}, id: ${telegramId})`);

    const welcomeMsg =
      `👋 Здравствуйте, <b>${from.first_name || "друг"}</b>!\n\n` +
      `Добро пожаловать в <b>DIKIDI UZ</b> — сервис онлайн-записи и управления салонами красоты.\n\n` +
      `Чтобы получать проверочные коды для входа и уведомления о записях прямо сюда, нажмите кнопку ниже:\n\n` +
      `👇 <b>«Поделиться номером телефона»</b>`;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: welcomeMsg,
        parse_mode: "HTML",
        reply_markup: {
          keyboard: [
            [
              {
                text: "📱 Поделиться номером телефона",
                request_contact: true,
              },
            ],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }),
    });
    return;
  }

  // 2. Пользователь поделился номером телефона
  if (contact && contact.phone_number) {
    let rawPhone = contact.phone_number;
    if (!rawPhone.startsWith("+")) {
      rawPhone = "+" + rawPhone;
    }
    const cleaned = rawPhone.replace(/[^\d+]/g, "");
    const withoutPlus = cleaned.replace("+", "");

    console.log(`[Telegram Bot] Получен контакт: ${cleaned} от ${fullName} (chatId: ${chatId})`);

    // Привязываем к User
    const existingUser = await prisma.user.findFirst({
      where: { phone: { in: [cleaned, withoutPlus] } },
    });

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          telegramId,
          telegramChatId: String(chatId),
          telegramUsername,
        },
      });
      console.log(`[Telegram Bot] Пользователь ${cleaned} обновлен c telegramChatId=${chatId}`);
    } else {
      await prisma.user.create({
        data: {
          phone: cleaned,
          fullName,
          role: "CLIENT",
          telegramId,
          telegramChatId: String(chatId),
          telegramUsername,
        },
      });
      console.log(`[Telegram Bot] Создан новый пользователь ${cleaned} c telegramChatId=${chatId}`);
    }

    // Привязываем к Customer записям
    await prisma.customer.updateMany({
      where: { phone: { in: [cleaned, withoutPlus] } },
      data: {
        telegramId,
        telegramChatId: String(chatId),
        telegramUsername,
      },
    });

    const successMsg =
      `✅ <b>Номер ${rawPhone} успешно привязан к вашему аккаунту DIKIDI!</b>\n\n` +
      `Теперь при входе в мобильное приложение проверочный код будет моментально приходить сюда в Telegram.\n\n` +
      `<i>Вы можете открыть приложение и нажать «Получить код».</i>`;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: successMsg,
        parse_mode: "HTML",
        reply_markup: {
          remove_keyboard: true,
        },
      }),
    });
  }
}

async function startPolling() {
  if (!BOT_TOKEN) {
    console.error("[Telegram Bot] Ошибка: TELEGRAM_BOT_TOKEN не задан!");
    process.exit(1);
  }

  console.log("[Telegram Bot] Удаление вебхука для включения polling...");
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook?drop_pending_updates=false`);
    const data = await res.json();
    console.log("[Telegram Bot] Результат deleteWebhook:", data);
  } catch (e) {
    console.error("[Telegram Bot] Ошибка deleteWebhook:", e.message);
  }

  console.log("[Telegram Bot] Демон запущен. Ожидание сообщений от пользователей...");

  let offset = 0;

  while (true) {
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=25`
      );
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          await handleUpdate(update);
        }
      } else if (!data.ok) {
        console.error("[Telegram Bot] Telegram API error:", data.description);
        await new Promise((r) => setTimeout(r, 4000));
      }
    } catch (err) {
      console.error("[Telegram Bot] Ошибка сети при получении updates:", err.message);
      await new Promise((r) => setTimeout(r, 4000));
    }
  }
}

startPolling();
