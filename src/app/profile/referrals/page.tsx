"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "../../../components/Icons";
import { Footer } from "../../../components/Footer/Footer";
import { useApp } from "../../../components/AppProvider";
import { LoginRequired, PageLoading, ErrorBox } from "../../../components/LoginRequired";
import { api } from "../../../lib/api";

interface ReferralData {
  code: string;
  bonusPerFriend: number;
  balance: number;
  invited: { id: string; name: string; joinedAt: string; rewarded: boolean }[];
  history: { id: string; amount: number; reason: string; createdAt: string }[];
}

const REASON: Record<string, string> = {
  REFERRAL_INVITER: "Друг завершив першу оренду",
  REFERRAL_INVITEE: "Бонус за реєстрацію за запрошенням",
  BOOKING: "Використано при бронюванні",
  BOOKING_REFUND: "Повернено (бронювання скасовано)",
};

export default function ReferralsPage() {
  const { user, loading } = useApp();
  const [data, setData] = useState<ReferralData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    api<ReferralData>("/api/referrals").then(setData).catch((e) => setError(e.message));
  }, [user]);

  if (loading) return <PageLoading />;
  const link = data ? `${typeof window !== "undefined" ? window.location.origin : ""}/?ref=${data.code}` : "";

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "DBJU — оренда речей", text: "Орендуй речі замість купувати — і отримай 100 ₴ бонусу на першу оренду:", url: link });
      else {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // користувач скасував
    }
  };

  return (
    <>
      <div className="dbju-page-container" style={{ maxWidth: "760px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Link href="/profile" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)" }}>
            <ArrowLeftIcon size={16} /> <span>Профіль</span>
          </Link>
        </div>
        <h1 className="dbju-main-title" style={{ fontSize: "34px", marginBottom: "16px" }}>Запросіть друзів</h1>

        {!user ? (
          <LoginRequired title="Увійдіть, щоб запрошувати друзів" text="Отримуйте бонуси за кожного друга, який орендує річ на DBJU." />
        ) : error ? (
          <ErrorBox message={error} />
        ) : !data ? (
          <PageLoading />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="dbju-promo-card" style={{ marginBottom: 0 }}>
              <div className="dbju-promo-content">
                <span className="dbju-promo-badge">+{data.bonusPerFriend} ₴ ВАМ І ДРУГУ</span>
                <h3 className="dbju-promo-title">Діліться DBJU — отримуйте бонуси</h3>
                <p className="dbju-promo-desc">
                  Коли друг зареєструється за вашим посиланням і завершить першу оренду, ви обоє отримаєте по {data.bonusPerFriend} ₴ бонусів.
                  Ними можна оплатити оренду й сервісний збір — власник при цьому отримує свою суму повністю.
                </p>
                <div className="dbju-referral-link">
                  <code>{link}</code>
                  <button type="button" className="dbju-btn-primary" style={{ background: "var(--brand-lime)", color: "#111A14", padding: "10px 18px" }} onClick={share}>
                    {copied ? "Скопійовано ✓" : "Поділитися"}
                  </button>
                </div>
              </div>
            </div>

            <div className="dbju-user-stats" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
              <div><strong>{data.balance} ₴</strong><span>бонусів на рахунку</span></div>
              <div><strong>{data.invited.length}</strong><span>друзів зареєструвалось</span></div>
              <div><strong>{data.invited.filter((i) => i.rewarded).length}</strong><span>вже орендували</span></div>
            </div>

            {data.invited.length > 0 && (
              <section className="dbju-help-section">
                <h2>Запрошені друзі</h2>
                {data.invited.map((i) => (
                  <div key={i.id} className="dbju-card-row" style={{ marginTop: "8px" }}>
                    <span style={{ flex: 1, fontWeight: 700 }}>{i.name}</span>
                    <span className="dbju-settings-hint" style={{ margin: 0 }}>з {new Date(i.joinedAt).toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv" })}</span>
                    <span className={`dbju-status-pill ${i.rewarded ? "picked" : "paid"}`}>{i.rewarded ? `+${data.bonusPerFriend} ₴` : "чекаємо першу оренду"}</span>
                  </div>
                ))}
              </section>
            )}

            {data.history.length > 0 && (
              <section className="dbju-help-section">
                <h2>Історія бонусів</h2>
                {data.history.map((h) => (
                  <div key={h.id} className="dbju-card-row" style={{ marginTop: "8px" }}>
                    <span style={{ flex: 1 }}>{REASON[h.reason] ?? h.reason}</span>
                    <span className="dbju-settings-hint" style={{ margin: 0 }}>{new Date(h.createdAt).toLocaleDateString("uk-UA", { timeZone: "Europe/Kyiv" })}</span>
                    <strong style={{ color: h.amount > 0 ? "var(--brand-green)" : "var(--text-primary)" }}>{h.amount > 0 ? "+" : ""}{h.amount} ₴</strong>
                  </div>
                ))}
              </section>
            )}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
