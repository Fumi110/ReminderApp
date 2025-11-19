// /src/utils/datejs.js
// Date utilities with JST (Asia/Tokyo) timezone support
// ReminderApp Ver.3.1 - Extended (addWeeks など)

export function getCurrentJSTDate() {
  const now = new Date();
  const jstOffset = 9 * 60; // JST is UTC+9
  const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcTime + jstOffset * 60000);
}

export function getStartOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatYearMonth(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function getISOWeekNumber(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

export function getWeekOfMonth(date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const startDay = firstDay.getDay(); // 0 = Sunday, 6 = Saturday

  const adjustedDay = startDay === 0 ? 6 : startDay - 1;
  return Math.ceil((dayOfMonth + adjustedDay) / 7);
}

export function getISOWeekYear(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

export function getWeekBoundaries(year, week) {
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - jan4Day + 1);

  const startDate = new Date(firstMonday);
  startDate.setDate(firstMonday.getDate() + (week - 1) * 7);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  return { startDate, endDate };
}

export function getJapaneseDayOfWeek(date) {
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return days[date.getDay()];
}

export function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as first day
  d.setDate(d.getDate() + diff);
  return getStartOfDay(d);
}

export function getEndOfWeek(date) {
  const startOfWeek = getStartOfWeek(date);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return getEndOfDay(endOfWeek);
}

export function getStartOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getEndOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function getStartOfAcademicYear(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  if (month < 3) {
    return new Date(year - 1, 3, 1);
  }

  return new Date(year, 3, 1);
}

export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ⭐ 追加：月単位加算（DutyManager などで使用）
export function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

// ⭐ 追加：週単位加算（Votes などで使用）
export function addWeeks(date, weeks) {
  return addDays(date, weeks * 7);
}

export function isSameDay(date1, date2) {
  return formatDate(date1) === formatDate(date2);
}

export function parseDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}
