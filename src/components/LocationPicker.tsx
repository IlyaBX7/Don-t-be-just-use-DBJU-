"use client";

import React, { useId, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "../lib/api";
import { CITIES, POPULAR_CITIES, REGIONS, findCity, searchCities } from "../lib/ukraine";

const MapPicker = dynamic(() => import("./MapPicker"), {
  ssr: false,
  loading: () => <div className="dbju-map-box dbju-map-loading">Завантаження карти...</div>,
});

export interface PickedLocation {
  city: string;
  region: string;
  street: string;
  lat: number | null;
  lng: number | null;
}

interface Props {
  value: PickedLocation;
  onChange: (v: PickedLocation) => void;
}

const KYIV = CITIES[0];

export const LocationPicker = ({ value, onChange }: Props) => {
  const listId = useId();
  const [query, setQuery] = useState(value.city);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [showMap, setShowMap] = useState(value.lat !== null);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = useMemo(() => searchCities(query), [query]);
  const known = findCity(value.city);
  const center = known
    ? { lat: known.lat, lng: known.lng, zoom: 13 }
    : { lat: KYIV.lat, lng: KYIV.lng, zoom: value.city ? 7 : 6 };

  const set = (patch: Partial<PickedLocation>) => onChange({ ...value, ...patch });

  const choose = (city: string, region: string) => {
    setQuery(city);
    setOpen(false);
    // Нове місто — стара точка на карті вже не актуальна
    set({ city, region, ...(city !== value.city ? { lat: null, lng: null } : {}) });
  };

  const commitTyped = () => {
    const typed = query.trim().replace(/\s+/g, " ");
    if (!typed) return;
    const match = findCity(typed);
    if (match) choose(match.name, match.region);
    else if (typed !== value.city) set({ city: typed, region: "", lat: null, lng: null });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (open && suggestions[active]) {
        e.preventDefault();
        choose(suggestions[active].name, suggestions[active].region);
      } else {
        commitTyped();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const onPick = async (lat: number, lng: number) => {
    set({ lat, lng });
    setGeoStatus("Визначаємо адресу...");
    try {
      const r = await api<{ city: string | null; region: string | null; street: string | null }>(
        `/api/geo/reverse?lat=${lat.toFixed(6)}&lng=${lng.toFixed(6)}`
      );
      const patch: Partial<PickedLocation> = { lat, lng };
      if (r.city) {
        patch.city = r.city;
        patch.region = r.region ?? findCity(r.city)?.region ?? value.region;
        setQuery(r.city);
      }
      if (r.street) patch.street = r.street;
      onChange({ ...value, ...patch });
      setGeoStatus(r.street || r.city ? "Адресу підставлено — перевірте та за потреби виправте" : "Точку збережено, адресу введіть вручну");
    } catch (err) {
      setGeoStatus(err instanceof Error ? err.message : "Не вдалося визначити адресу");
    }
  };

  return (
    <div className="dbju-location-picker">
      {/* 1. Місто */}
      <div className="dbju-form-group">
        <label className="dbju-form-label" htmlFor={`${listId}-city`}>Місто або населений пункт</label>
        <div style={{ position: "relative" }}>
        <input
          id={`${listId}-city`}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${listId}-list`}
          aria-autocomplete="list"
          autoComplete="off"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            blurTimer.current = setTimeout(() => {
              setOpen(false);
              commitTyped();
            }, 150);
          }}
          onKeyDown={onKeyDown}
          placeholder="Почніть вводити: Київ, Львів, Ірпінь…"
          required
          className="dbju-form-input"
        />
        {open && (
          <ul id={`${listId}-list`} role="listbox" className="dbju-city-list">
            {suggestions.length === 0 ? (
              <li className="dbju-city-empty">
                Немає в списку — залиште «{query.trim()}» і оберіть область нижче
              </li>
            ) : (
              suggestions.map((c, i) => (
                <li
                  key={`${c.name}-${c.region}`}
                  role="option"
                  aria-selected={i === active}
                  className={i === active ? "active" : ""}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (blurTimer.current) clearTimeout(blurTimer.current);
                    choose(c.name, c.region);
                  }}
                  onMouseEnter={() => setActive(i)}
                >
                  <strong>{c.name}</strong>
                  {c.region !== c.name && <span>{c.region}</span>}
                </li>
              ))
            )}
          </ul>
        )}
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
          {POPULAR_CITIES.map((name) => {
            const c = findCity(name)!;
            return (
              <button
                key={name}
                type="button"
                className={`dbju-btn-small ${value.city === name ? "primary" : ""}`}
                style={{ padding: "4px 10px", fontSize: "12px" }}
                onClick={() => choose(c.name, c.region)}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Область — лише якщо населеного пункту немає в довіднику */}
      {value.city && !known && (
        <div className="dbju-form-group">
          <label className="dbju-form-label">Область</label>
          <select value={value.region} onChange={(e) => set({ region: e.target.value })} required className="dbju-form-input">
            <option value="">Оберіть область</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      )}

      {/* 2. Вулиця */}
      <div className="dbju-form-group">
        <label className="dbju-form-label">Вулиця, будинок (необов&apos;язково)</label>
        <input
          value={value.street}
          onChange={(e) => set({ street: e.target.value })}
          placeholder="Наприклад: вул. Хорива, 5"
          maxLength={150}
          autoComplete="street-address"
          className="dbju-form-input"
        />
      </div>

      {/* 3. Карта */}
      <div className="dbju-form-group">
        <button type="button" className="dbju-btn-small" style={{ alignSelf: "flex-start" }} onClick={() => setShowMap((v) => !v)}>
          📍 {showMap ? "Сховати карту" : "Вказати точку на карті"}
        </button>
        {showMap && (
          <>
            <MapPicker center={center} pin={value.lat !== null && value.lng !== null ? { lat: value.lat, lng: value.lng } : null} onPick={onPick} />
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <span className="dbju-settings-hint" style={{ margin: 0 }}>
                {geoStatus ?? "Клікніть на карті або перетягніть мітку — адреса підставиться автоматично."}
              </span>
              {value.lat !== null && (
                <button type="button" className="dbju-btn-small danger" style={{ padding: "4px 10px", fontSize: "12px" }} onClick={() => { set({ lat: null, lng: null }); setGeoStatus(null); }}>
                  Прибрати точку
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {value.city && (
        <div className="dbju-settings-hint" style={{ margin: 0 }}>
          Орендарі побачать:{" "}
          <strong>
            {value.street
              ? `${value.city}, ${value.street}`
              : value.region && value.region !== value.city
                ? `${value.city}, ${value.region}`
                : value.city}
          </strong>
        </div>
      )}
    </div>
  );
};
