// Formatting helpers. No Vietnamese text here: only vi-VN number formatting.

const moneyFmt = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const numFmt = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });

export const fmtMoney = (n: number): string => moneyFmt.format(n).replace(/ /g, ' ');
export const fmtNumber = (n: number): string => numFmt.format(n);
export const fmtPercent = (n: number, digits = 1): string => `${n.toFixed(digits).replace('.', ',')}%`;
export const fmtDecimal = (n: number, digits = 2): string => n.toFixed(digits).replace('.', ',');

/** 'YYYY-MM-DD' or 'YYYY-MM-DDTHH:mm:ss' to dd/MM/yyyy. */
export const fmtDate = (s: string | null | undefined): string => {
  if (!s) return '';
  const [y, m, d] = s.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

export const fmtTime = (s: string | null | undefined): string => (s && s.length >= 16 ? s.slice(11, 16) : '');

export const fmtDateTime = (s: string | null | undefined): string => (s ? `${fmtDate(s)} ${fmtTime(s)}` : '');

/** dd/MM/yyyy to 'YYYY-MM-DD'; returns '' when the text is not a valid date. */
export const parseDate = (s: string): string => {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim());
  if (!m) return '';
  const iso = `${m[3]}-${m[2]!.padStart(2, '0')}-${m[1]!.padStart(2, '0')}`;
  return Number.isNaN(Date.parse(iso)) ? '' : iso;
};

const dayMs = 86_400_000;
export const dayDiff = (a: string, b: string): number =>
  Math.round((Date.parse(a.slice(0, 10)) - Date.parse(b.slice(0, 10))) / dayMs);

export const addDays = (d: string, n: number): string => new Date(Date.parse(d.slice(0, 10)) + n * dayMs).toISOString().slice(0, 10);

export const interpolate = (tpl: string, vars: Record<string, string | number> = {}): string =>
  tpl.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
