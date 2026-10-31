/**
 * 首页：帖子列表、搜索、加载更多，以及「发布新帖」的维护提示。
 */
import { CONFIG } from '../config.js';
import { escapeHtml } from '../format.js';
import { countComments, loadStoryPosts } from '../store.js';
import { filterPosts, isSecretTrigger, secretReplies } from '../search.js';
import { emptyStateHtml, postListHtml } from '../render.js';
import { openDialog } from '../ui.js';
import { isLoggedIn, openLoginDialog } from '../account.js';

const state = {
  posts: [],
  visible: 0,
  keyword: ''
};

export async function boot() {
  bindPostEntry();
  bindSearch();
  bindLoadMore();

  try {
    const dataset = await loadStoryPosts();
    state.posts = dataset.posts;
    state.visible = Math.min(CONFIG.list.pageSize, state.posts.length);
  } catch (error) {
    console.error(error);
    const list = document.getElementById('postList');
    if (list) list.innerHTML = `<li>${emptyStateHtml('帖子加载失败，请刷新页面重试。')}</li>`;
    return;
  }

  renderList();
  renderStats();
}

/* ---------- 发布入口：表单还在，提交只会看到维护说明 ---------- */

function bindPostEntry() {
  document.getElementById('openPostForm')?.addEventListener('click', openPostForm);
}

function openPostForm() {
  const dialog = openDialog({
    title: '发布新帖',
    kicker: '维护期间只读',
    wide: true,
    html: `
      <p>表单还留着，但发布通道正在维护，提交后会看到说明。已有帖子不受影响。</p>
      <form class="form-grid" id="dialogPostForm" novalidate>
        <label for="dlgNickname">昵称</label>
        <input class="field" type="text" id="dlgNickname" maxlength="20" placeholder="不超过 20 字（可选）" autocomplete="off">

        <label for="dlgTitle">标题</label>
        <input class="field" type="text" id="dlgTitle" maxlength="100" placeholder="不超过 100 字">

        <label for="dlgContent">内容</label>
        <textarea class="field" id="dlgContent" maxlength="5000" placeholder="不超过 5000 字"></textarea>
      </form>`,
    actions: [
      { label: '取消', keep: true },
      { label: '发布', primary: true, keep: true }
    ]
  });

  const form = dialog.dialog.querySelector('#dialogPostForm');
  const publish = dialog.dialog.querySelector('.ui-modal__actions .btn--primary');

  const submitMaintenance = async (event) => {
    event?.preventDefault();
    await openMaintenanceNotice(dialog);
  };

  form?.addEventListener('submit', submitMaintenance);
  publish?.addEventListener('click', submitMaintenance);
}

function openMaintenanceNotice(dialog) {
  const { title, message } = CONFIG.maintenance;
  dialog.body.innerHTML = '';
  const kicker = document.createElement('p');
  kicker.className = 'ui-modal__kicker';
  kicker.textContent = title;
  dialog.body.appendChild(kicker);

  String(message)
    .split(/\n{2,}/)
    .forEach((paragraph) => {
      const p = document.createElement('p');
      p.textContent = paragraph;
      dialog.body.appendChild(p);
    });

  dialog.setActions([{ label: CONFIG.maintenance.confirmText || '知道了', primary: true }]);
}

/* ---------- 列表 ---------- */

function renderList() {
  const list = document.getElementById('postList');
  if (!list) return;

  if (!state.posts.length) {
    list.innerHTML = `<li>${emptyStateHtml('这里还没有帖子。')}</li>`;
    renderLoadMore();
    return;
  }

  list.innerHTML = postListHtml(state.posts.slice(0, state.visible), { total: state.posts.length });
  renderLoadMore();
}

function renderLoadMore() {
  const box = document.getElementById('loadMore');
  if (!box) return;

  const remaining = state.posts.length - state.visible;
  box.innerHTML = remaining <= 0
    ? ''
    : `<button type="button" class="btn" data-load-more>加载更多（还有 ${remaining} 篇）</button>`;
}

function bindLoadMore() {
  const box = document.getElementById('loadMore');
  if (!box) return;
  box.addEventListener('click', (event) => {
    if (!event.target.closest('[data-load-more]')) return;
    state.visible = Math.min(state.visible + CONFIG.list.pageSize, state.posts.length);
    renderList();
  });
}

function renderStats() {
  const comments = countComments(state.posts);
  const total = state.posts.length;

  const numbers = document.querySelectorAll('#siteStats b');
  if (numbers.length === 2) {
    numbers[0].textContent = String(total);
    numbers[1].textContent = String(comments);
  }

  const stats = document.getElementById('listStats');
  if (stats) {
    stats.textContent = total
      ? `共 ${total} 篇帖子 · ${comments} 条评论 · 只读模式`
      : '暂无帖子';
  }

  const task = document.getElementById('taskStats');
  if (task) task.textContent = `${total} 篇 · ${comments} 条评论`;
}

/* ---------- 搜索 ---------- */

function bindSearch() {
  const form = document.getElementById('searchForm');
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearchBtn');

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    /* 检索属于站内功能：未登录先要账号 */
    if (!isLoggedIn()) {
      openLoginDialog({
        reason: '检索需要登录账号',
        onSuccess: () => runSearch()
      });
      return;
    }
    runSearch();
  });

  clearBtn?.addEventListener('click', clearSearch);

  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') clearSearch();
  });
}

function runSearch() {
  const keyword = (document.getElementById('searchInput')?.value || '').trim();

  // 剧情入口：命中即跳转
  if (isSecretTrigger(keyword)) {
    window.location.href = 'secret.html';
    return;
  }

  if (!keyword) {
    clearSearch();
    return;
  }

  const matches = filterPosts(state.posts, keyword);
  const replies = secretReplies(keyword);

  const resultBox = document.getElementById('searchResult');
  const listBox = document.getElementById('postList');
  const moreBox = document.getElementById('loadMore');
  const statsBox = document.getElementById('listStats');
  if (!resultBox) return;

  let html = '';
  if (replies.length) {
    html += `<div class="notice"><b>回应</b><span>${replies.map(escapeHtml).join('<br>')}</span></div>`;
  }
  html += matches.length
    ? `<p class="list-stats">找到 ${matches.length} 篇相关帖子</p>
       <ol class="post-list">${postListHtml(matches, {
         keyword,
         numberOf: (post) => state.posts.length - state.posts.indexOf(post)
       })}</ol>`
    : emptyStateHtml('没有找到相关帖子。换个词试试，或者清空检索。');

  resultBox.innerHTML = html;
  resultBox.hidden = false;
  if (listBox) listBox.hidden = true;
  if (moreBox) moreBox.hidden = true;
  if (statsBox) statsBox.hidden = true;

  state.keyword = keyword;
}

function clearSearch() {
  state.keyword = '';
  const input = document.getElementById('searchInput');
  if (input) input.value = '';

  const resultBox = document.getElementById('searchResult');
  if (resultBox) {
    resultBox.innerHTML = '';
    resultBox.hidden = true;
  }

  const listBox = document.getElementById('postList');
  if (listBox) listBox.hidden = false;

  const statsBox = document.getElementById('listStats');
  if (statsBox) statsBox.hidden = false;

  const moreBox = document.getElementById('loadMore');
  if (moreBox) moreBox.hidden = false;

  renderList();
  renderStats();
}
