import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with admin account...");

  const hashedPassword = hashPassword("admin123");

  const admin = await prisma.user.upsert({
    where: { email: "admin@dbju.ua" },
    update: {
      name: "Анна К.",
      firstName: "Анна",
      lastName: "К.",
      role: "ADMIN",
      password: hashedPassword,
      isVerified: true,
      phone: "+380 (50) 123-45-67",
      avatar: "AK",
    },
    create: {
      name: "Анна К.",
      firstName: "Анна",
      lastName: "К.",
      email: "admin@dbju.ua",
      password: hashedPassword,
      role: "ADMIN",
      isVerified: true,
      phone: "+380 (50) 123-45-67",
      avatar: "AK",
    },
  });

  console.log("Admin user ready with password 'admin123':", admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
