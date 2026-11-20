import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

// Створює (або оновлює) акаунт адміністратора.
//   ADMIN_EMAIL     — email адміна (за замовчуванням admin@dbju.ua)
//   ADMIN_PASSWORD  — пароль; на сервері (NODE_ENV=production) обов'язковий, щонайменше 12 символів.
// Локально без ADMIN_PASSWORD використовується тестовий пароль admin123 — він працює ЛИШЕ локально:
// на сервері вхід з ним заблоковано (див. src/lib/auth.ts → isDevAdminPassword).

const prisma = new PrismaClient();
const DEV_PASSWORD = "admin123";

async function main() {
  const isProd = process.env.NODE_ENV === "production";
  const email = (process.env.ADMIN_EMAIL || "admin@dbju.ua").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || (isProd ? "" : DEV_PASSWORD);

  if (isProd && password.length < 12) {
    throw new Error("Задайте ADMIN_PASSWORD (щонайменше 12 символів), щоб створити адміністратора на сервері.");
  }

  const profile = {
    name: "Анна К.",
    firstName: "Анна",
    lastName: "К.",
    role: "ADMIN" as const,
    isVerified: true,
    avatar: "AK",
  };
  const hashed = hashPassword(password);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", password: hashed },
    create: { ...profile, email, password: hashed, phone: "+380 (50) 123-45-67" },
  });

  console.log(`Адміністратор готовий: ${admin.email}${password === DEV_PASSWORD ? " (тестовий пароль admin123 — лише для локальної роботи)" : ""}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
