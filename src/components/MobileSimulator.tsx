"use client";

import React, { useState } from "react";
import { 
  DrillIcon, 
  CameraIcon, 
  TentIcon, 
  ScooterIcon, 
  GamepadIcon, 
  CartStrollerIcon, 
  GlobeSportIcon,
  ShieldCheckIcon,
  UserIcon,
  PostomatIcon,
  SearchIcon,
  HeartIcon,
  LocationPinIcon,
  ScalesIcon,
  BoxIcon,
  HomeIcon,
  PlusCircleIcon,
  RefreshIcon,
  SparkleIcon,
  CheckIcon,
  ArrowLeftIcon,
  ChevronRightIcon,
  QRCodePattern,
  LeafIcon,
  WalletBagIcon,
  ListBulletIcon,
  ChatBubbleIcon,
  CheckboxCheckedIcon
} from "./Icons";

export const MobileSimulator = () => {
  // Screens: 1 | 2 | 3 | 4 | 5
  const [activeScreen, setActiveScreen] = useState<number>(2);

  // Screen 3: Selected pricing tier
  const [selectedTier, setSelectedTier] = useState<number>(3); // 1, 3, 7 days

  // Screen 4: Delivery method & Protection toggle
  const [deliveryMethod, setDeliveryMethod] = useState<"PICKUP" | "POSTOMAT" | "COURIER">("POSTOMAT");
  const [hasProtection, setHasProtection] = useState<boolean>(true);

  // Screen 5: Tab
  const [rentalsTab, setRentalsTab] = useState<"ACTIVE" | "PLANNED" | "HISTORY">("ACTIVE");

  return (
    <div className="dbju-mobile-simulator-wrapper">
      {/* Screen Quick Selector Tabs */}
      <div className="dbju-sim-screen-selector">
        <button
          type="button"
          className={`dbju-sim-screen-btn ${activeScreen === 1 ? "active" : ""}`}
          onClick={() => setActiveScreen(1)}
        >
          <span className="dbju-sim-badge">1</span>
          <span>Вітання</span>
        </button>

        <button
          type="button"
          className={`dbju-sim-screen-btn ${activeScreen === 2 ? "active" : ""}`}
          onClick={() => setActiveScreen(2)}
        >
          <span className="dbju-sim-badge">2</span>
          <span>Головна</span>
        </button>

        <button
          type="button"
          className={`dbju-sim-screen-btn ${activeScreen === 3 ? "active" : ""}`}
          onClick={() => setActiveScreen(3)}
        >
          <span className="dbju-sim-badge">3</span>
          <span>Картка речі</span>
        </button>

        <button
          type="button"
          className={`dbju-sim-screen-btn ${activeScreen === 4 ? "active" : ""}`}
          onClick={() => setActiveScreen(4)}
        >
          <span className="dbju-sim-badge">4</span>
          <span>Бронювання</span>
        </button>

        <button
          type="button"
          className={`dbju-sim-screen-btn ${activeScreen === 5 ? "active" : ""}`}
          onClick={() => setActiveScreen(5)}
        >
          <span className="dbju-sim-badge">5</span>
          <span>Мої оренди</span>
        </button>

        <button
          type="button"
          className={`dbju-sim-screen-btn ${activeScreen === 6 ? "active" : ""}`}
          onClick={() => setActiveScreen(6)}
        >
          <span className="dbju-sim-badge">6</span>
          <span>Здати річ</span>
        </button>

        <button
          type="button"
          className={`dbju-sim-screen-btn ${activeScreen === 7 ? "active" : ""}`}
          onClick={() => setActiveScreen(7)}
        >
          <span className="dbju-sim-badge">7</span>
          <span>Профіль</span>
        </button>
      </div>

      {/* iPhone Device Frame */}
      <div className="dbju-phone-mockup">
        {/* Dynamic Island */}
        <div className="dbju-phone-dynamic-island" />

        {/* SCREEN 1: ВІТАННЯ */}
        {activeScreen === 1 && (
          <div className="dbju-phone-screen-content" style={{ gap: "24px" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="dbju-logo-pill" style={{ fontSize: "16px", padding: "5px 12px" }}>DBJU</div>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--text-secondary)" }}>
                Don&apos;t Buy, Just Use
              </span>
            </div>

            {/* 6 Category pastel squares */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              <div style={{ background: "var(--pastel-sage)", aspectRatio: "1", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DrillIcon size={30} />
              </div>
              <div style={{ background: "var(--pastel-peach)", aspectRatio: "1", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CameraIcon size={30} />
              </div>
              <div style={{ background: "var(--pastel-lavender)", aspectRatio: "1", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <TentIcon size={30} />
              </div>
              <div style={{ background: "var(--pastel-purple)", aspectRatio: "1", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ScooterIcon size={30} />
              </div>
              <div style={{ background: "var(--pastel-sand)", aspectRatio: "1", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <GamepadIcon size={30} />
              </div>
              <div style={{ background: "var(--pastel-aqua)", aspectRatio: "1", borderRadius: "18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CartStrollerIcon size={30} />
              </div>
            </div>

            {/* Headline */}
            <div>
              <h1 style={{ fontSize: "38px", fontWeight: "900", lineHeight: "1.08", letterSpacing: "-1px" }}>
                Не купуй.<br />
                <span className="dbju-lime-highlight" style={{ margin: "4px 0 0 -2px" }}>Користуйся.</span>
              </h1>
              <p style={{ marginTop: "14px", fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.45" }}>
                Орендуй речі поруч на день, тиждень чи місяць — і заробляй на тих, що лежать удома без діла.
              </p>
            </div>

            {/* 3 Trust points */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", fontWeight: "700" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "var(--pastel-sage)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-green)" }}>
                  <ShieldCheckIcon size={18} />
                </div>
                <span>Кожна оренда під захистом DBJU</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", fontWeight: "700" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "var(--pastel-sage)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-green)" }}>
                  <UserIcon size={18} />
                </div>
                <span>Перевірка користувачів через Дію</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "13px", fontWeight: "700" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "var(--pastel-sage)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-green)" }}>
                  <PostomatIcon size={18} />
                </div>
                <span>Видача через поштомат 24/7</span>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingBottom: "10px" }}>
              <button 
                type="button" 
                className="dbju-btn-primary" 
                style={{ width: "100%", padding: "14px", borderRadius: "16px" }}
                onClick={() => setActiveScreen(2)}
              >
                Почати
              </button>
              <button 
                type="button" 
                className="dbju-btn-secondary" 
                style={{ width: "100%", padding: "14px", borderRadius: "16px" }}
                onClick={() => setActiveScreen(2)}
              >
                У мене вже є акаунт
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 2: ГОЛОВНА */}
        {activeScreen === 2 && (
          <div className="dbju-phone-screen-content" style={{ gap: "20px" }}>
            {/* Top Bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: "700" }}>
                <LocationPinIcon size={16} />
                <span>Київ, Поділ</span>
              </div>
              <div className="dbju-round-icon-btn" style={{ width: "36px", height: "36px" }}>
                <HeartIcon size={18} />
              </div>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: "30px", fontWeight: "900", letterSpacing: "-0.5px" }}>
              Що орендуємо?
            </h1>

            {/* Search Input */}
            <div className="dbju-search-box">
              <SearchIcon size={18} className="dbju-search-icon" />
              <input 
                type="text" 
                placeholder="Дриль, намет, PlayStation..." 
                className="dbju-search-input" 
                style={{ background: "#FFFFFF", padding: "12px 14px 12px 42px", borderRadius: "16px" }}
              />
            </div>

            {/* Category row */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
              {[
                { name: "Ремонт", icon: <DrillIcon size={20} /> },
                { name: "Техніка", icon: <CameraIcon size={20} /> },
                { name: "Туризм", icon: <TentIcon size={20} /> },
                { name: "Спорт", icon: <GlobeSportIcon size={20} /> },
                { name: "Дитяче", icon: <CartStrollerIcon size={20} /> },
              ].map((cat, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    background: "#FFFFFF",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "16px",
                    padding: "10px 12px",
                    minWidth: "64px",
                    flexShrink: 0,
                    cursor: "pointer"
                  }}
                >
                  {cat.icon}
                  <span style={{ fontSize: "11px", fontWeight: "700" }}>{cat.name}</span>
                </div>
              ))}
            </div>

            {/* Dark Promo Kit Card */}
            <div 
              style={{
                background: "var(--brand-dark)",
                borderRadius: "22px",
                padding: "20px",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px"
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <span className="dbju-promo-badge" style={{ fontSize: "10px", padding: "3px 8px" }}>
                  НАБОРИ
                </span>
                <div style={{ fontSize: "17px", fontWeight: "900", lineHeight: "1.2" }}>
                  Похід на вихідні під ключ
                </div>
                <div style={{ fontSize: "12px", color: "#C6D3CB", lineHeight: "1.3" }}>
                  Намет, 2 спальники, пальник і казанок — <strong>690 ₴ за 3 дні</strong>
                </div>
              </div>

              <div 
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  background: "var(--brand-dark-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--brand-lime)",
                  flexShrink: 0
                }}
              >
                <TentIcon size={28} />
              </div>
            </div>

            {/* "Поруч з вами" Section */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: "900" }}>Поруч з вами</h3>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--brand-green)", cursor: "pointer" }}>
                  Усі на мапі
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {/* Item 1: Perforator */}
                <div 
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "18px",
                    border: "1px solid var(--border-subtle)",
                    padding: "10px",
                    cursor: "pointer"
                  }}
                  onClick={() => setActiveScreen(3)}
                >
                  <div style={{ background: "var(--pastel-sage)", aspectRatio: "1.15", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
                    <DrillIcon size={36} />
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "800", lineHeight: "1.2" }}>
                    Перфоратор Bosch
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                    📍 0,6 км · ★ 4,9
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "900", color: "var(--brand-green)", marginTop: "6px" }}>
                    180 ₴ <span style={{ fontSize: "11px", fontWeight: "500", color: "var(--text-muted)" }}>/ доба</span>
                  </div>
                </div>

                {/* Item 2: GoPro */}
                <div 
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "18px",
                    border: "1px solid var(--border-subtle)",
                    padding: "10px",
                    cursor: "pointer"
                  }}
                  onClick={() => setActiveScreen(3)}
                >
                  <div style={{ background: "var(--pastel-peach)", aspectRatio: "1.15", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
                    <CameraIcon size={36} />
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "800", lineHeight: "1.2" }}>
                    GoPro HERO12
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                    📍 1,2 км · ★ 4,8
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "900", color: "var(--brand-green)", marginTop: "6px" }}>
                    290 ₴ <span style={{ fontSize: "11px", fontWeight: "500", color: "var(--text-muted)" }}>/ доба</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 3: КАРТКА РЕЧІ */}
        {activeScreen === 3 && (
          <div className="dbju-phone-screen-content" style={{ gap: "18px" }}>
            {/* Hero Image Container */}
            <div 
              style={{
                background: "var(--pastel-sage)",
                borderRadius: "24px",
                aspectRatio: "1.1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                border: "1px solid var(--border-subtle)"
              }}
            >
              <button 
                type="button" 
                className="dbju-gallery-back-btn" 
                style={{ width: "36px", height: "36px" }}
                onClick={() => setActiveScreen(2)}
              >
                <ArrowLeftIcon size={18} />
              </button>

              <button 
                type="button" 
                className="dbju-gallery-heart-btn" 
                style={{ width: "36px", height: "36px" }}
              >
                <HeartIcon size={18} />
              </button>

              <DrillIcon size={72} />

              <span className="dbju-gallery-counter" style={{ fontSize: "11px", padding: "2px 8px" }}>
                1 / 5
              </span>
            </div>

            {/* Title & Location */}
            <div>
              <h2 style={{ fontSize: "22px", fontWeight: "900", lineHeight: "1.2" }}>
                Перфоратор Bosch GBH 2-26
              </h2>
              <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
                📍 Поділ, 0,6 км · поштомат DBJU поруч
              </div>
            </div>

            {/* Owner Block */}
            <div className="dbju-owner-card" style={{ padding: "12px" }}>
              <div className="dbju-owner-left">
                <div className="dbju-owner-avatar-lg" style={{ width: "38px", height: "38px", fontSize: "13px" }}>
                  ДЄ
                </div>
                <div>
                  <div className="dbju-owner-name" style={{ fontSize: "14px" }}>Дмитро Є.</div>
                  <div className="dbju-owner-stats" style={{ fontSize: "11px" }}>
                    ★ 4,9 · 38 оренд · відповідає за 10 хв
                  </div>
                </div>
              </div>
              <div className="dbju-diia-badge" style={{ fontSize: "10px", padding: "2px 6px" }}>
                <CheckIcon size={10} />
                <span>ДІЯ</span>
              </div>
            </div>

            {/* Pricing Tiers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              <div 
                className={`dbju-pricing-tier-card ${selectedTier === 1 ? "selected" : ""}`}
                style={{ padding: "10px 6px" }}
                onClick={() => setSelectedTier(1)}
              >
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>1 доба</div>
                <div style={{ fontSize: "15px", fontWeight: "900" }}>180 ₴</div>
              </div>

              <div 
                className={`dbju-pricing-tier-card ${selectedTier === 3 ? "selected" : ""}`}
                style={{ padding: "10px 6px" }}
                onClick={() => setSelectedTier(3)}
              >
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>3 доби</div>
                <div style={{ fontSize: "15px", fontWeight: "900", color: "var(--brand-green)" }}>450 ₴</div>
              </div>

              <div 
                className={`dbju-pricing-tier-card ${selectedTier === 7 ? "selected" : ""}`}
                style={{ padding: "10px 6px" }}
                onClick={() => setSelectedTier(7)}
              >
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Тиждень</div>
                <div style={{ fontSize: "15px", fontWeight: "900" }}>900 ₴</div>
              </div>
            </div>

            {/* "Оренда чи купівля?" Card */}
            <div className="dbju-compare-card" style={{ padding: "16px", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "800" }}>
                <ScalesIcon size={18} />
                <span>Оренда чи купівля?</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Купити новий</div>
                  <div style={{ fontSize: "16px", fontWeight: "900" }}>≈ 5 500 ₴</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Оренда на 3 доби</div>
                  <div style={{ fontSize: "16px", fontWeight: "900", color: "var(--brand-green)" }}>450 ₴</div>
                </div>
              </div>
              <div className="dbju-lime-banner" style={{ padding: "8px 12px", fontSize: "11px", borderRadius: "10px" }}>
                Сподобалось? 30% оплаченої оренди зарахуємо в ціну, якщо вирішите купити.
              </div>
            </div>

            {/* Safeguards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                <ShieldCheckIcon size={16} />
                <span>Застава 1 000 ₴ — лише блокується на картці</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                <BoxIcon size={16} />
                <span>У комплекті: кейс, 3 бури, долото</span>
              </div>
            </div>

            {/* Sticky Bottom Action */}
            <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>від</div>
                <div style={{ fontSize: "18px", fontWeight: "900" }}>
                  150 ₴ <span style={{ fontSize: "11px", fontWeight: "500" }}>/ доба</span>
                </div>
              </div>

              <button 
                type="button" 
                className="dbju-btn-primary" 
                style={{ padding: "12px 24px", borderRadius: "14px" }}
                onClick={() => setActiveScreen(4)}
              >
                Обрати дати
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 4: БРОНЮВАННЯ */}
        {activeScreen === 4 && (
          <div className="dbju-phone-screen-content" style={{ gap: "16px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <button 
                type="button" 
                className="dbju-gallery-back-btn" 
                style={{ position: "static", width: "36px", height: "36px" }}
                onClick={() => setActiveScreen(3)}
              >
                <ArrowLeftIcon size={18} />
              </button>
              <h2 style={{ fontSize: "22px", fontWeight: "900" }}>Бронювання</h2>
            </div>

            {/* Calendar widget */}
            <div className="dbju-calendar-card" style={{ padding: "14px" }}>
              <div className="dbju-cal-head" style={{ marginBottom: "10px" }}>
                <span style={{ fontSize: "14px", fontWeight: "800" }}>Листопад 2026</span>
                <span style={{ fontSize: "13px", fontWeight: "800", color: "var(--brand-green)" }}>
                  14 – 16 лист.
                </span>
              </div>
              <div className="dbju-cal-weekdays" style={{ fontSize: "11px" }}>
                <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Нд</span>
              </div>
              <div className="dbju-cal-days" style={{ fontSize: "12px" }}>
                <div className="dbju-cal-day" style={{ opacity: 0.35 }}>9</div>
                <div className="dbju-cal-day">10</div>
                <div className="dbju-cal-day">11</div>
                <div className="dbju-cal-day">12</div>
                <div className="dbju-cal-day">13</div>
                <div className="dbju-cal-day selected-edge">14</div>
                <div className="dbju-cal-day selected-range">15</div>
                <div className="dbju-cal-day selected-edge">16</div>
                <div className="dbju-cal-day">17</div>
                <div className="dbju-cal-day">18</div>
                <div className="dbju-cal-day">19</div>
                <div className="dbju-cal-day">20</div>
                <div className="dbju-cal-day">21</div>
                <div className="dbju-cal-day">22</div>
              </div>
            </div>

            {/* Delivery Methods ("Як отримати") */}
            <div>
              <div style={{ fontSize: "14px", fontWeight: "800", marginBottom: "8px" }}>Як отримати</div>
              <div className="dbju-delivery-options" style={{ gap: "6px" }}>
                <div 
                  className={`dbju-delivery-card ${deliveryMethod === "PICKUP" ? "active" : ""}`}
                  style={{ padding: "10px 12px" }}
                  onClick={() => setDeliveryMethod("PICKUP")}
                >
                  <div className="dbju-delivery-left" style={{ gap: "8px" }}>
                    <div className="dbju-radio-circle" style={{ width: "16px", height: "16px" }}>
                      {deliveryMethod === "PICKUP" && <div className="dbju-radio-dot" style={{ width: "8px", height: "8px" }} />}
                    </div>
                    <UserIcon size={16} />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "800" }}>Самовивіз</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Поділ, вул. Ярославська</div>
                    </div>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "800" }}>0 ₴</div>
                </div>

                <div 
                  className={`dbju-delivery-card ${deliveryMethod === "POSTOMAT" ? "active" : ""}`}
                  style={{ padding: "10px 12px" }}
                  onClick={() => setDeliveryMethod("POSTOMAT")}
                >
                  <div className="dbju-delivery-left" style={{ gap: "8px" }}>
                    <div className="dbju-radio-circle" style={{ width: "16px", height: "16px" }}>
                      {deliveryMethod === "POSTOMAT" && <div className="dbju-radio-dot" style={{ width: "8px", height: "8px" }} />}
                    </div>
                    <PostomatIcon size={16} />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "800" }}>Поштомат DBJU</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Контрактова пл., 24/7</div>
                    </div>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "800" }}>40 ₴</div>
                </div>

                <div 
                  className={`dbju-delivery-card ${deliveryMethod === "COURIER" ? "active" : ""}`}
                  style={{ padding: "10px 12px" }}
                  onClick={() => setDeliveryMethod("COURIER")}
                >
                  <div className="dbju-delivery-left" style={{ gap: "8px" }}>
                    <div className="dbju-radio-circle" style={{ width: "16px", height: "16px" }}>
                      {deliveryMethod === "COURIER" && <div className="dbju-radio-dot" style={{ width: "8px", height: "8px" }} />}
                    </div>
                    <ScooterIcon size={16} />
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: "800" }}>Кур&apos;єр</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>До дверей за 2 год</div>
                    </div>
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: "800" }}>120 ₴</div>
                </div>
              </div>
            </div>

            {/* Protection Toggle */}
            <div className="dbju-protection-card" style={{ padding: "12px" }}>
              <div className="dbju-protection-left" style={{ gap: "8px" }}>
                <ShieldCheckIcon size={20} color="var(--brand-green)" />
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "800" }}>DBJU Захист · 25 ₴</div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                    Поломка чи крадіжка — покриємо до 20 000 ₴
                  </div>
                </div>
              </div>
              <div 
                className={`dbju-toggle-switch ${hasProtection ? "" : "off"}`}
                style={{ width: "40px", height: "24px", padding: "2px" }}
                onClick={() => setHasProtection(!hasProtection)}
              >
                <div className="dbju-toggle-thumb" style={{ width: "18px", height: "18px", transform: hasProtection ? "translateX(16px)" : "translateX(0)" }} />
              </div>
            </div>

            {/* Price breakdown */}
            <div className="dbju-receipt" style={{ fontSize: "13px", gap: "6px" }}>
              <div className="dbju-receipt-row">
                <span>Оренда, 3 доби</span>
                <span>450 ₴</span>
              </div>
              <div className="dbju-receipt-row">
                <span>Поштомат DBJU</span>
                <span>40 ₴</span>
              </div>
              {hasProtection && (
                <div className="dbju-receipt-row">
                  <span>DBJU Захист</span>
                  <span>25 ₴</span>
                </div>
              )}
              <div className="dbju-receipt-row">
                <span>Сервісний збір</span>
                <span>30 ₴</span>
              </div>
              <div className="dbju-receipt-divider" />
              <div className="dbju-receipt-total" style={{ fontSize: "17px" }}>
                <span>Разом</span>
                <span>545 ₴</span>
              </div>
            </div>

            {/* Pay Button */}
            <button 
              type="button" 
              className="dbju-btn-primary" 
              style={{ width: "100%", padding: "14px", borderRadius: "16px", marginTop: "auto" }}
              onClick={() => setActiveScreen(5)}
            >
              Оплатити 545 ₴
            </button>
          </div>
        )}

        {/* SCREEN 5: МОЇ ОРЕНДИ */}
        {activeScreen === 5 && (
          <div className="dbju-phone-screen-content" style={{ gap: "16px" }}>
            {/* Title */}
            <h1 style={{ fontSize: "28px", fontWeight: "900" }}>Мої оренди</h1>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "6px", background: "#FFFFFF", padding: "4px", borderRadius: "20px", border: "1px solid var(--border-subtle)" }}>
              <button 
                type="button"
                className={`dbju-rentals-tab-btn ${rentalsTab === "ACTIVE" ? "active" : ""}`}
                style={{ fontSize: "12px", padding: "6px 12px" }}
                onClick={() => setRentalsTab("ACTIVE")}
              >
                Активні · 1
              </button>
              <button 
                type="button"
                className={`dbju-rentals-tab-btn ${rentalsTab === "PLANNED" ? "active" : ""}`}
                style={{ fontSize: "12px", padding: "6px 12px" }}
                onClick={() => setRentalsTab("PLANNED")}
              >
                Заплановані · 1
              </button>
              <button 
                type="button"
                className={`dbju-rentals-tab-btn ${rentalsTab === "HISTORY" ? "active" : ""}`}
                style={{ fontSize: "12px", padding: "6px 12px" }}
                onClick={() => setRentalsTab("HISTORY")}
              >
                Історія
              </button>
            </div>

            {/* Active Card */}
            <div className="dbju-active-rental-card" style={{ padding: "16px", gap: "16px" }}>
              {/* Item Info */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "var(--pastel-sage)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <DrillIcon size={24} />
                </div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: "900" }}>Перфоратор Bosch</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>14–16 листопада · 545 ₴</div>
                </div>
              </div>

              {/* Stepper Timeline */}
              <div className="dbju-stepper" style={{ gap: "12px" }}>
                <div className="dbju-step-row">
                  <div className="dbju-step-left">
                    <div className="dbju-step-bullet completed" style={{ width: "20px", height: "20px" }}>
                      <CheckIcon size={12} />
                    </div>
                    <span className="dbju-step-name" style={{ fontSize: "13px" }}>Оплачено</span>
                  </div>
                  <span className="dbju-step-time" style={{ fontSize: "12px" }}>12 лист.</span>
                </div>

                <div className="dbju-step-row">
                  <div className="dbju-step-left">
                    <div className="dbju-step-bullet completed" style={{ width: "20px", height: "20px" }}>
                      <CheckIcon size={12} />
                    </div>
                    <span className="dbju-step-name" style={{ fontSize: "13px" }}>Отримано з поштомату</span>
                  </div>
                  <span className="dbju-step-time" style={{ fontSize: "12px" }}>14 лист., 10:12</span>
                </div>

                <div className="dbju-step-row">
                  <div className="dbju-step-left">
                    <div className="dbju-step-bullet current" style={{ width: "20px", height: "20px" }} />
                    <span className="dbju-step-name" style={{ fontSize: "13px" }}>Користуєтесь</span>
                  </div>
                  <span className="dbju-step-time" style={{ fontSize: "12px" }}>ще 2 дні</span>
                </div>

                <div className="dbju-step-row">
                  <div className="dbju-step-left">
                    <div className="dbju-step-bullet pending" style={{ width: "20px", height: "20px" }} />
                    <span className="dbju-step-name" style={{ fontSize: "13px", color: "var(--text-muted)" }}>Повернення</span>
                  </div>
                  <span className="dbju-step-time" style={{ fontSize: "12px" }}>до 16 лист., 18:00</span>
                </div>
              </div>

              {/* QR Code Block */}
              <div className="dbju-postomat-qr-box" style={{ padding: "12px", gap: "12px" }}>
                <div className="dbju-qr-pattern-wrap" style={{ padding: "6px" }}>
                  <QRCodePattern size={64} />
                </div>
                <div className="dbju-postomat-qr-info">
                  <div className="dbju-qr-title" style={{ fontSize: "13px" }}>Код для повернення</div>
                  <div className="dbju-qr-desc" style={{ fontSize: "11px" }}>
                    Поштомат DBJU №214, Контрактова пл. Відскануйте — комірка відкриється.
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="dbju-rental-actions" style={{ gap: "8px" }}>
                <button type="button" className="dbju-btn-extend" style={{ padding: "10px", fontSize: "13px" }}>
                  <RefreshIcon size={16} />
                  <span>Продовжити</span>
                </button>
                <button type="button" className="dbju-btn-photoreport" style={{ padding: "10px", fontSize: "13px" }}>
                  <CameraIcon size={16} />
                  <span>Фотозвіт</span>
                </button>
              </div>

              {/* AI note */}
              <div className="dbju-ai-notice" style={{ fontSize: "11px" }}>
                <SparkleIcon size={16} color="var(--brand-green)" style={{ flexShrink: 0 }} />
                <span>Фотозвіт перевіряє ШІ: фото «до» і «після» порівнюються автоматично, застава повертається за хвилини.</span>
              </div>
            </div>

            {/* Upcoming item */}
            <div 
              className="dbju-upcoming-card" 
              style={{ padding: "14px" }}
              onClick={() => setActiveScreen(3)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "var(--pastel-peach)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CameraIcon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "800" }}>GoPro HERO12</div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Заплановано: 20–22 листопада</div>
                </div>
              </div>
              <ChevronRightIcon size={18} color="var(--text-muted)" />
            </div>
          </div>
        )}

        {/* SCREEN 6: ЗДАТИ РІЧ В ОРЕНДУ (КРОК 2 З 3) */}
        {activeScreen === 6 && (
          <div className="dbju-phone-screen-content" style={{ gap: "14px" }}>
            {/* Step header */}
            <div>
              <span className="dbju-step-badge" style={{ fontSize: "11px" }}>КРОК 2 З 3</span>
              <h2 style={{ fontSize: "22px", fontWeight: "900", marginTop: "2px" }}>
                Здати річ в оренду
              </h2>
              <div className="dbju-step-progressbar" style={{ marginTop: "4px", height: "4px" }}>
                <div className="dbju-step-progress-fill" style={{ width: "66%" }} />
              </div>
            </div>

            {/* Photo slots */}
            <div className="dbju-photo-slots" style={{ gap: "8px" }}>
              <div className="dbju-photo-slot filled" style={{ borderRadius: "14px" }}>
                <DrillIcon size={28} />
              </div>
              <div className="dbju-photo-slot filled" style={{ borderRadius: "14px" }}>
                <DrillIcon size={28} />
              </div>
              <div className="dbju-photo-slot dashed" style={{ borderRadius: "14px" }}>
                <span style={{ fontSize: "20px" }}>+</span>
              </div>
              <div className="dbju-photo-slot dashed" style={{ borderRadius: "14px" }}>
                <span style={{ fontSize: "20px" }}>+</span>
              </div>
            </div>

            {/* Name */}
            <div className="dbju-form-group" style={{ gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: "800" }}>Назва</label>
              <div style={{ background: "#FFFFFF", padding: "10px 14px", borderRadius: "14px", border: "1px solid var(--border-subtle)", fontSize: "13px", fontWeight: "600" }}>
                Шуруповерт Makita DF333
              </div>
            </div>

            {/* Category */}
            <div className="dbju-form-group" style={{ gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: "800" }}>Категорія</label>
              <div style={{ background: "#FFFFFF", padding: "10px 14px", borderRadius: "14px", border: "1px solid var(--border-subtle)", fontSize: "13px", fontWeight: "600", color: "var(--text-secondary)" }}>
                Інструменти · Електроінструмент
              </div>
            </div>

            {/* AI Price Card */}
            <div className="dbju-ai-price-card" style={{ padding: "16px", gap: "10px" }}>
              <div className="dbju-ai-price-head" style={{ fontSize: "13px" }}>
                <SparkleIcon size={16} />
                <span>ШІ-підказка ціни</span>
              </div>

              <div className="dbju-ai-price-val" style={{ fontSize: "28px" }}>
                120 ₴ <span style={{ fontSize: "13px" }}>/ доба</span>
              </div>

              <div className="dbju-ai-price-desc" style={{ fontSize: "11px" }}>
                На основі схожих оголошень у вашому районі та попиту цього місяця.
              </div>

              <div className="dbju-ai-price-actions" style={{ gap: "8px" }}>
                <button type="button" className="dbju-btn-accept-ai" style={{ padding: "8px", fontSize: "13px" }}>
                  Прийняти
                </button>
                <button type="button" className="dbju-btn-edit-ai" style={{ padding: "8px", fontSize: "13px" }}>
                  Змінити
                </button>
              </div>
            </div>

            {/* Earning potential card */}
            <div className="dbju-earning-card" style={{ padding: "12px 16px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>
                  Можливий дохід при 15 днях оренди
                </div>
                <div style={{ fontSize: "17px", fontWeight: "900", color: "var(--brand-green)" }}>
                  до 1 800 ₴ / міс
                </div>
              </div>
              <LeafIcon size={24} color="var(--brand-green)" />
            </div>

            {/* Checkbox */}
            <div className="dbju-checkbox-row" style={{ padding: "0" }}>
              <span style={{ fontSize: "12px", fontWeight: "700", maxWidth: "260px", lineHeight: "1.3" }}>
                Автоматично приймати перевірених орендарів
              </span>
              <CheckboxCheckedIcon size={22} color="var(--brand-green)" />
            </div>

            {/* Next button */}
            <button 
              type="button" 
              className="dbju-btn-primary" 
              style={{ width: "100%", padding: "12px", borderRadius: "14px", fontSize: "14px", marginTop: "auto" }}
              onClick={() => setActiveScreen(7)}
            >
              Далі — умови та застава
            </button>
          </div>
        )}

        {/* SCREEN 7: ПРОФІЛЬ */}
        {activeScreen === 7 && (
          <div className="dbju-phone-screen-content" style={{ gap: "14px" }}>
            {/* Header Card */}
            <div className="dbju-profile-header-card" style={{ padding: "4px 0" }}>
              <div className="dbju-profile-user-left" style={{ gap: "12px" }}>
                <div className="dbju-profile-avatar-xl" style={{ width: "48px", height: "48px", fontSize: "18px", borderRadius: "14px" }}>
                  AK
                </div>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "900" }}>Анна К.</h2>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: "600" }}>
                    ★ 5,0 як орендар · ★ 4,9 як власник
                  </div>
                </div>
              </div>
              <div className="dbju-diia-badge" style={{ fontSize: "10px", padding: "2px 8px" }}>
                <CheckIcon size={10} />
                <span>ДІЯ</span>
              </div>
            </div>

            {/* Eco Banner */}
            <div className="dbju-eco-banner" style={{ padding: "16px 18px", gap: "10px" }}>
              <div className="dbju-eco-title" style={{ fontSize: "13px" }}>
                <LeafIcon size={16} />
                <span>Ваш ефект за 2026 рік</span>
              </div>
              <div className="dbju-eco-metrics">
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "900" }}>7 850 ₴</div>
                  <div style={{ fontSize: "10px", fontWeight: "700", opacity: 0.85 }}>зекономили</div>
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "900" }}>6</div>
                  <div style={{ fontSize: "10px", fontWeight: "700", opacity: 0.85 }}>речей не купили</div>
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "900" }}>-42 кг</div>
                  <div style={{ fontSize: "10px", fontWeight: "700", opacity: 0.85 }}>CO₂</div>
                </div>
              </div>
            </div>

            {/* Balance Card */}
            <div className="dbju-balance-card" style={{ padding: "12px 16px" }}>
              <div className="dbju-balance-left" style={{ gap: "12px" }}>
                <div className="dbju-balance-icon-wrap" style={{ width: "38px", height: "38px" }}>
                  <WalletBagIcon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600" }}>
                    Заробили на своїх речах
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: "900" }}>2 340 ₴</div>
                </div>
              </div>
              <button 
                type="button" 
                className="dbju-btn-withdraw" 
                style={{ fontSize: "13px" }}
                onClick={() => alert("Виведення 2 340 ₴ на картку monobank")}
              >
                Вивести
              </button>
            </div>

            {/* Subscription DBJU+ Card */}
            <div className="dbju-subscription-card" style={{ padding: "14px", gap: "8px" }}>
              <div className="dbju-subscription-head">
                <span className="dbju-plus-logo" style={{ fontSize: "17px" }}>DBJU+</span>
                <span className="dbju-plus-price" style={{ fontSize: "12px" }}>99 ₴ / міс</span>
              </div>
              <div style={{ fontSize: "11px", color: "#C0CDC5", lineHeight: "1.35" }}>
                Безкоштовні поштомати · –10% на оренду · без застави до 3 000 ₴
              </div>
              <button type="button" className="dbju-btn-try-free" style={{ padding: "10px", fontSize: "13px", borderRadius: "12px" }}>
                Спробувати місяць безкоштовно
              </button>
            </div>

            {/* Profile Menu */}
            <div className="dbju-profile-menu">
              <div className="dbju-profile-menu-item" style={{ padding: "12px 14px" }} onClick={() => setActiveScreen(6)}>
                <div className="dbju-menu-item-left" style={{ gap: "10px" }}>
                  <ListBulletIcon size={18} />
                  <span style={{ fontSize: "13px", fontWeight: "800" }}>Мої оголошення</span>
                </div>
                <div className="dbju-menu-item-right" style={{ fontSize: "11px" }}>
                  <span>3 активні</span>
                  <ChevronRightIcon size={16} />
                </div>
              </div>

              <div className="dbju-profile-menu-item" style={{ padding: "12px 14px" }} onClick={() => setActiveScreen(5)}>
                <div className="dbju-menu-item-left" style={{ gap: "10px" }}>
                  <HeartIcon size={18} />
                  <span style={{ fontSize: "13px", fontWeight: "800" }}>Список бажань</span>
                </div>
                <div className="dbju-menu-item-right" style={{ fontSize: "11px" }}>
                  <span>12</span>
                  <ChevronRightIcon size={16} />
                </div>
              </div>

              <div className="dbju-profile-menu-item" style={{ padding: "12px 14px" }}>
                <div className="dbju-menu-item-left" style={{ gap: "10px" }}>
                  <SearchIcon size={18} />
                  <span style={{ fontSize: "13px", fontWeight: "800" }}>Запити на речі</span>
                </div>
                <div className="dbju-menu-item-right" style={{ fontSize: "11px" }}>
                  <span>Попросіть сусідів</span>
                  <ChevronRightIcon size={16} />
                </div>
              </div>

              <div className="dbju-profile-menu-item" style={{ padding: "12px 14px" }}>
                <div className="dbju-menu-item-left" style={{ gap: "10px" }}>
                  <ChatBubbleIcon size={18} />
                  <span style={{ fontSize: "13px", fontWeight: "800" }}>Підтримка</span>
                </div>
                <div className="dbju-menu-item-right" style={{ fontSize: "11px" }}>
                  <span>24/7</span>
                  <ChevronRightIcon size={16} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Navigation Bar on Mobile (Screens 2, 5, 6, 7) */}
        {(activeScreen === 2 || activeScreen === 5 || activeScreen === 6 || activeScreen === 7) && (
          <div className="dbju-phone-bottom-nav">
            <div 
              className={`dbju-phone-nav-item ${activeScreen === 2 ? "active" : ""}`}
              onClick={() => setActiveScreen(2)}
            >
              <HomeIcon size={22} />
              <span>Головна</span>
            </div>

            <div 
              className={`dbju-phone-nav-item ${activeScreen === 5 ? "active" : ""}`}
              onClick={() => setActiveScreen(5)}
            >
              <BoxIcon size={22} />
              <span>Оренди</span>
            </div>

            <div 
              className={`dbju-phone-nav-item ${activeScreen === 6 ? "active" : ""}`}
              onClick={() => setActiveScreen(6)}
            >
              <PlusCircleIcon size={22} />
              <span>Здати</span>
            </div>

            <div 
              className={`dbju-phone-nav-item ${activeScreen === 7 ? "active" : ""}`}
              onClick={() => setActiveScreen(7)}
            >
              <UserIcon size={22} />
              <span>Профіль</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
