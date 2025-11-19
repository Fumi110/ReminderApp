// /src/utils/datejs.js
// Date utilities with JST (Asia/Tokyo) timezone support
// ReminderApp Ver.2.8.1 - Full Implementation

/**
 * Get current date in JST (Asia/Tokyo)
 * @returns {Date} Current date in JST
 */
export function getCurrentJSTDate() {
  const now = new Date();
  const jstOffset = 9 * 60; // JST is UTC+9
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utcTime + (jstOffset * 60000));
}

/**
 * Get start of day (00:00:00) for a given date
 * @param {Date} date - Input date
 * @returns {Date} Start of day
 */
export function getStartOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get end of day (23:59:59.999) for a given date
 * @param {Date} date - Input date
 * @returns {Date} End of day
 */
export function getEndOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Format date as YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Format date as YYYY-MM
 * @param {Date} date - Date to format
 * @returns {string} Formatted year-month string
 */
export function formatYearMonth(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * Get ISO week number for a date
 * @param {Date} date - Input date
 * @returns {number} ISO week number (1-53)
 */
export function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Get week number within the month (1-5)
 * This calculates which week of the month a date falls into
 * @param {Date} date - Input date
 * @returns {number} Week of month (1-5)
 */
export function getWeekOfMonth(date) {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const startDay = firstDay.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Calculate week number (1-indexed)
  // Week starts on Monday, so adjust Sunday to be part of previous week
  const adjustedDay = startDay === 0 ? 6 : startDay - 1;
  return Math.ceil((dayOfMonth + adjustedDay) / 7);
}

/**
 * Get year for ISO week (may differ from calendar year at year boundaries)
 * @param {Date} date - Input date
 * @returns {number} ISO week year
 */
export function getISOWeekYear(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  return d.getUTCFullYear();
}

/**
 * Get start and end dates for a given ISO week
 * @param {number} year - Year
 * @param {number} week - ISO week number (1-53)
 * @returns {object} { startDate: Date, endDate: Date }
 */
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

/**
 * Get day of week in Japanese
 * @param {Date} date - Input date
 * @returns {string} Japanese day name (日/月/火/水/木/金/土)
 */
export function getJapaneseDayOfWeek(date) {
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return days[date.getDay()];
}

/**
 * Get start of week (Monday) for a given date
 * @param {Date} date - Input date
 * @returns {Date} Monday of the week
 */
export function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday as first day
  d.setDate(d.getDate() + diff);
  return getStartOfDay(d);
}

/**
 * Get end of week (Sunday) for a given date
 * @param {Date} date - Input date
 * @returns {Date} Sunday of the week
 */
export function getEndOfWeek(date) {
  const startOfWeek = getStartOfWeek(date);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return getEndOfDay(endOfWeek);
}

/**
 * Get start of month
 * @param {Date} date - Input date
 * @returns {Date} First day of month
 */
export function getStartOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get end of month
 * @param {Date} date - Input date
 * @returns {Date} Last day of month
 */
export function getEndOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Get start of year (April 1st for academic year)
 * @param {Date} date - Input date
 * @returns {Date} April 1st of current or previous academic year
 */
export function getStartOfAcademicYear(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // If before April, use previous year's April 1st
  if (month < 3) {
    return new Date(year - 1, 3, 1);
  }
  
  return new Date(year, 3, 1);
}

/**
 * Add days to a date
 * @param {Date} date - Starting date
 * @param {number} days - Number of days to add (can be negative)
 * @returns {Date} New date
 */
export function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Check if two dates are on the same day
 * @param {Date} date1 - First date
 * @param {Date} date2 - Second date
 * @returns {boolean} True if same day
 */
export function isSameDay(date1, date2) {
  return formatDate(date1) === formatDate(date2);
}

/**
 * Parse YYYY-MM-DD string to Date
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Date} Parsed date
 */
export function parseDate(dateStr) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}