"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, CameraIcon, CheckIcon, QRCodePattern, ShieldCheckIcon } from "../../../components/Icons";
import { Footer } from "../../../components/Footer/Footer";
import { Avatar } from "../../../components/Avatar";
import { useApp } from "../../../components/AppProvider";
import { LoginRequired, PageLoading, ErrorBox } from "../../../components/LoginRequired";
import { api, uploadImage } from "../../../lib/api";
import { PLUS_PRICE } from "../../../lib/pricing";
import { formatDateTime } from "../../../lib/dates";
import type { CurrentUser } from "../../../types/user";

const SECTIONS = [
  { id: "personal", title: "Особисті дані" },
  { id: "diia", title: "Дія" },
  { id: "password", title: "Пароль" },
  { id: "plus", title: "DBJU+" },
  { id: "cards", title: "Картки" },
  { id: "sessions", title: "Пристрої" },
  { id: "delete", title: "Видалення" },
];

export default function EditProfilePage() {
  const { user, loading } = useApp();

  if (loading) return <PageLoading />;

  return (
    <>
      <div className="dbju-page-container" style={{ maxWidth: "760px" }}>
        <div style={{ marginBottom: "16px" }}>
          <Link href="/profile" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)" }}>
            <ArrowLeftIcon size={16} />
            <span>Профіль</span>
          </Link>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
          <h1 className="dbju-main-title" style={{ fontSize: "34px" }}>Редагування профілю</h1>
          {user && <Link href={`/users/${user.id}`} className="dbju-btn-small">Як мене бачать інші →</Link>}
        </div>

        {!user ? (
          <LoginRequired title="Увійдіть, щоб редагувати профіль" text="Тут можна змінити фото, дані, пароль, підписку та картки для виплат." />
        ) : (
          <>
            <nav style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
              {SECTIONS.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="dbju-category-chip">{s.title}</a>
              ))}
            </nav>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <PersonalSection user={user} />
              <DiiaSection user={user} />
              <PasswordSection />
              <PlusSection user={user} />
              <CardsSection />
              <SessionsSection />
              <DeleteSection />
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
}

/* ---------- Спільні дрібниці ---------- */

function Section({ id, title, hint, children }: { id: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="dbju-help-section dbju-settings-section">
      <h2>{title}</h2>
      {hint && <p className="dbju-settings-hint">{hint}</p>}
      {children}
    </section>
  );
}

function Success({ text }: { text: string }) {
  return <div className="dbju-settings-success"><CheckIcon size={14} /> {text}</div>;
}

const errText = (err: unknown, fallback = "Щось пішло не так") => (err instanceof Error ? err.message : fallback);

/* ---------- 1. Особисті дані + фото ---------- */

