/**
 * 帖子详情：只读展示 + 评论区（发表入口改为维护提示）。
 */
import { CONFIG } from '../config.js';
import { isAdmin } from '../auth.js';
import { findPost, loadArchive, loadStoryPosts } from '../store.js';
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

  const showOnly = (html) => {
    detail.innerHTML = html;
    if (commentsSection) {
      commentsSection.hidden = true;
      commentsSection.style.display = '';
    }

  };

  if (!id) {
    showOnly(emptyStateHtml('未指定帖子。'));
    return;
  }

  // 档案条目需要管理员模式
  if (fromArchive && !isAdmin()) {
    showOnly(`
      <div class="admin-gate">
        <p class="detail__kicker">受限条目</p>
        <h2 class="admin-gate__title">需要管理员模式</h2>
        <p class="admin-gate__desc">这是一条未公开的档案条目，请先在「管理员登录」用账号与密码登录后查看。</p>
        <p><a class="link" href="admin.html">前往管理员登录 →</a></p>
      </div>`);
    return;
  }

  try {
    const dataset = fromArchive ? await loadArchive() : await loadStoryPosts();
    const post = findPost(dataset.posts, id);

    if (!post) {
      showOnly(emptyStateHtml('帖子不存在，可能已被移除。'));
      return;
    }

    document.title = `${post.title} - ${CONFIG.siteName}`;

    const task = document.getElementById('taskTitle');
    if (task) task.textContent = post.title;

    detail.innerHTML = detailHtml(post, { archive: fromArchive });

    if (commentsSection) {
      commentsSection.style.display = '';
      commentsSection.hidden = false;
    }

    const commentsList = document.getElementById('commentsList');
    if (commentsList) commentsList.innerHTML = commentsHtml(post);

    /* 有人在盯着这条帖子：先让你看到原文，一秒后反驳才刷出来 */
    if (post.comments.some((comment) => comment.delayed)) {
      window.setTimeout(() => {
        detail.innerHTML = detailHtml(post, { archive: fromArchive, includeDelayed: true });
        if (commentsList) commentsList.innerHTML = commentsHtml(post, { includeDelayed: true });
      }, 1000);
    }
  } catch (error) {
    console.error(error);
    showOnly(emptyStateHtml('加载失败，请稍后重试。'));
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
