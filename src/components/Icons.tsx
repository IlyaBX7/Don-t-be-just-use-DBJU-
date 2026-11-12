import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

// Drill / Ремонт
export const DrillIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M4 6h11a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
    <path d="M17 9h4" />
    <path d="M21 8v2" />
    <path d="M7 13v7a2 2 0 0 0 2 2h2a1 1 0 0 0 1-1v-8" />
    <path d="M7 15h3" />
  </svg>
);

// Camera / Техніка
export const CameraIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);

// Tent / Туризм
export const TentIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 3L2 20h20L12 3z" />
    <path d="M12 3v17" />
    <path d="M9 20l3-7 3 7" />
  </svg>
);

// Scooter / Транспорт
export const ScooterIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="5" cy="18" r="2.5" />
    <circle cx="19" cy="18" r="2.5" />
    <path d="M7.5 18h9" />
    <path d="M6 15.5l9-10" />
    <path d="M14 5.5h3" />
    <path d="M15 3v3" />
  </svg>
);

// Gamepad / Геймінг
export const GamepadIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="2" y="6" width="20" height="12" rx="6" />
    <path d="M6 12h4" />
    <path d="M8 10v4" />
    <circle cx="15.5" cy="10.5" r=".75" fill="currentColor" />
    <circle cx="17.5" cy="12.5" r=".75" fill="currentColor" />
  </svg>
);

// Stroller / Cart / Дитяче
export const CartStrollerIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="7" cy="19" r="2" />
    <circle cx="17" cy="19" r="2" />
    <path d="M3 5h2l2 9h11l2-7H6" />
    <path d="M6 14h11" />
  </svg>
);

// Globe / Спорт
export const GlobeSportIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a15 15 0 0 1 0 18" />
    <path d="M12 3a15 15 0 0 0 0 18" />
  </svg>
);

// Shield Trust
export const ShieldCheckIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

// User Person Icon
export const UserIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Postomat Locker Grid Icon
export const PostomatIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M3 15h18" />
    <path d="M9 3v18" />
    <path d="M15 3v18" />
  </svg>
);

// Search Magnifier
export const SearchIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4.35-4.35" />
  </svg>
);

// Heart Wishlist
export const HeartIcon = ({ size = 24, className = "", filled = false, ...props }: IconProps & { filled?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

// Location Pin
export const LocationPinIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// Scales / Оренда чи купівля
export const ScalesIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
    <path d="M7 21h10" />
    <path d="M12 3v18" />
    <path d="M3 7h18" />
  </svg>
);

// Box / Оренди
export const BoxIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

// Home Icon
export const HomeIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

// Plus Circle / Здати
export const PlusCircleIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
  </svg>
);

// Refresh / Продовжити
export const RefreshIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

// Sparkle / AI Icon
export const SparkleIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
  </svg>
);

// Check Icon
export const CheckIcon = ({ size = 18, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

// Arrow Left
export const ArrowLeftIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

// Chevron Right
export const ChevronRightIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

// QR Code SVG
export const QRCodePattern = ({ size = 96, className = "" }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="currentColor"
    className={className}
  >
    {/* Corner 1 */}
    <rect x="5" y="5" width="30" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
    <rect x="13" y="13" width="14" height="14" rx="2" />
    {/* Corner 2 */}
    <rect x="65" y="5" width="30" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
    <rect x="73" y="13" width="14" height="14" rx="2" />
    {/* Corner 3 */}
    <rect x="5" y="65" width="30" height="30" rx="4" fill="none" stroke="currentColor" strokeWidth="6" />
    <rect x="13" y="73" width="14" height="14" rx="2" />
    {/* Random QR data blocks */}
    <rect x="42" y="8" width="8" height="8" />
    <rect x="42" y="24" width="8" height="8" />
    <rect x="52" y="16" width="6" height="16" />
    <rect x="10" y="44" width="12" height="8" />
    <rect x="28" y="42" width="10" height="10" />
    <rect x="44" y="42" width="12" height="12" rx="2" />
    <rect x="62" y="44" width="8" height="18" />
    <rect x="76" y="42" width="14" height="8" />
    <rect x="44" y="60" width="8" height="14" />
    <rect x="58" y="68" width="16" height="8" />
    <rect x="80" y="58" width="10" height="16" />
    <rect x="44" y="80" width="18" height="10" />
    <rect x="70" y="82" width="20" height="8" />
  </svg>
);

// Leaf Icon (Eco & Growth)
export const LeafIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

// Wallet Bag Icon
export const WalletBagIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
    <path d="M3 6h18" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

// List / Listings Icon
export const ListBulletIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" strokeWidth="3" />
    <line x1="3" y1="12" x2="3.01" y2="12" strokeWidth="3" />
    <line x1="3" y1="18" x2="3.01" y2="18" strokeWidth="3" />
  </svg>
);

// Message / Support Icon
export const ChatBubbleIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </svg>
);

