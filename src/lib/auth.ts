import crypto from "crypto";

export const SESSION_COOKIE_NAME = "dbju_session";

// Хешування паролю за допомогою scrypt із сіллю
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

// Перевірка введеного паролю проти хешу
export function verifyPassword(password: string, combinedHash: string): boolean {
  try {
    const [salt, key] = combinedHash.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

// Тестовий пароль адміна з локальної розробки. Якщо базу перенесли на сервер разом з ним,
// вхід з таким паролем на сервері блокується, поки не задано новий (npm run db:seed з ADMIN_PASSWORD).
const DEV_ADMIN_PASSWORD = "admin123";
export function isBlockedDevPassword(password: string): boolean {
  return process.env.NODE_ENV === "production" && password === DEV_ADMIN_PASSWORD;
}
