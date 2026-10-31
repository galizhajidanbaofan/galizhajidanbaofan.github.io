/**
 * 帖子详情：只读展示 + 评论区（发表入口改为维护提示）。
 */
import { CONFIG } from '../config.js';
import { isAdmin } from '../auth.js';
import { findPost, loadArchive, loadPosts } from '../store.js';
import { commentsHtml, detailHtml, emptyStateHtml } from '../render.js';
import { openModal } from '../ui.js';

export async function boot() {
  bindCommentForm();

  const detail = document.getElementById('postDetail');
  const commentsSection = document.getElementById('commentsSection');
  if (!detail) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const fromArchive = params.get('from') === 'archive';

  const hideComments = () => {
    if (commentsSection) commentsSection.style.display = 'none';
  };

  if (!id) {
    detail.innerHTML = emptyStateHtml('未指定帖子。');
    hideComments();
    return;
  }

  // 档案条目需要管理员模式
  if (fromArchive && !isAdmin()) {
    detail.innerHTML = `
      <div class="admin-gate">
        <h2>需要管理员模式</h2>
        <p class="admin-gate__desc">这是一条未公开的档案条目，请先进入管理员模式再查看。</p>
        <p><a href="admin.html">前往管理员模式 →</a></p>
      </div>`;
    hideComments();
    return;
  }

  try {
    const dataset = fromArchive ? await loadArchive() : await loadPosts();
    const post = findPost(dataset.posts, id);

    if (!post) {
      detail.innerHTML = emptyStateHtml('帖子不存在，可能已被移除。');
      hideComments();
      return;
    }

    document.title = `${post.title} - ${CONFIG.siteName}`;
    detail.innerHTML = detailHtml(post, { archive: fromArchive });

    if (commentsSection) commentsSection.style.display = 'block';
    const commentsList = document.getElementById('commentsList');
    if (commentsList) commentsList.innerHTML = commentsHtml(post);
  } catch (error) {
    console.error(error);
    detail.innerHTML = emptyStateHtml('加载失败，请稍后重试。');
    hideComments();
  }
}

function bindCommentForm() {
  const form = document.getElementById('commentForm');
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await openModal(CONFIG.maintenance);
  });
}