function PersonalSection({ user }: { user: CurrentUser }) {
  const { setUser } = useApp();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const dirty =
    firstName !== user.firstName ||
    lastName !== user.lastName ||
    email !== user.email ||
    phone !== (user.phone ?? "") ||
    bio !== (user.bio ?? "");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(null);
    try {
      const u = await api<CurrentUser>("/api/user", { method: "PUT", json: { firstName, lastName, email, phone, bio } });
      setUser(u);
      setPhone(u.phone ?? "");
      setSaved("Дані збережено");
    } catch (err) {
      setError(errText(err, "Не вдалося зберегти"));
    } finally {
      setSaving(false);
    }
  };

  const setAvatar = async (avatarUrl: string | null) => {
    const u = await api<CurrentUser>("/api/user", { method: "PUT", json: { avatarUrl } });
    setUser(u);
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoBusy(true);
    setError(null);
    setSaved(null);
    try {
      await setAvatar(await uploadImage(file));
      setSaved("Фото оновлено");
    } catch (err) {
      setError(errText(err, "Не вдалося завантажити фото"));
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removePhoto = async () => {
    setPhotoBusy(true);
    setError(null);
    try {
      await setAvatar(null);
      setSaved("Фото видалено");
    } catch (err) {
      setError(errText(err));
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <Section id="personal" title="Особисті дані">
      <div style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap", marginBottom: "18px" }}>
        <Avatar className="dbju-profile-avatar-xl" name={user.name} initials={user.avatar} url={user.avatarUrl} />
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pickPhoto(e.target.files?.[0])} />
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button type="button" className="dbju-btn-small primary" disabled={photoBusy} onClick={() => fileRef.current?.click()}>
            <CameraIcon size={14} style={{ verticalAlign: "-2px", marginRight: "6px" }} />
            {photoBusy ? "Завантаження..." : user.avatarUrl ? "Змінити фото" : "Додати фото"}
          </button>
          {user.avatarUrl && (
            <button type="button" className="dbju-btn-small danger" disabled={photoBusy} onClick={removePhoto}>
              Видалити фото
            </button>
          )}
        </div>
        <span className="dbju-settings-hint" style={{ width: "100%" }}>JPG, PNG або WEBP до 5 МБ. Квадратне фото виглядає найкраще.</span>
      </div>

      <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div className="dbju-settings-grid">
          <div className="dbju-form-group">
            <label className="dbju-form-label">Ім&apos;я</label>
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required maxLength={50} autoComplete="given-name" className="dbju-form-input" />
          </div>
          <div className="dbju-form-group">
            <label className="dbju-form-label">Прізвище</label>
            <input value={lastName} onChange={(e) => setLastName(e.target.value)} required maxLength={50} autoComplete="family-name" className="dbju-form-input" />
          </div>
          <div className="dbju-form-group">
            <label className="dbju-form-label">Електронна пошта</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="dbju-form-input" />
          </div>
          <div className="dbju-form-group">
            <label className="dbju-form-label">Номер телефону</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+380 50 123 45 67" autoComplete="tel" className="dbju-form-input" />
          </div>
        </div>
        <p className="dbju-settings-hint">Телефон і пошту бачить лише інша сторона вашої оренди — на публічній сторінці їх немає.</p>
        <div className="dbju-form-group">
          <label className="dbju-form-label">Про себе ({bio.length}/500)</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Кілька слів для орендарів: що здаєте, як з вами домовлятися, коли зручно передавати речі."
            className="dbju-form-input"
            style={{ resize: "vertical", fontFamily: "inherit" }}
          />
        </div>
        {error && <ErrorBox message={error} />}
        {saved && <Success text={saved} />}
        <button type="submit" className="dbju-btn-primary" style={{ alignSelf: "flex-start" }} disabled={saving || !dirty}>
          {saving ? "Збереження..." : "Зберегти зміни"}
        </button>
      </form>
    </Section>
  );
}

/* ---------- 2. Верифікація через Дію (демо) ---------- */

function DiiaSection({ user }: { user: CurrentUser }) {
  const { setUser } = useApp();
  const [request, setRequest] = useState<{ requestCode: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ verified: boolean; requestCode?: string }>("/api/user/verify");
      if (r.requestCode) setRequest({ requestCode: r.requestCode });
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!request) return;
    setBusy(true);
    setError(null);
    try {
      setUser(await api<CurrentUser>("/api/user/verify", { method: "POST", json: { requestCode: request.requestCode } }));
      setRequest(null);
    } catch (err) {
      setError(errText(err));
      setRequest(null);
    } finally {
      setBusy(false);
    }
  };

  if (user.isVerified) {
    return (
      <Section id="diia" title="Верифікація через Дію">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div className="dbju-diia-badge" style={{ padding: "6px 12px", fontSize: "13px" }}>
            <CheckIcon size={14} />
            <span>ДІЯ ✓ Особу підтверджено</span>
          </div>
          {user.verifiedAt && (
            <span className="dbju-settings-hint">з {new Date(user.verifiedAt).toLocaleDateString("uk-UA")}</span>
          )}
        </div>
        <p className="dbju-settings-hint" style={{ marginTop: "10px" }}>
          Орендарі та власники бачать позначку «ДІЯ ✓» поруч з вашим ім&apos;ям.
        </p>
      </Section>
    );
  }

  return (
    <Section
      id="diia"
      title="Верифікація через Дію"
      hint="Підтверджена особа отримує позначку «ДІЯ ✓» — вам охочіше довіряють речі та швидше погоджують оренду."
    >
      {!request ? (
        <button type="button" className="dbju-btn-primary" disabled={busy} onClick={start}>
          <ShieldCheckIcon size={18} />
          <span>{busy ? "Зачекайте..." : "Підтвердити через Дію"}</span>
        </button>
      ) : (
        <div className="dbju-diia-box">
          <div style={{ background: "#FFFFFF", padding: "14px", borderRadius: "16px", border: "1px solid var(--border-subtle)" }}>
            <QRCodePattern size={140} />
          </div>
          <div style={{ flex: 1, minWidth: "220px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <strong>Відскануйте QR-код у застосунку Дія</strong>
            <ol style={{ paddingLeft: "18px", color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.6 }}>
              <li>Відкрийте Дію → «Сканувати QR-код»</li>
              <li>Перевірте код запиту: <strong style={{ letterSpacing: "1px" }}>{request.requestCode}</strong></li>
              <li>Дозвольте передати ПІБ і дату народження</li>
            </ol>
            <div className="dbju-demo-note">
              Демо-режим: справжнє підключення до Дії потребує договору з Мінцифри. Поки що підтвердження імітується кнопкою нижче.
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button type="button" className="dbju-btn-primary" disabled={busy} onClick={confirm}>
                {busy ? "Перевіряємо..." : "Я підтвердив у Дії"}
              </button>
              <button type="button" className="dbju-btn-small" disabled={busy} onClick={() => setRequest(null)}>
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}
      {error && <div style={{ marginTop: "10px" }}><ErrorBox message={error} /></div>}
    </Section>
  );
}

/* ---------- 3. Пароль ---------- */

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDone(null);
    if (next !== repeat) {
      setError("Нові паролі не збігаються");
      return;
    }
    setBusy(true);
    try {
      const r = await api<{ closedSessions: number }>("/api/user/password", {
        method: "POST",
        json: { currentPassword: current, newPassword: next },
      });
      setCurrent("");
      setNext("");
      setRepeat("");
      setDone(
        r.closedSessions > 0
          ? `Пароль змінено. Вихід виконано на інших пристроях: ${r.closedSessions}.`
          : "Пароль змінено."
      );
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy(false);
    }
  };

  const type = show ? "text" : "password";
  return (
    <Section id="password" title="Пароль" hint="Після зміни пароля ви залишитесь у системі на цьому пристрої, а на всіх інших — вийдете.">
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div className="dbju-settings-grid">
          <div className="dbju-form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="dbju-form-label">Поточний пароль</label>
            <input type={type} value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" className="dbju-form-input" />
          </div>
          <div className="dbju-form-group">
            <label className="dbju-form-label">Новий пароль</label>
            <input type={type} value={next} onChange={(e) => setNext(e.target.value)} required minLength={6} maxLength={128} autoComplete="new-password" className="dbju-form-input" />
          </div>
          <div className="dbju-form-group">
            <label className="dbju-form-label">Повторіть новий пароль</label>
            <input type={type} value={repeat} onChange={(e) => setRepeat(e.target.value)} required minLength={6} maxLength={128} autoComplete="new-password" className="dbju-form-input" />
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Показати паролі
        </label>
        {error && <ErrorBox message={error} />}
        {done && <Success text={done} />}
        <button type="submit" className="dbju-btn-primary" style={{ alignSelf: "flex-start" }} disabled={busy}>
          {busy ? "Зачекайте..." : "Змінити пароль"}
        </button>
      </form>
    </Section>
  );
}

