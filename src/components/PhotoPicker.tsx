"use client";

/* eslint-disable @next/next/no-img-element -- фото віддаються нашим API */
import React, { useRef, useState } from "react";
import { uploadImage } from "../lib/api";
import { CameraIcon } from "./Icons";
import { ErrorBox } from "./LoginRequired";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  kind?: "product" | "report";
  label?: string;
}

// Завантаження кількох фото (стан речі при передачі, пошкодження тощо)
export const PhotoPicker = ({ value, onChange, max = 4, kind = "report", label = "Додати фото" }: Props) => {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError(null);
    const urls = [...value];
    try {
      for (const f of Array.from(files).slice(0, max - urls.length)) urls.push(await uploadImage(f, kind));
      onChange(urls);
    } catch (e) {
      onChange(urls);
      setError(e instanceof Error ? e.message : "Не вдалося завантажити фото");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <div className="dbju-photo-picker">
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" multiple hidden onChange={(e) => add(e.target.files)} />
      <div className="dbju-photo-picker-row">
        {value.map((u) => (
          <div key={u} className="dbju-photo-picker-item">
            <img src={u} alt="" />
            <button type="button" aria-label="Прибрати фото" onClick={() => onChange(value.filter((x) => x !== u))}>×</button>
          </div>
        ))}
        {value.length < max && (
          <button type="button" className="dbju-photo-picker-add" disabled={busy} onClick={() => ref.current?.click()}>
            <CameraIcon size={20} />
            <span>{busy ? "Завантаження…" : label}</span>
          </button>
        )}
      </div>
      {error && <ErrorBox message={error} />}
    </div>
  );
};

// Ряд мініатюр (перегляд фото «до/після»)
export const PhotoStrip = ({ title, photos }: { title: string; photos: string[] }) =>
  photos.length === 0 ? null : (
    <div className="dbju-photo-strip">
      <div className="dbju-photo-strip-title">{title}</div>
      <div className="dbju-photo-picker-row">
        {photos.map((u) => (
          <a key={u} href={u} target="_blank" rel="noreferrer" className="dbju-photo-picker-item" title="Відкрити фото">
            <img src={u} alt={title} />
          </a>
        ))}
      </div>
    </div>
  );
