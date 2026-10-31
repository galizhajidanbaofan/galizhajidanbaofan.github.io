/**
 * 渲染层：只负责把数据变成 HTML 字符串。
 * 所有用户内容都必须经过 escapeHtml / highlight（内部含转义）。
 */
import { escapeHtml, excerpt, formatDateTime } from './format.js';
import { highlight } from './search.js';

export function emptyStateHtml(text) {
  return `<p class="empty-state">${escapeHtml(text)}</p>`;
}

export function postItemHtml(post, { keyword = '', archive = false } = {}) {
  const href = `post.html?id=${encodeURIComponent(post.id)}${archive ? '&from=archive' : ''}`;
  const edited = post.editTime ? '<span class="post-flag">(已编辑)</span>' : '';

  return `
    <article class="post-item">
      <h3>
        <a href="${href}">${highlight(post.title, keyword)}</a>
        ${edited}
      </h3>
      <div class="meta">
        <span class="post-author">👤 ${escapeHtml(post.author)}</span>
        📅 ${escapeHtml(formatDateTime(post.editTime || post.time))}
        <span class="comment-count">💬 ${post.comments.length}</span>
      </div>
      <div class="content">${highlight(excerpt(post.content, 150), keyword)}</div>
    </article>`;
}

export function postListHtml(posts, options = {}) {
  return posts.map((post) => postItemHtml(post, options)).join('');
}

export function detailHtml(post, { archive = false } = {}) {
  return `
    <div class="detail-header">
      <h2>${escapeHtml(post.title)}</h2>
      ${archive ? '<p class="admin-badge">档案条目 · 仅管理员模式可见</p>' : ''}
      <div class="meta">
        <span class="post-author">👤 ${escapeHtml(post.author)}</span>
        <span class="post-uid">ID: ${escapeHtml(post.userId || '未知')}</span>
        ${post.editTime ? `<span class="post-flag">✏️ 编辑于 ${escapeHtml(formatDateTime(post.editTime))}</span>` : ''}
        <br>📅 发布于 ${escapeHtml(formatDateTime(post.time))}
        <span class="comment-count">💬 ${post.comments.length} 条评论</span>
      </div>
      <div class="post-body">${escapeHtml(post.content)}</div>
      <div class="post-back"><a href="index.html">← 返回首页</a></div>
    </div>`;
}

export function commentsHtml(post) {
  if (!post.comments.length) {
    return '<div class="no-comments">💬 暂无评论</div>';
  }

  return post.comments
    .map((comment) => `
      <div class="comment-item">
        <div class="comment-header">
          <span class="floor-badge">${Number(comment.floor) || 1}F</span>
          <span class="comment-author">👤 ${escapeHtml(comment.author)}</span>
          <span class="comment-time">${escapeHtml(formatDateTime(comment.time))}</span>
        </div>
        <div class="comment-body">${escapeHtml(comment.content)}</div>
      </div>`)
    .join('');
}
