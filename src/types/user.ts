export interface CurrentUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "USER" | "ADMIN";
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
  phone: string | null;
  avatar: string | null;
  avatarUrl: string | null;
  bio: string | null;
  verifiedAt: string | null;
  plusUntil: string | null;
  createdAt: string;
}

export interface ProfileStats {
  earned: number;
  withdrawn: number;
  balance: number;
  pendingEarnings: number;
  activeListings: number;
  favoritesCount: number;
  activeRentals: number;
  ownerActionNeeded: number;
  saved: number;
  itemsNotBought: number;
  co2Kg: number;
}
