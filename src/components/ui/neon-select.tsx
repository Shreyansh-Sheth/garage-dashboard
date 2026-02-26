"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface NeonSelectOption {
  value: string;
  label: string;
}

interface NeonSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: NeonSelectOption[];
  placeholder?: string;
  color?: string;
  className?: string;
  size?: "sm" | "md";
}

export function NeonSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  color = "#00f0ff",
  className = "",
  size = "md",
}: NeonSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;
  const hasValue = !!selected;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [open]);

  const sizeClasses = size === "sm"
    ? "px-2.5 py-1.5 text-[11px]"
    : "px-3.5 py-2.5 text-[12px]";

  const menuSizeClasses = size === "sm"
    ? "text-[11px]"
    : "text-[12px]";

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border transition-all duration-200 font-medium outline-none ${sizeClasses}`}
        style={{
          backgroundColor: "#0a0a14",
          borderColor: open ? `${color}44` : "#18183066",
          color: hasValue ? "#e0e0f0" : "#5a5a80",
          boxShadow: open ? `0 0 0 1px ${color}15, 0 0 20px ${color}08` : undefined,
        }}
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          style={{ color: open ? color : "#5a5a80" }}
        />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          className={`absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-[#1e1e38] shadow-2xl ${menuSizeClasses}`}
          style={{
            backgroundColor: "#0c0c18",
            boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px #18183044, 0 0 24px ${color}06`,
          }}
        >
          <div className="max-h-[200px] overflow-y-auto py-1 scrollbar-thin">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors duration-100"
                  style={{
                    color: isSelected ? color : "#b0b0cc",
                    backgroundColor: isSelected ? `${color}08` : undefined,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "#141425";
                      e.currentTarget.style.color = "#e0e0f0";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#b0b0cc";
                    }
                  }}
                >
                  <span className="flex-1 truncate">{option.label}</span>
                  {isSelected && (
                    <Check className="h-3 w-3 shrink-0" style={{ color }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
