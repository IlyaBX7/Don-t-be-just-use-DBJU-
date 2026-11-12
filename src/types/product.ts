import type { CategoryKey } from "../lib/categories";

export type ProductCategoryKey = CategoryKey;

export interface PricingTiers {
  oneDay: number;
  threeDays: number;
  week: number;
}

// Товар у форматі, який віддає API (/api/products)
export interface Product {
  id: string;
  name: string;
  fullTitle?: string;
  description: string;
  category: string; // українська назва категорії
  categoryKey: ProductCategoryKey;
  images: string[];

  // Оренда та тарифи
  rentalPricePerDay: number;
  pricingTiers: PricingTiers;
  depositAmount: number;
  minRentDays: number;
  marketBuyPrice?: number;
  purchasePrice?: number;
  buybackRebatePercent: number;

  // Адреса самовивозу
  location: string; // готовий текст для показу
  city: string | null;
  region: string | null;
  street: string | null;
  lat: number | null;
  lng: number | null;

  // Власник (з таблиці User)
  ownerId: string;
  ownerName: string;
  ownerInitials: string;
  ownerAvatarUrl: string | null;
  ownerRating: number;
  reviewsCount: number;
  verifiedByDiia: boolean;
  rentalCount: number;

  // Комплектація та стан
  includedKit: string[];
  features: Record<string, string>;
  accentColor: string; // пастельний фон картки, залежить від категорії
  status: 'AVAILABLE' | 'RENTED' | 'HIDDEN';
  // Якщо річ зараз в орендаря — до якої дати (включно) і на якому етапі
  rentedUntil: string | null;
  rentalPhase: 'IN_USE' | 'RETURNING' | null;
  condition: string;
  createdAt: string;
}
