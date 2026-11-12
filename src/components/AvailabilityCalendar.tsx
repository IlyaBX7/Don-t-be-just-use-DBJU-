"use client";

import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { MONTHS_NOM, addDays, parseISODate } from "../lib/dates";

interface Range {
  start: string;
  end: string;
}

// Календар зайнятості речі на сторінці товару (лише перегляд, два місяці)
export const AvailabilityCalendar = ({ productId, onPick }: { productId: string; onPick?: () => void }) => {
  const [data, setData] = useState<{ today: string; booked: Range[]; rentedUntil: string | null } | null>(null);

  useEffect(() => {
    api<{ today: string; booked: Range[]; rentedUntil: string | null }>(`/api/products/${productId}/availability`)
      .then(setData)
      .catch(() => setData(null));
  }, [productId]);

  const months = useMemo(() => {
    if (!data) return [];
    const t = parseISODate(data.today);
    return [0, 1].map((offset) => {
      const first = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + offset, 1));
      const y = first.getUTCFullYear();
      const m = first.getUTCMonth();
      const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      const lead = (first.getUTCDay() + 6) % 7;
      const cells: (string | null)[] = Array(lead).fill(null);
      for (let d = 1; d <= days; d++) cells.push(`${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
      return { title: `${MONTHS_NOM[m]} ${y}`, cells };
    });
  }, [data]);

  if (!data) return null;
  const isBusy = (day: string) =>
    data.booked.some((r) => day >= r.start && day <= r.end) || (data.rentedUntil !== null && day >= data.today && day <= data.rentedUntil);
  const freeSoon = Array.from({ length: 14 }, (_, i) => addDays(data.today, i)).filter((d) => !isBusy(d)).length;

  return (
    <div className="dbju-avail">
      <div className="dbju-avail-head">
        <h3 style={{ fontSize: "17px", fontWeight: 800 }}>Коли вільно</h3>
        <span className="dbju-settings-hint" style={{ margin: 0 }}>
          {freeSoon === 14 ? "Вільно всі найближчі 2 тижні" : `Вільних днів у найближчі 2 тижні: ${freeSoon}`}
        </span>
      </div>
      <div className="dbju-avail-months">
        {months.map((mo) => (
          <div key={mo.title}>
            <div className="dbju-avail-title">{mo.title}</div>
            <div className="dbju-avail-grid" role="grid" aria-label={mo.title}>
              {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"].map((w) => (
                <span key={w} className="dbju-avail-wd">{w}</span>
              ))}
              {mo.cells.map((day, i) => {
                if (!day) return <span key={`e${i}`} />;
                const past = day < data.today;
                const busy = !past && isBusy(day);
                return (
                  <button
                    key={day}
                    type="button"
                    className={`dbju-avail-day ${past ? "past" : busy ? "busy" : "free"} ${day === data.today ? "today" : ""}`}
                    title={past ? undefined : busy ? "Зайнято" : "Вільно"}
                    disabled={past || busy || !onPick}
                    onClick={onPick}
                  >
                    {Number(day.slice(8))}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="dbju-avail-legend">
        <span><i className="free" /> вільно</span>
        <span><i className="busy" /> зайнято</span>
      </div>
    </div>
  );
};
