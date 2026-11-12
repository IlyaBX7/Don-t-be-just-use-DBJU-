"use client";

import { useEffect } from "react";
import Link from "next/link";

// Сторінка помилки для розділів сайту (хедер і помічник лишаються на місці)
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="dbju-page-container dbju-status-page">
      <div className="dbju-status-code">😕</div>
      <h1>Щось пішло не так</h1>
      <p>Сторінку не вдалося завантажити. Спробуйте ще раз — якщо помилка повториться, напишіть нам на support@dbju.ua.</p>
      {error.digest && <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Код помилки: {error.digest}</p>}
      <div className="dbju-status-actions">
        <button type="button" className="dbju-btn-primary" onClick={reset}>Спробувати ще раз</button>
        <Link href="/" className="dbju-btn-secondary">На головну</Link>
      </div>
    </div>
  );
}
