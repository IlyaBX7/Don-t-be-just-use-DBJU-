"use client";

import React, { useState } from "react";
import { CheckIcon } from "./Icons";
import type { CurrentUser } from "../types/user";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: CurrentUser) => void;
  initialMode?: "LOGIN" | "REGISTER";
}

export const AuthModal = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "LOGIN",
}: AuthModalProps) => {
  const [mode, setMode] = useState<"LOGIN" | "REGISTER">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Модалка лишається змонтованою, тож при кожному відкритті беремо вкладку з initialMode
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = mode === "LOGIN" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "LOGIN" 
        ? { email, password } 
        : { firstName, lastName, email, password, phone };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Помилка автентифікації");
      }

      onSuccess(data.user);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Щось пішло не так");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAutofill = () => {
    setEmail("admin@dbju.ua");
    setPassword("admin123");
    setMode("LOGIN");
  };

  return (
    <div className="dbju-booking-modal-overlay" onClick={onClose}>
      <div 
        className="dbju-booking-modal" 
        style={{ maxWidth: "440px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Tabs */}
        <div style={{ display: "flex", gap: "8px", background: "#FFFFFF", padding: "4px", borderRadius: "var(--radius-full)", border: "1px solid var(--border-subtle)" }}>
          <button
            type="button"
            className={`dbju-rentals-tab-btn ${mode === "LOGIN" ? "active" : ""}`}
            style={{ flex: 1, padding: "8px", fontSize: "14px" }}
            onClick={() => { setMode("LOGIN"); setError(null); }}
          >
            Вхід
          </button>
          <button
            type="button"
            className={`dbju-rentals-tab-btn ${mode === "REGISTER" ? "active" : ""}`}
            style={{ flex: 1, padding: "8px", fontSize: "14px" }}
            onClick={() => { setMode("REGISTER"); setError(null); }}
          >
            Реєстрація
          </button>
        </div>

        {/* Title & Brand */}
        <div style={{ textAlign: "center", margin: "8px 0" }}>
          <div className="dbju-logo-pill" style={{ display: "inline-flex", marginBottom: "8px" }}>
            DBJU
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: "900" }}>
            {mode === "LOGIN" ? "Вхід до особистого кабінету" : "Створення акаунта DBJU"}
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
            {mode === "LOGIN" 
              ? "Орендуйте потрібні речі та керуйте замовленнями" 
              : "Орендуйте та заробляйте на речах з верифікацією Дія"}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#B91C1C", padding: "10px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: "600" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {mode === "REGISTER" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
                <div className="dbju-form-group">
                  <label className="dbju-form-label">Ім&apos;я</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Дмитро"
                    autoComplete="given-name"
                    required
                    maxLength={50}
                    className="dbju-form-input"
                  />
                </div>
                <div className="dbju-form-group">
                  <label className="dbju-form-label">Прізвище</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Шевченко"
                    autoComplete="family-name"
                    required
                    maxLength={50}
                    className="dbju-form-input"
                  />
                </div>
              </div>

              <div className="dbju-form-group">
                <label className="dbju-form-label">Номер телефону (для зв&apos;язку з власником)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+380 (__) ___-__-__"
                  className="dbju-form-input"
                />
              </div>
            </>
          )}

          <div className="dbju-form-group">
            <label className="dbju-form-label">Електронна пошта (Email)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="dbju-form-input"
            />
          </div>

          <div className="dbju-form-group">
            <label className="dbju-form-label">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="dbju-form-input"
            />
          </div>

          {mode === "REGISTER" && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--pastel-sage)", padding: "10px 14px", borderRadius: "12px", fontSize: "12px", color: "var(--brand-green)", fontWeight: "600" }}>
              <CheckIcon size={16} />
              <span>Після реєстрації підтвердьте профіль через Дію в «Редагуванні профілю»</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="dbju-btn-primary"
            style={{ width: "100%", padding: "14px", marginTop: "4px" }}
          >
            {loading ? "Зачекайте..." : mode === "LOGIN" ? "Увійти в акаунт" : "Зареєструватися"}
          </button>
        </form>

        {/* Quick Admin Test Button */}
        {mode === "LOGIN" && process.env.NODE_ENV !== "production" && (
          <div style={{ textAlign: "center", borderTop: "1px dashed var(--border-subtle)", paddingTop: "12px" }}>
            <button
              type="button"
              onClick={handleAdminAutofill}
              style={{ fontSize: "12px", color: "var(--brand-green)", fontWeight: "700" }}
            >
              🔑 Заповнити даними Адміна (admin@dbju.ua)
            </button>
          </div>
        )}

        {/* Switch Link */}
        <div style={{ textAlign: "center", fontSize: "13px", color: "var(--text-secondary)" }}>
          {mode === "LOGIN" ? (
            <>
              Ще не маєте акаунта?{" "}
              <button
                type="button"
                onClick={() => { setMode("REGISTER"); setError(null); }}
                style={{ color: "var(--brand-green)", fontWeight: "800", textDecoration: "underline" }}
              >
                Зареєструватися
              </button>
            </>
          ) : (
            <>
              Вже є акаунт?{" "}
              <button
                type="button"
                onClick={() => { setMode("LOGIN"); setError(null); }}
                style={{ color: "var(--brand-green)", fontWeight: "800", textDecoration: "underline" }}
              >
                Увійти
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
