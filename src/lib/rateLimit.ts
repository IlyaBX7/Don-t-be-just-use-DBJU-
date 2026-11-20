import { prisma } from "./prisma";

// Ліміти спроб у базі даних (працюють і на кількох серверах).
// hit() записує спробу і повертає false, якщо за вікно їх уже забагато.

let lastCleanup = 0;

async function cleanup() {
  if (Date.now() - lastCleanup < 10 * 60 * 1000) return;
  lastCleanup = Date.now();
  await prisma.rateLimitHit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) } } }).catch(() => {});
}

export async function countHits(key: string, windowMs: number): Promise<number> {
  return prisma.rateLimitHit.count({ where: { key, createdAt: { gte: new Date(Date.now() - windowMs) } } });
}

export async function hit(key: string, limit: number, windowMs: number): Promise<boolean> {
  void cleanup();
  const n = await countHits(key, windowMs);
  if (n >= limit) return false;
  await prisma.rateLimitHit.create({ data: { key: key.slice(0, 191) } });
  return true;
}

export async function resetHits(key: string): Promise<void> {
  await prisma.rateLimitHit.deleteMany({ where: { key } });
}

// IP відвідувача за проксі хостингу. X-Real-IP ставить сам проксі (Railway, Vercel, nginx).
// З X-Forwarded-For беремо ОСТАННЮ адресу — її дописав наш проксі; першу клієнт може підробити.
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const chain = headers.get("x-forwarded-for")?.split(",").map((s) => s.trim()).filter(Boolean);
  return chain?.length ? chain[chain.length - 1] : "local";
}