/* ---------- 4. DBJU+ ---------- */

function PlusSection({ user }: { user: CurrentUser }) {
  const { setUser, isPlus } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (method: "POST" | "DELETE") => {
    if (method === "DELETE" && !window.confirm("Скасувати підписку DBJU+? Знижка перестане діяти одразу.")) return;
    setBusy(true);
    setError(null);
    try {
      setUser(await api<CurrentUser>("/api/user/plus", { method }));
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section id="plus" title="Підписка DBJU+">
      <div className="dbju-subscription-card" style={{ margin: 0 }}>
        <div className="dbju-subscription-head">
          <span className="dbju-plus-logo">DBJU+</span>
          <span className="dbju-plus-price">{PLUS_PRICE} ₴ / міс</span>
        </div>
        <p className="dbju-subscription-benefits">
          Оренди без сервісного збору 5% · пріоритетна підтримка
          <br />
          {isPlus && user.plusUntil
            ? `Активна до ${new Date(user.plusUntil).toLocaleDateString("uk-UA")}`
            : "Зараз не активна · перший місяць безкоштовно"}
        </p>
        {isPlus ? (
          <button type="button" className="dbju-btn-try-free" style={{ background: "transparent", border: "1px solid currentColor" }} disabled={busy} onClick={() => run("DELETE")}>
            Скасувати підписку
          </button>
        ) : (
          <button type="button" className="dbju-btn-try-free" disabled={busy} onClick={() => run("POST")}>
            Активувати 30 днів безкоштовно
          </button>
        )}
      </div>
      {error && <div style={{ marginTop: "10px" }}><ErrorBox message={error} /></div>}
    </Section>
  );
}

/* ---------- 5. Банківські картки ---------- */

interface Card {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  holder: string;
  label: string | null;
  isDefault: boolean;
}

const BRAND_LABEL: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", other: "Картка" };
const pad2 = (n: number) => String(n).padStart(2, "0");

function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
}