// Checkbox Square (Checked state)
export const CheckboxCheckedIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="6" />
    <path d="m7 12 3.5 3.5 6.5-7" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

// Logout Icon
export const LogoutIcon = ({ size = 24, className = "", ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);



// Спільна обгортка для лінійних іконок 24×24
const StrokeIcon = ({ size = 24, className = "", children, ...props }: IconProps & { children: React.ReactNode }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {children}
  </svg>
);

// Праска / Побут
export const IronIcon = (props: IconProps) => (
  <StrokeIcon {...props}>
    <path d="M3 18h18l-1.6-6.4A3.5 3.5 0 0 0 16 9H9a6 6 0 0 0-6 6v3z" />
    <path d="M9 9V6h8" />
    <path d="M8 14h1" />
  </StrokeIcon>
);

// Лапка / Зоотовари
export const PawIcon = (props: IconProps) => (
  <StrokeIcon {...props}>
    <circle cx="5.5" cy="10" r="1.8" />
    <circle cx="9.5" cy="5.5" r="1.8" />
    <circle cx="14.5" cy="5.5" r="1.8" />
    <circle cx="18.5" cy="10" r="1.8" />
    <path d="M12 11c-3 0-6 4.5-6 7a2.5 2.5 0 0 0 3.5 2.2c1.6-.7 3.4-.7 5 0A2.5 2.5 0 0 0 18 18c0-2.5-3-7-6-7z" />
  </StrokeIcon>
);

// Паросток / Сад і город
export const SproutIcon = (props: IconProps) => (
  <StrokeIcon {...props}>
    <path d="M12 21v-9" />
    <path d="M12 12C12 8 9 5 4 5c0 4.5 3 7 8 7z" />
    <path d="M12 10c0-3.5 2.5-6 7-6 0 4-2.5 6-7 6z" />
    <path d="M7 21h10" />
  </StrokeIcon>
);

// Подарунок / Свята та події
export const GiftIcon = (props: IconProps) => (
  <StrokeIcon {...props}>
    <rect x="3" y="8" width="18" height="4" rx="1" />
    <path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8" />
    <path d="M12 8v13" />
    <path d="M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5" />
    <path d="M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5" />
  </StrokeIcon>
);

// Нота / Музика
export const MusicIcon = (props: IconProps) => (
  <StrokeIcon {...props}>
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </StrokeIcon>
);

// Вішак / Одяг і костюми
export const HangerIcon = (props: IconProps) => (
  <StrokeIcon {...props}>
    <path d="M10 6a2 2 0 1 1 2.8 1.8c-.5.3-.8.8-.8 1.4V11" />
    <path d="M12 11l-8.6 6.1A1.6 1.6 0 0 0 4.3 20h15.4a1.6 1.6 0 0 0 .9-2.9L12 11z" />
  </StrokeIcon>
);
