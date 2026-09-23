// US phone check: accepts (862) 600-0056, 862-600-0056, +1 862 600 0056 …
export function isValidPhone(v = "") {
  const d = String(v).replace(/\D/g, "");
  return d.length === 10 || (d.length === 11 && d.startsWith("1"));
}

export function formatPhone(v = "") {
  let d = String(v).replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  if (d.length !== 10) return String(v).trim();
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export const isValidZip = (v = "") => !v || /^\d{5}$/.test(String(v).trim());
export const isValidEmail = (v = "") => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