function parseExp(v: string): { m: number; y: number } | null {
  const m = v.match(/^\s*(\d{1,2})\s*\/\s*(\d{2}|\d{4})\s*$/);
  return m ? { m: Number(m[1]), y: Number(m[2]) } : null;
}

function CardsSection() {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setCards(await api<Card[]>("/api/user/cards"));
    } catch (err) {
      setError(errText(err));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- завантаження даних з API
    load();
  }, [load]);

  const act = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
      await load();
    } catch (err) {
      setError(errText(err));
    }
  };

  return (
    <Section id="cards" title="Картки для виплат" hint="Сюди виводиться заробіток за оренду ваших речей. Ми зберігаємо лише останні 4 цифри номера — повний номер не зберігається.">
      {!cards ? (
        <p className="dbju-settings-hint">Завантаження...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {cards.length === 0 && !adding && <p className="dbju-settings-hint">Карток ще немає.</p>}
          {cards.map((c) =>
            editing === c.id ? (
              <CardForm
                key={c.id}
                card={c}
                onCancel={() => setEditing(null)}
                onSubmit={async (data) => {
                  await api(`/api/user/cards/${c.id}`, { method: "PATCH", json: data });
                  setEditing(null);
                  await load();
                }}
              />
            ) : (
              <div key={c.id} className="dbju-card-row">
                <div className={`dbju-card-chip ${c.brand}`}>{BRAND_LABEL[c.brand] ?? "Картка"}</div>
                <div style={{ flex: 1, minWidth: "160px" }}>
                  <div style={{ fontWeight: 800, letterSpacing: "1px" }}>•••• {c.last4}</div>
                  <div className="dbju-settings-hint">
                    {c.holder} · до {pad2(c.expMonth)}/{String(c.expYear).slice(-2)}
                    {c.label && ` · ${c.label}`}
                  </div>
                </div>
                {c.isDefault ? (
                  <span className="dbju-status-pill picked">Основна</span>
                ) : (
                  <button type="button" className="dbju-btn-small" onClick={() => act(() => api(`/api/user/cards/${c.id}`, { method: "PATCH", json: { isDefault: true } }))}>
                    Зробити основною
                  </button>
                )}
                <button type="button" className="dbju-btn-small" onClick={() => setEditing(c.id)}>Редагувати</button>
                <button
                  type="button"
                  className="dbju-btn-small danger"
                  onClick={() => window.confirm(`Видалити картку •••• ${c.last4}?`) && act(() => api(`/api/user/cards/${c.id}`, { method: "DELETE" }))}
                >
                  Видалити
                </button>
              </div>
            )
          )}

          {adding ? (
            <CardForm
              onCancel={() => setAdding(false)}
              onSubmit={async (data) => {
                await api("/api/user/cards", { method: "POST", json: data });
                setAdding(false);
                await load();
              }}
            />
          ) : (
            cards.length < 5 && (
              <button type="button" className="dbju-btn-secondary" style={{ alignSelf: "flex-start" }} onClick={() => { setAdding(true); setEditing(null); }}>
                + Додати картку
              </button>
            )
          )}
        </div>
      )}
      {error && <div style={{ marginTop: "10px" }}><ErrorBox message={error} /></div>}
    </Section>
  );
}

function CardForm({
  card,
  onSubmit,
  onCancel,
}: {
  card?: Card;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState(card ? `${pad2(card.expMonth)}/${String(card.expYear).slice(-2)}` : "");
  const [holder, setHolder] = useState(card?.holder ?? "");
  const [label, setLabel] = useState(card?.label ?? "");
  const [isDefault, setIsDefault] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseExp(exp);
    if (!parsed) {
      setError("Термін дії у форматі ММ/РР");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const data: Record<string, unknown> = { expMonth: parsed.m, expYear: parsed.y, holder, label };
      if (!card) {
        data.number = number;
        data.isDefault = isDefault;
      }
      await onSubmit(data);
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="dbju-card-form">
      <strong>{card ? `Редагування картки •••• ${card.last4}` : "Нова картка"}</strong>
      <div className="dbju-settings-grid">
        {!card && (
          <div className="dbju-form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="dbju-form-label">Номер картки</label>
            <input
              value={number}
              onChange={(e) => setNumber(formatCardNumber(e.target.value))}
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="0000 0000 0000 0000"
              required
              className="dbju-form-input"
            />
          </div>
        )}
        <div className="dbju-form-group">
          <label className="dbju-form-label">Термін дії</label>
          <input value={exp} onChange={(e) => setExp(e.target.value.replace(/[^\d/]/g, "").slice(0, 7))} placeholder="ММ/РР" autoComplete="cc-exp" required className="dbju-form-input" />
        </div>
        <div className="dbju-form-group">
          <label className="dbju-form-label">Власник картки</label>
          <input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder="IVAN PETRENKO" autoComplete="cc-name" required maxLength={100} className="dbju-form-input" />
        </div>
        <div className="dbju-form-group" style={{ gridColumn: "1 / -1" }}>
          <label className="dbju-form-label">Назва (необов&apos;язково)</label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Наприклад: monobank" maxLength={50} className="dbju-form-input" />
        </div>
      </div>
      {!card && (
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-secondary)" }}>
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} /> Зробити основною для виплат
        </label>
      )}
      <p className="dbju-settings-hint">CVV не потрібен — картка використовується лише для зарахування коштів.</p>
      {error && <ErrorBox message={error} />}
      <div style={{ display: "flex", gap: "8px" }}>
        <button type="submit" className="dbju-btn-small primary" disabled={busy}>{busy ? "Збереження..." : card ? "Зберегти" : "Додати картку"}</button>
        <button type="button" className="dbju-btn-small" onClick={onCancel} disabled={busy}>Скасувати</button>
      </div>
    </form>
  );
}

