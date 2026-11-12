import type { ProductCategoryKey } from "./product";

export type BookingStatus = "PAID" | "PICKED_UP" | "RETURNED" | "COMPLETED" | "CANCELLED";
export type DeliveryMethod = "PICKUP" | "COURIER";

export interface BookingParty {
  id: string;
  name: string;
  avatar: string;
  avatarUrl: string | null;
  phone: string | null;
}

// Бронювання у форматі API (/api/bookings)
export interface Booking {
  id: string;
  code: string;
  status: BookingStatus;
  product: {
    id: string;
    name: string;
    categoryKey: ProductCategoryKey;
    accentColor: string;
    image: string | null;
    location: string;
    pricePerDay: number;
    price3Days: number | null;
    priceWeek: number | null;
  };
  renter: BookingParty;
  owner: BookingParty;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD, включно
  days: number;
  deliveryMethod: DeliveryMethod;
  deliveryAddress: string | null;
  rentAmount: number;
  deliveryCost: number;
  protection: boolean;
  protectionCost: number;
  serviceFee: number; // сервісний збір орендаря (5%)
  ownerCommission: number; // комісія з власника (15%)
  ownerPayout: number; // отримує власник
  totalAmount: number;
  depositAmount: number;
  returnPhoto: string | null;
  ownerNote: string | null;
  paidAt: string;
  pickedUpAt: string | null;
  returnedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  reviewedByRenter: boolean;
  reviewedByOwner: boolean;
}
