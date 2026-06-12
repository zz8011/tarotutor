// ============================================================
// 日期工具：统一使用「本地时区」的 YYYY-MM-DD 字符串。
// 注意不要用 toISOString().split('T')[0]，那是 UTC 日期，
// 在 UTC+8 时区会导致每天早上 8 点前打卡被算到前一天。
// ============================================================

/** 返回本地时区的 YYYY-MM-DD 日期字符串 */
export function localDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** 返回 N 天前（或 N 天后，传负数）的本地日期字符串 */
export function localDateStringOffset(daysAgo: number, from: Date = new Date()): string {
  const copy = new Date(from);
  copy.setDate(copy.getDate() - daysAgo);
  return localDateString(copy);
}