/* ---------- 6. Пристрої (сесії) ---------- */

interface SessionRow {
  id: string;
  userAgent: string | null;
  createdAt: string;
  current: boolean;
}

function describeAgent(ua: string | null): string {
  if (!ua) return "Невідомий пристрій";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : /curl/i.test(ua) ? "curl" : "Браузер";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} на ${os}` : browser;
}

function SessionsSection() {
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setSessions(await api<SessionRow[]>("/api/user/sessions"));
    } catch (err) {
      setError(errText(err));
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- завантаження даних з API
    load();
  }, [load]);

  const others = sessions?.filter((s) => !s.current).length ?? 0;

  const logoutOthers = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ closedSessions: number }>("/api/user/sessions", { method: "DELETE" });
      setDone(`Вихід виконано на пристроях: ${r.closedSessions}`);
      await load();
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section id="sessions" title="Пристрої" hint="Де зараз виконано вхід у ваш акаунт. Якщо бачите незнайомий пристрій — вийдіть з нього і змініть пароль.">
      {!sessions ? (
        <p className="dbju-settings-hint">Завантаження...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {sessions.map((s) => (
            <div key={s.id} className="dbju-card-row">
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{describeAgent(s.userAgent)}</div>
                <div className="dbju-settings-hint">вхід {formatDateTime(s.createdAt)}</div>
              </div>
              {s.current && <span className="dbju-status-pill picked">Цей пристрій</span>}
            </div>
          ))}
          <button type="button" className="dbju-btn-small" style={{ alignSelf: "flex-start" }} disabled={busy || others === 0} onClick={logoutOthers}>
            Вийти на всіх інших пристроях{others > 0 && ` (${others})`}
          </button>
        </div>
      )}
      {error && <div style={{ marginTop: "10px" }}><ErrorBox message={error} /></div>}
      {done && <div style={{ marginTop: "10px" }}><Success text={done} /></div>}
    </Section>
  );
}

/* ---------- 7. Видалення акаунта ---------- */

function DeleteSection() {
  const router = useRouter();
  const { setUser } = useApp();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Видалити акаунт назавжди? Оголошення, історія оренд і картки будуть видалені без можливості відновлення.")) return;
    setBusy(true);
    setError(null);
    try {
      await api("/api/user", { method: "DELETE", json: { password } });
      setUser(null);
      router.push("/");
    } catch (err) {
      setError(errText(err));
      setBusy(false);
    }
  };

  return (
    <Section id="delete" title="Видалення акаунта">
      {!open ? (
        <>
          <p className="dbju-settings-hint">Буде видалено профіль, усі ваші оголошення, історію оренд і картки. Це незворотно.</p>
          <button type="button" className="dbju-btn-small danger" style={{ marginTop: "10px" }} onClick={() => setOpen(true)}>
            Видалити акаунт
          </button>
        </>
      ) : (
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <p className="dbju-settings-hint">Для підтвердження введіть пароль. Видалити акаунт можна, лише якщо немає активних оренд.</p>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Пароль" className="dbju-form-input" style={{ maxWidth: "320px" }} />
          {error && <ErrorBox message={error} />}
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" className="dbju-btn-small danger" disabled={busy}>{busy ? "Видалення..." : "Видалити назавжди"}</button>
            <button type="button" className="dbju-btn-small" disabled={busy} onClick={() => { setOpen(false); setPassword(""); setError(null); }}>Скасувати</button>
          </div>
        </form>
      )}
    </Section>
  );
}
