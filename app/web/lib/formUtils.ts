import type { KeyboardEvent } from "react";

export function sanitizeInteger(value: string, maxDigits: number): string {
  return value.replace(/\D/g, "").slice(0, maxDigits);
}

export function sanitizeDecimal(
  value: string,
  maxIntDigits = 6,
  maxDecDigits = 2,
): string {
  let v = value.replace(/[^\d.]/g, "");
  const dotIndex = v.indexOf(".");
  if (dotIndex !== -1) {
    const intPart = v.slice(0, dotIndex).slice(0, maxIntDigits);
    const decPart = v.slice(dotIndex + 1).replace(/\./g, "").slice(0, maxDecDigits);
    v = intPart + "." + decPart;
  } else {
    v = v.slice(0, maxIntDigits);
  }
  return v;
}

export function onNumericKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
  if (e.ctrlKey || e.metaKey) return;
  const nav = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
  if (nav.includes(e.key)) return;
  if (!/^\d$/.test(e.key)) e.preventDefault();
}

export function onDecimalKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
  if (e.ctrlKey || e.metaKey) return;
  const nav = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Home", "End"];
  if (nav.includes(e.key)) return;
  if (e.key === "." && !e.currentTarget.value.includes(".")) return;
  if (!/^\d$/.test(e.key)) e.preventDefault();
}
