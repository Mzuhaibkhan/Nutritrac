"use client";
import { useState } from "react";

interface TimeRangeSelectorProps {
  value: string;
  onChange: (v: string) => void;
}

const RANGES = [
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "year", label: "Year" },
];

export default function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="time-range-group">
      {RANGES.map(r => (
        <button key={r.key} onClick={() => onChange(r.key)} className={`time-range-btn${value === r.key ? " active" : ""}`}>
          {r.label}
        </button>
      ))}
    </div>
  );
}
