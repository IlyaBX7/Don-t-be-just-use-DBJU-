"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LeafIcon,
  WalletBagIcon,
  ListBulletIcon,
  HeartIcon,
  SearchIcon,
  ChatBubbleIcon,
  ChevronRightIcon,
  CheckIcon,
  LogoutIcon,
  BoxIcon,
  UserIcon,
} from "../../components/Icons";
import { Footer } from "../../components/Footer/Footer";
import { useApp } from "../../components/AppProvider";
import { Avatar } from "../../components/Avatar";
import { ratingText } from "../../components/Reviews";
import { LoginRequired, PageLoading, ErrorBox } from "../../components/LoginRequired";
import { api } from "../../lib/api";
import { PLUS_PRICE } from "../../lib/pricing";
import type { CurrentUser } from "../../types/user";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, setUser, logout, stats, refreshStats, isPlus } = useApp();
  const [modal, setModal] = useState<"withdraw" | "plus" | null>(null);

  if (loading) return <PageLoading />;

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const memberSince = user
    ? new Intl.DateTimeFormat("uk-UA", { month: "long", year: "numeric" }).format(new Date(user.createdAt))
    : "";

  return (
    <>
      <div className="dbju-page-container">
        <div className="dbju-profile-container">
          {!user ? (
            <LoginRequired
              title="Вхід до особистого кабінету"
              text="Увійдіть або зареєструйтесь, щоб керувати орендованими речами, здавати свої та отримувати виплати за оренду вашого спорядження."
            />
          ) : (
            <>
              {/* Header Profile Info */}
              <div className="dbju-profile-header-card">
                <div className="dbju-profile-user-left">
                  <Avatar className="dbju-profile-avatar-xl" name={user.name} initials={user.avatar} url={user.avatarUrl} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <h1 className="dbju-profile-name">{user.name}</h1>
                      {user.role === "ADMIN" && (
                        <span style={{ background: "var(--brand-dark)", color: "var(--brand-lime)", fontSize: "11px", fontWeight: "900", padding: "2px 8px", borderRadius: "8px" }}>
                          АДМІН
                        </span>
                      )}
                      {isPlus && (
                        <span className="dbju-plus-logo" style={{ fontSize: "11px", padding: "2px 8px" }}>DBJU+</span>
                      )}
                    </div>
                    <div className="dbju-profile-reputation">
                      {ratingText(user.rating, user.reviewsCount)} · з нами з {memberSince}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {user.email} {user.phone && `· ${user.phone}`}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                  {user.isVerified ? (
                    <div className="dbju-diia-badge" style={{ padding: "4px 10px", fontSize: "12px" }}>
                      <CheckIcon size={12} />
                      <span>ДІЯ ✓</span>
                    </div>
                  ) : (
                    <Link href="/profile/edit#diia" className="dbju-diia-badge" style={{ padding: "4px 10px", fontSize: "12px", background: "#FEF3C7", color: "#92400E" }}>
                      <span>Підтвердити через Дію →</span>
                    </Link>
                  )}
                  <Link
                    href="/profile/edit"
                    style={{ fontSize: "12px", fontWeight: "700", color: "var(--brand-green)", background: "var(--brand-green-light)", padding: "4px 10px", borderRadius: "8px" }}
                  >
                    Редагувати
                  </Link>
                </div>
              </div>

              {/* Eco & Financial Impact Banner */}
              <div className="dbju-eco-banner">
                <div className="dbju-eco-title">
                  <LeafIcon size={20} />
                  <span>Ваш ефект за {new Date().getFullYear()} рік</span>
                </div>
                <div className="dbju-eco-metrics">
                  <div>
                    <div className="dbju-eco-metric-val">{(stats?.saved ?? 0).toLocaleString("uk-UA")} ₴</div>
                    <div className="dbju-eco-metric-sub">зекономили</div>
                  </div>
                  <div>
                    <div className="dbju-eco-metric-val">{stats?.itemsNotBought ?? 0}</div>
                    <div className="dbju-eco-metric-sub">речей не купили</div>
                  </div>
                  <div>
                    <div className="dbju-eco-metric-val">-{stats?.co2Kg ?? 0} кг</div>
                    <div className="dbju-eco-metric-sub">CO₂</div>
                  </div>
                </div>
              </div>

              {/* Earnings / Balance Card */}
              <div className="dbju-balance-card">
                <div className="dbju-balance-left">
                  <div className="dbju-balance-icon-wrap">
                    <WalletBagIcon size={24} />
                  </div>
                  <div>
                    <div className="dbju-balance-sub">Доступно до виведення</div>
                    <div className="dbju-balance-val">{(stats?.balance ?? 0).toLocaleString("uk-UA")} ₴</div>
                    <div style={{ fontSize: "12px", opacity: 0.75, marginTop: "2px" }}>
                      Зароблено всього {(stats?.earned ?? 0).toLocaleString("uk-UA")} ₴
                      {stats && stats.pendingEarnings > 0 && ` · очікується ${stats.pendingEarnings.toLocaleString("uk-UA")} ₴`}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="dbju-btn-withdraw"
                  onClick={() => setModal("withdraw")}
                  disabled={!stats || stats.balance <= 0}
                  style={!stats || stats.balance <= 0 ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
                >
                  Вивести
                </button>
              </div>

              {/* Subscription Card DBJU+ */}
              <div className="dbju-subscription-card">
                <div className="dbju-subscription-head">
                  <span className="dbju-plus-logo">DBJU+</span>
                  <span className="dbju-plus-price">{PLUS_PRICE} ₴ / міс</span>
                </div>
                <p className="dbju-subscription-benefits">
                  Оренди без сервісного збору 5% · пріоритетна підтримка
                  {isPlus && user.plusUntil && ` · активна до ${new Date(user.plusUntil).toLocaleDateString("uk-UA")}`}
                </p>
                <button type="button" className="dbju-btn-try-free" onClick={() => setModal("plus")}>
                  {isPlus ? "✓ Підписка активна — керувати" : "Спробувати місяць безкоштовно"}
                </button>
              </div>

              {/* Menu Items List */}
              <div className="dbju-profile-menu">
                <MenuLink href="/profile/listings" icon={<ListBulletIcon size={20} />} title="Мої оголошення"
                  right={
                    stats?.ownerActionNeeded
                      ? `⚠️ потребують уваги: ${stats.ownerActionNeeded}`
                      : `${stats?.activeListings ?? 0} активні`
                  }
                />
                <MenuLink href="/rentals" icon={<BoxIcon size={20} />} title="Мої оренди" right={`${stats?.activeRentals ?? 0} активні`} />
                <MenuLink href="/favorites" icon={<HeartIcon size={20} />} title="Список бажань" right={String(stats?.favoritesCount ?? 0)} />
                <MenuLink href="/profile/edit" icon={<UserIcon size={20} />} title="Редагування профілю" right="Фото, дані, Дія, пароль, картки" />
                {user.role === "ADMIN" && (
                  <MenuLink href="/admin/finance" icon={<WalletBagIcon size={20} />} title="Фінанси платформи" right="Дохід, маржа, беззбитковість" />
                )}
                <MenuLink href={`/users/${user.id}`} icon={<SearchIcon size={20} />} title="Мій публічний профіль" right="Речі та відгуки, як їх бачать інші" />
                <MenuLink href="/help#faq" icon={<SearchIcon size={20} />} title="Як це працює" right="Правила, захист, FAQ" />
                <a href="mailto:support@dbju.ua" className="dbju-profile-menu-item">
                  <div className="dbju-menu-item-left">
                    <ChatBubbleIcon size={20} />
                    <span className="dbju-menu-item-title">Підтримка</span>
                  </div>
                  <div className="dbju-menu-item-right">
                    <span>support@dbju.ua</span>
                    <ChevronRightIcon size={18} />
                  </div>
                </a>
                <div
                  className="dbju-profile-menu-item"
                  onClick={handleLogout}
                  style={{ borderTop: "1px solid var(--border-subtle)" }}
                >
                  <div className="dbju-menu-item-left" style={{ color: "#DC2626" }}>
                    <LogoutIcon size={20} />
                    <span className="dbju-menu-item-title" style={{ color: "#DC2626" }}>Вийти з акаунта</span>
                  </div>
                  <div className="dbju-menu-item-right">
                    <ChevronRightIcon size={18} color="#DC2626" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {user && modal === "withdraw" && stats && (
        <WithdrawModal balance={stats.balance} onClose={() => setModal(null)} onDone={refreshStats} />
      )}
      {user && modal === "plus" && <PlusModal isPlus={isPlus} onClose={() => setModal(null)} onSaved={setUser} />}

      <Footer />
    </>
  );
}

function MenuLink({ href, icon, title, right }: { href: string; icon: React.ReactNode; title: string; right: string }) {
  return (
    <Link href={href} className="dbju-profile-menu-item">
      <div className="dbju-menu-item-left">
        {icon}
        <span className="dbju-menu-item-title">{title}</span>
      </div>
      <div className="dbju-menu-item-right">
        <span>{right}</span>
        <ChevronRightIcon size={18} />
      </div>
    </Link>
  );
}

function Modal({ children, onClose, width = 460 }: { children: React.ReactNode; onClose: () => void; width?: number }) {
  return (
    <div className="dbju-booking-modal-overlay" onClick={onClose}>
      <div className="dbju-booking-modal" style={{ maxWidth: `${width}px` }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

interface PayoutCard {
  id: string;
  brand: string;
  last4: string;
  label: string | null;
  isDefault: boolean;
}

function WithdrawModal({ balance, onClose, onDone }: { balance: number; onClose: () => void; onDone: () => void }) {
  const [cards, setCards] = useState<PayoutCard[] | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<PayoutCard[]>("/api/user/cards")
      .then((list) => {
        setCards(list);
        setCardId(list.find((c) => c.isDefault)?.id ?? list[0]?.id ?? null);
      })
      .catch((err) => setError(err.message));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const p = await api<{ amount: number; card: string }>("/api/payouts", { method: "POST", json: { cardId } });
      setDone(`${p.amount.toLocaleString("uk-UA")} ₴ надіслано на картку ${p.card}`);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose} width={440}>
      <h3 style={{ fontSize: "20px", fontWeight: "900" }}>Виведення заробітку</h3>
      {done ? (
        <>
          <div style={{ background: "var(--pastel-sage)", padding: "18px", borderRadius: "14px", fontWeight: 700, color: "var(--brand-green)" }}>✓ {done}</div>
          <button type="button" className="dbju-btn-primary" style={{ width: "100%" }} onClick={onClose}>Готово</button>
        </>
      ) : !cards ? (
        error ? <ErrorBox message={error} /> : <p style={{ color: "var(--text-muted)" }}>Завантаження карток...</p>
      ) : cards.length === 0 ? (
        <>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            Щоб вивести {balance.toLocaleString("uk-UA")} ₴, спершу додайте картку для виплат.
          </p>
          <Link href="/profile/edit#cards" className="dbju-btn-primary" style={{ width: "100%" }}>Додати картку</Link>
        </>
      ) : (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            Доступно до виведення: <strong>{balance.toLocaleString("uk-UA")} ₴</strong>
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {cards.map((c) => (
              <label key={c.id} className="dbju-card-row" style={{ cursor: "pointer", borderColor: cardId === c.id ? "var(--brand-green)" : undefined }}>
                <input type="radio" name="payout-card" checked={cardId === c.id} onChange={() => setCardId(c.id)} />
                <span style={{ fontWeight: 800 }}>•••• {c.last4}</span>
                <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {c.brand === "visa" ? "Visa" : c.brand === "mastercard" ? "Mastercard" : "Картка"}
                  {c.label && ` · ${c.label}`}
                  {c.isDefault && " · основна"}
                </span>
              </label>
            ))}
          </div>
          <Link href="/profile/edit#cards" style={{ fontSize: "13px", color: "var(--brand-green)", fontWeight: 700 }}>Керувати картками →</Link>
          {error && <ErrorBox message={error} />}
          <button type="submit" className="dbju-btn-primary" style={{ width: "100%" }} disabled={busy || !cardId}>
            {busy ? "Зачекайте..." : `Вивести ${balance.toLocaleString("uk-UA")} ₴`}
          </button>
        </form>
      )}
    </Modal>
  );
}

function PlusModal({ isPlus, onClose, onSaved }: { isPlus: boolean; onClose: () => void; onSaved: (u: CurrentUser) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (method: "POST" | "DELETE") => {
    setBusy(true);
    setError(null);
    try {
      onSaved(await api<CurrentUser>("/api/user/plus", { method }));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <span className="dbju-promo-badge" style={{ alignSelf: "flex-start" }}>DBJU+ ПРЕМІУМ</span>
      <h3 style={{ fontSize: "22px", fontWeight: "900" }}>{isPlus ? "Ваша підписка DBJU+" : "30 днів безкоштовно"}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "8px 0" }}>
        {["Без сервісного збору 5% на кожну оренду", "Власник отримує стільки ж — платить платформа", "Пріоритетна підтримка"].map((t) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", fontWeight: "700" }}>
            <CheckIcon size={16} color="var(--brand-green)" />
            <span>{t}</span>
          </div>
        ))}
      </div>
      <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Знижки застосовуються автоматично при бронюванні.</p>
      {error && <ErrorBox message={error} />}
      {isPlus ? (
        <button type="button" className="dbju-btn-secondary" style={{ width: "100%" }} disabled={busy} onClick={() => run("DELETE")}>
          Скасувати підписку
        </button>
      ) : (
        <button type="button" className="dbju-btn-primary" style={{ width: "100%", background: "var(--brand-lime)", color: "#111A14" }} disabled={busy} onClick={() => run("POST")}>
          Активувати 30 днів безкоштовно
        </button>
      )}
    </Modal>
  );
}
