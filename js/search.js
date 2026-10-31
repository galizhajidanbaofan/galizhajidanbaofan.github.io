/**
 * 搜索与关键词彩蛋。
 */
import { escapeHtml, escapeRegExp } from './format.js';
import { SECRET_KEYWORDS, SECRET_TRIGGERS } from './lore.js';

/** 命中隐藏入口词？ */
export function isSecretTrigger(keyword) {
  const lower = String(keyword || '').toLowerCase();
  if (!lower) return false;
  return SECRET_TRIGGERS.some((trigger) => lower.includes(trigger.toLowerCase()));
}

/** 收集命中的彩蛋回复（可能多条）。 */
export function secretReplies(keyword) {
  const lower = String(keyword || '').toLowerCase();
  if (!lower) return [];
  return Object.entries(SECRET_KEYWORDS)
    .filter(([key]) => lower.includes(key.toLowerCase()))
    .map(([, reply]) => reply);
}

/** 在标题 / 正文 / 评论里搜索。 */
export function filterPosts(posts, keyword) {
  const lower = String(keyword || '').toLowerCase();
  if (!lower) return posts;

  return posts.filter((post) => (
    post.title.toLowerCase().includes(lower) ||
    post.content.toLowerCase().includes(lower) ||
    post.comments.some((comment) => comment.content.toLowerCase().includes(lower))
  ));
}

/**
 * 高亮关键词。
 * 先把原文转义，再在转义后的文本上匹配，命中处包 <mark>——这样既不会注入 HTML，
 * 也不会出现旧版「先插入标记再转义」的破版问题。
 */
export function highlight(text, keyword = '') {
  const safe = escapeHtml(text);
  const needle = String(keyword || '').trim();
  if (!needle) return safe;

  const pattern = new RegExp(escapeRegExp(escapeHtml(needle)), 'gi');
  return safe.replace(pattern, (match) => `<mark class="hl">${match}</mark>`);
}
