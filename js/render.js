/**
 * 渲染层：只负责把数据变成 HTML 字符串。
 * 所有用户内容都必须经过 escapeHtml / highlight（内部含转义）。
 */
import { escapeHtml, excerpt, formatDateTime } from './format.js';
import { highlight } from './search.js';

export function emptyStateHtml(text) {
  return `<p class="empty-state">${escapeHtml(text)}</p>`;
}

/** 「2026/9/26 23:46:34」→ { date: '2026.09.26', clock: '23:46' } */
function splitStamp(value) {
  const full = formatDateTime(value);
  const [datePart = '', clockPart = ''] = full.split(' ');
  const date = datePart
    .split('/')
    .map((part, index) => (index === 0 ? part : part.padStart(2, '0')))
    .join('.');
  return { date, clock: clockPart.slice(0, 5) };
}

export function postItemHtml(post, { keyword = '', archive = false, no = 0 } = {}) {
  const href = `post.html?id=${encodeURIComponent(post.id)}${archive ? '&from=archive' : ''}`;
  const edited = post.editTime ? '<span class="row__flag">已编辑</span>' : '';
  const stamp = splitStamp(post.editTime || post.time);
  const uid = post.userId || '未知';

  return `
    <li class="row">
      <div class="row__no">
        NO.${String(no).padStart(3, '0')}
        <time>${escapeHtml(stamp.date)}</time>
        <span class="row__clock">${escapeHtml(stamp.clock)}</span>
      </div>
      <div class="row__main">
        <h2 class="row__title"><a href="${href}">${highlight(post.title, keyword)}</a>${edited}</h2>
        <p class="row__excerpt">${highlight(excerpt(post.content, 150), keyword)}</p>
        <div class="row__meta">
          <span>${escapeHtml(post.author)}</span>
          <span class="uid">ID: ${escapeHtml(uid)}</span>
          <span>回复 ${post.comments.length}</span>
          <span class="row__stamp">${escapeHtml(stamp.date)} ${escapeHtml(stamp.clock)}</span>
        </div>
      </div>
    </li>`;
}

export function postListHtml(posts, options = {}) {
  const total = Number.isFinite(options.total) ? options.total : posts.length;
  const { numberOf, ...rest } = options;
  return posts
    .map((post, index) => {
      const no = typeof numberOf === 'function' ? numberOf(post, index) : total - index;
      return postItemHtml(post, { ...rest, no });
    })
    .join('');
}

export function detailHtml(post, { archive = false } = {}) {
  const uid = post.userId || '未知';

  return `
    <article class="detail">
      <header class="detail__head">
        <p class="detail__kicker">${archive ? '档案条目' : '帖子'}</p>
        <h2 class="detail__title">${escapeHtml(post.title)}</h2>
        ${archive ? '<p class="admin-badge">仅管理员模式可见</p>' : ''}
        <div class="detail__meta">
          <span>${escapeHtml(post.author)}</span>
          <span class="uid">ID: ${escapeHtml(uid)}</span>
          <span>发布于 ${escapeHtml(formatDateTime(post.time))}</span>
          ${post.editTime ? `<span>编辑于 ${escapeHtml(formatDateTime(post.editTime))}</span>` : ''}
          <span>${post.comments.length} 条评论</span>
        </div>
      </header>
      <div class="post-body">${escapeHtml(post.content)}</div>
      <div class="detail__foot"><a href="index.html">← 返回首页</a></div>
    </article>`;
}

export function commentsHtml(post) {
  if (!post.comments.length) {
    return '<li><p class="empty-state">还没有人回复。</p></li>';
  }

  return post.comments
    .map((comment) => `
      <li class="comment">
        <div class="comment__head">
          <span class="floor">${Number(comment.floor) || 1}F</span>
          <span>${escapeHtml(comment.author)}</span>
          <span>${escapeHtml(formatDateTime(comment.time))}</span>
        </div>
        <p class="comment__body">${escapeHtml(comment.content)}</p>
      </li>`)
    .join('');
}
