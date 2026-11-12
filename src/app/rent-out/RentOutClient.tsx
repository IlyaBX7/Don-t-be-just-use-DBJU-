"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SparkleIcon, LeafIcon, ArrowLeftIcon, CheckIcon, CameraIcon } from "../../components/Icons";
import { Footer } from "../../components/Footer/Footer";
import { useApp } from "../../components/AppProvider";
import { LoginRequired, PageLoading, ErrorBox } from "../../components/LoginRequired";
import { api, uploadImage } from "../../lib/api";
import type { Product } from "../../types/product";
import { CATEGORY_LIST } from "../../lib/categories";
import { OWNER_COMMISSION_RATE, SERVICE_FEE_RATE, splitRent } from "../../lib/pricing";
import { LocationPicker, type PickedLocation } from "../../components/LocationPicker";
import { findCity } from "../../lib/ukraine";

const CATEGORY_OPTIONS = CATEGORY_LIST.map((c) => ({ key: c.key, label: c.longLabel }));

const MAX_PHOTOS = 4;

const numOrEmpty = (v: number | undefined | null) => (v ? String(v) : "");

export default function RentOutClient({ editId, initialCategory = "repair" }: { editId: string | null; initialCategory?: string }) {
  const { user, loading: authLoading, refreshStats } = useApp();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [description, setDescription] = useState("");
  const [place, setPlace] = useState<PickedLocation>({ city: "", region: "", street: "", lat: null, lng: null });
  const [pricePerDay, setPricePerDay] = useState(120);
  const [price3Days, setPrice3Days] = useState("");
  const [priceWeek, setPriceWeek] = useState("");
  const [marketBuyPrice, setMarketBuyPrice] = useState("");
  const [depositAmount, setDepositAmount] = useState(1000);
  const [minRentDays, setMinRentDays] = useState(1);
  const [includedKit, setIncludedKit] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isEditingPrice, setIsEditingPrice] = useState(false);

  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editId));
  const [uploading, setUploading] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Каталог для ШІ-підказки ціни
  useEffect(() => {
    api<Product[]>("/api/products").then(setCatalog).catch(() => {});
  }, []);

  // Режим редагування: заповнюємо форму даними з бази
  useEffect(() => {
    if (!editId || !user) return;
    api<Product>(`/api/products/${encodeURIComponent(editId)}`)
      .then((p) => {
        if (p.ownerId !== user.id && user.role !== "ADMIN") {
          setError("Це оголошення належить іншому користувачу");
          return;
        }
        setTitle(p.name);
        setCategory(p.categoryKey);
        setDescription(p.description);
        setPlace({
          city: p.city ?? p.location.split(",")[0].trim(),
          region: p.region ?? findCity(p.city ?? p.location.split(",")[0].trim())?.region ?? "",
          street: p.street ?? "",
          lat: p.lat,
          lng: p.lng,
        });
        setPricePerDay(p.rentalPricePerDay);
        setPrice3Days(numOrEmpty(p.pricingTiers.threeDays === p.rentalPricePerDay * 3 ? null : p.pricingTiers.threeDays));
        setPriceWeek(numOrEmpty(p.pricingTiers.week === p.rentalPricePerDay * 7 ? null : p.pricingTiers.week));
        setMarketBuyPrice(numOrEmpty(p.marketBuyPrice));
        setDepositAmount(p.depositAmount);
        setMinRentDays(p.minRentDays);
        setIncludedKit(p.includedKit.join("\n"));
        setImages(p.images);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoadingEdit(false));
  }, [editId, user]);

  // Середня ціна схожих речей у базі
  const suggestion = useMemo(() => {
    const same = catalog.filter((p) => p.categoryKey === category && p.id !== editId);
    if (same.length === 0) return null;
    const avg = same.reduce((s, p) => s + p.rentalPricePerDay, 0) / same.length;
    return { price: Math.round(avg / 10) * 10, count: same.length };
  }, [catalog, category, editId]);

  // Скільки власник реально отримає: оренда − комісія DBJU 15%
  const perDaySplit = splitRent(pricePerDay, false);
  const potentialMonthlyIncome = splitRent(pricePerDay * 15, false).ownerPayout;

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_PHOTOS - images.length;
    const list = Array.from(files).slice(0, room);
    setUploading(true);
    setError(null);
    try {
      for (const f of list) {
        const url = await uploadImage(f);
        setImages((prev) => [...prev, url]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося завантажити фото");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!place.city.trim()) {
      setError("Оберіть місто, звідки забирати річ");
      return;
    }
    if (!findCity(place.city) && !place.region) {
      setError("Оберіть область для вашого населеного пункту");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        name: title,
        category,
        description,
        city: place.city,
        region: place.region,
        street: place.street,
        lat: place.lat,
        lng: place.lng,
        rentalPricePerDay: pricePerDay,
        price3Days: price3Days ? Number(price3Days) : null,
        priceWeek: priceWeek ? Number(priceWeek) : null,
        marketBuyPrice: marketBuyPrice ? Number(marketBuyPrice) : null,
        depositAmount,
        minRentDays,
        includedKit: includedKit.split("\n").map((s) => s.trim()).filter(Boolean),
        images,
      };
      const saved = editId
        ? await api<Product>(`/api/products/${encodeURIComponent(editId)}`, { method: "PATCH", json: payload })
        : await api<Product>("/api/products", { method: "POST", json: payload });
      setSavedId(saved.id);
      refreshStats();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Щось пішло не так");
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setSavedId(null);
    setTitle("");
    setDescription("");
    setPrice3Days("");
    setPriceWeek("");
    setMarketBuyPrice("");
    setIncludedKit("");
    setImages([]);
  };

  if (authLoading || loadingEdit) return <PageLoading />;

  return (
    <>
      <div className="dbju-page-container">
        {/* Back Link */}
        <div style={{ maxWidth: "620px", margin: "0 auto 16px" }}>
          <Link
            href={editId ? "/profile/listings" : "/"}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: "700", color: "var(--text-secondary)" }}
          >
            <ArrowLeftIcon size={16} />
            <span>{editId ? "Мої оголошення" : "Назад"}</span>
          </Link>
        </div>

        <div className="dbju-rentout-container">
          <div>
            <span className="dbju-step-badge">{editId ? "РЕДАГУВАННЯ" : "НОВЕ ОГОЛОШЕННЯ"}</span>
            <h1 className="dbju-main-title" style={{ fontSize: "32px", marginTop: "4px" }}>
              {editId ? "Редагувати оголошення" : "Здати річ в оренду"}
            </h1>
          </div>

          {!user ? (
            <LoginRequired
              title="Увійдіть, щоб здати річ"
              text="Оголошення прив'язується до вашого акаунта — так орендарі бачать ваш рейтинг, а ви отримуєте виплати."
            />
          ) : savedId ? (
            <div style={{ background: "#FFFFFF", borderRadius: "var(--radius-xl)", padding: "48px 24px", textAlign: "center", border: "1px solid var(--border-subtle)" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--brand-green)", color: "#FFFFFF", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <CheckIcon size={32} />
              </div>
              <h2 style={{ fontSize: "24px", fontWeight: "900", marginBottom: "8px" }}>
                {editId ? "Зміни збережено!" : "Оголошення опубліковано!"}
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "15px", maxWidth: "420px", margin: "0 auto 24px" }}>
                <strong>{title}</strong> вже доступний орендарям у каталозі.
              </p>
              <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                <Link href={`/product/${savedId}`} className="dbju-btn-primary">Переглянути оголошення</Link>
                <Link href="/profile/listings" className="dbju-btn-secondary">Мої оголошення</Link>
                {!editId && (
                  <button type="button" className="dbju-btn-secondary" onClick={resetForm}>Додати ще одну річ</button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "contents" }}>
              {/* Photo Upload Slots */}
              <div>
                <label className="dbju-form-label" style={{ display: "block", marginBottom: "8px" }}>
                  Фотографії речі (до {MAX_PHOTOS} фото, перше — основне)
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  hidden
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <div className="dbju-photo-slots">
                  {Array.from({ length: MAX_PHOTOS }).map((_, idx) => {
                    const img = images[idx];
                    if (img) {
                      return (
                        <div key={img} className="dbju-photo-slot filled">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt={`Фото ${idx + 1}`} />
                          <button
                            type="button"
                            className="dbju-photo-remove"
                            aria-label="Видалити фото"
                            onClick={() => setImages((prev) => prev.filter((x) => x !== img))}
                          >
                            ×
                          </button>
                        </div>
                      );
                    }
                    const isNext = idx === images.length;
                    return (
                      <div
                        key={`empty${idx}`}
                        className="dbju-photo-slot dashed"
                        onClick={() => !uploading && fileRef.current?.click()}
                        style={{ opacity: isNext ? 1 : 0.5 }}
                      >
                        {uploading && isNext ? (
                          <span style={{ fontSize: "12px", fontWeight: 700 }}>...</span>
                        ) : isNext ? (
                          <CameraIcon size={24} />
                        ) : (
                          <span style={{ fontSize: "24px", fontWeight: "400" }}>+</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="dbju-form-group">
                <label className="dbju-form-label">Назва</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Наприклад: Шуруповерт Makita DF333" required maxLength={150} className="dbju-form-input" />
              </div>

              <div className="dbju-form-group">
                <label className="dbju-form-label">Категорія</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="dbju-form-input">
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="dbju-form-group">
                <label className="dbju-form-label">Опис</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Стан, для чого підходить, особливості" required rows={4} maxLength={5000} className="dbju-form-input" style={{ resize: "vertical", fontFamily: "inherit" }} />
              </div>

              <div className="dbju-form-group">
                <label className="dbju-form-label">Комплектація (кожен пункт з нового рядка)</label>
                <textarea value={includedKit} onChange={(e) => setIncludedKit(e.target.value)} placeholder={"Кейс\n2 акумулятори\nЗарядний пристрій"} rows={3} className="dbju-form-input" style={{ resize: "vertical", fontFamily: "inherit" }} />
              </div>

              <fieldset className="dbju-fieldset">
                <legend className="dbju-form-label">Звідки забирати річ</legend>
                <LocationPicker value={place} onChange={setPlace} />
              </fieldset>

              {/* AI Price Recommendation Card */}
              <div className="dbju-ai-price-card">
                <div className="dbju-ai-price-head">
                  <SparkleIcon size={18} />
                  <span>Ціна за добу</span>
                </div>

                <div className="dbju-ai-price-val">
                  {isEditingPrice ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="number"
                        min={1}
                        value={pricePerDay}
                        onChange={(e) => setPricePerDay(Number(e.target.value) || 0)}
                        style={{ width: "120px", fontSize: "32px", fontWeight: "900", padding: "4px 10px", borderRadius: "12px", border: "2px solid var(--brand-lime)", background: "#FFFFFF", color: "#111A14" }}
                      />
                      <span>/ доба</span>
                    </div>
                  ) : (
                    <>
                      {pricePerDay} ₴ <span>/ доба</span>
                    </>
                  )}
                </div>

                <p className="dbju-ai-price-desc">
                  {suggestion
                    ? `Підказка: схожі речі в цій категорії (${suggestion.count}) здають у середньому за ${suggestion.price} ₴ / доба.`
                    : "У цій категорії ще немає оголошень — ви встановлюєте ціну першим."}
                </p>

                <div className="dbju-ai-price-actions">
                  {suggestion && (
                    <button
                      type="button"
                      className="dbju-btn-accept-ai"
                      onClick={() => {
                        setPricePerDay(suggestion.price);
                        setIsEditingPrice(false);
                      }}
                    >
                      Прийняти {suggestion.price} ₴
                    </button>
                  )}
                  <button type="button" className="dbju-btn-edit-ai" onClick={() => setIsEditingPrice(!isEditingPrice)}>
                    {isEditingPrice ? "Готово" : "Змінити"}
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                <div className="dbju-form-group">
                  <label className="dbju-form-label">Ціна за 3 доби, ₴</label>
                  <input type="number" min={1} value={price3Days} onChange={(e) => setPrice3Days(e.target.value)} placeholder={String(pricePerDay * 3)} className="dbju-form-input" />
                </div>
                <div className="dbju-form-group">
                  <label className="dbju-form-label">Ціна за тиждень, ₴</label>
                  <input type="number" min={1} value={priceWeek} onChange={(e) => setPriceWeek(e.target.value)} placeholder={String(pricePerDay * 7)} className="dbju-form-input" />
                </div>
                <div className="dbju-form-group">
                  <label className="dbju-form-label">Застава, ₴</label>
                  <input type="number" min={1} value={depositAmount} onChange={(e) => setDepositAmount(Number(e.target.value) || 0)} required className="dbju-form-input" />
                </div>
                <div className="dbju-form-group">
                  <label className="dbju-form-label">Мін. термін, днів</label>
                  <input type="number" min={1} max={30} value={minRentDays} onChange={(e) => setMinRentDays(Number(e.target.value) || 1)} required className="dbju-form-input" />
                </div>
                <div className="dbju-form-group">
                  <label className="dbju-form-label">Ціна нової в магазині, ₴</label>
                  <input type="number" min={1} value={marketBuyPrice} onChange={(e) => setMarketBuyPrice(e.target.value)} placeholder="необов'язково" className="dbju-form-input" />
                </div>
              </div>

              {/* Earning Potential Card */}
              <div className="dbju-earning-card">
                <div>
                  <div className="dbju-earning-sub">Можливий дохід при 15 днях оренди на місяць</div>
                  <div className="dbju-earning-main">
                    до {potentialMonthlyIncome.toLocaleString("uk-UA")} ₴ / міс
                  </div>
                  <div className="dbju-earning-sub" style={{ marginTop: "4px" }}>
                    З кожної доби: {pricePerDay} ₴ − комісія DBJU {Math.round(OWNER_COMMISSION_RATE * 100)}% ({perDaySplit.ownerCommission} ₴) ={" "}
                    <strong>{perDaySplit.ownerPayout} ₴ вам</strong>. Орендар додатково сплачує сервісний збір {Math.round(SERVICE_FEE_RATE * 100)}%.
                  </div>
                </div>
                <LeafIcon size={28} color="var(--brand-green)" />
              </div>

              {error && <ErrorBox message={error} />}

              <button
                type="submit"
                disabled={isSaving || uploading}
                className="dbju-btn-primary"
                style={{ width: "100%", padding: "16px", borderRadius: "var(--radius-lg)", fontSize: "16px" }}
              >
                {isSaving ? "Зберігаємо..." : editId ? "Зберегти зміни" : "Опублікувати оголошення"}
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
