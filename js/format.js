/**
 * 文本与时间格式化。
 *
 * 约定：
 *  1. 数据文件里存「原文」，渲染时才统一 escape（避免旧版存转义后内容、编辑时二次转义的问题）。
 *  2. 时间一律存带时区偏移的 ISO 字符串，展示时按访问者本地时区格式化。
 */

const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/** HTML 转义。所有要进 innerHTML 的用户内容都必须先过这里。 */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}

/** 构造 RegExp 时对用户输入做转义。 */
export function escapeRegExp(value) {
  return String(value ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 解析 ISO 字符串；无法解析时返回 null。 */
export function parseTime(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** 展示用时间：2026/9/26 23:46:34（按本地时区）。 */
export function formatDateTime(value) {
  const date = parseTime(value);
  if (!date) return '时间未知';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** 列表摘要：压掉换行、截断到 max 个字符。 */
export function excerpt(text, max = 150) {
  const flat = String(text ?? '').replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max)}...` : flat;
}
