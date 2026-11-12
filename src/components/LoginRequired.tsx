"use client";

import React from "react";
import { UserIcon } from "./Icons";
import { useApp } from "./AppProvider";

interface Props {
  title: string;
  text: string;
}

// Заглушка для сторінок, які потребують входу
export const LoginRequired = ({ title, text }: Props) => {
  const { openAuth } = useApp();
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: "var(--radius-xl)",
        padding: "54px 32px",
        textAlign: "center",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "var(--radius-full)",
          background: "var(--pastel-sage)",
          color: "var(--brand-green)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <UserIcon size={36} />
      </div>
      <h2 style={{ fontSize: "26px", fontWeight: 900, marginBottom: "8px" }}>{title}</h2>
      <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "440px", margin: "0 auto 24px", lineHeight: 1.5 }}>
        {text}
      </p>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        <button type="button" className="dbju-btn-primary" onClick={() => openAuth("LOGIN")}>
          Увійти
        </button>
        <button type="button" className="dbju-btn-secondary" onClick={() => openAuth("REGISTER")}>
          Створити акаунт
        </button>
      </div>
    </div>
  );
};

export const PageLoading = () => (
  <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-muted)" }}>Завантаження...</div>
);

export const EmptyState = ({ icon, title, text, children }: { icon: string; title: string; text: string; children?: React.ReactNode }) => (
  <div style={{ textAlign: "center", padding: "56px 20px", background: "#FFFFFF", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-subtle)" }}>
    <div style={{ fontSize: "40px", marginBottom: "12px" }}>{icon}</div>
    <h3 style={{ fontSize: "18px", fontWeight: 800 }}>{title}</h3>
    <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "4px" }}>{text}</p>
    {children && <div style={{ marginTop: "16px" }}>{children}</div>}
  </div>
);

export const ErrorBox = ({ message }: { message: string }) => (
  <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#B91C1C", padding: "10px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: 600 }}>
    {message}
  </div>
);
