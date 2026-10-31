/**
 * 首页：帖子列表、搜索、加载更多，以及「发帖」入口的维护提示。
 */
import { CONFIG } from '../config.js';
import { escapeHtml } from '../format.js';
import { countComments, loadPosts } from '../store.js';
import { filterPosts, isSecretTrigger, secretReplies } from '../search.js';
import { emptyStateHtml, postItemHtml, postListHtml } from '../render.js';
import { openModal } from '../ui.js';

const state = {
  posts: [],
  visible: 0,
  keyword: ''
};

export async function boot() {
  bindMaintenance();
  bindSearch();
  bindLoadMore();

  try {
    const dataset = await loadPosts();
    state.posts = dataset.posts;
    state.visible = Math.min(CONFIG.list.pageSize, state.posts.length);
  } catch (error) {
    console.error(error);
    const list = document.getElementById('postList');
    if (list) list.innerHTML = emptyStateHtml('帖子加载失败，请刷新页面重试。');
    return;
  }

  renderList();
  renderStats();
}

/* ---------- 维护提示 ---------- */

function bindMaintenance() {
  const form = document.getElementById('postForm');
  if (!form) return;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await openModal(CONFIG.maintenance);
  });
}

/* ---------- 列表 ---------- */

function renderList() {
  const list = document.getElementById('postList');
  if (!list) return;

  if (!state.posts.length) {
    list.innerHTML = emptyStateHtml('📝 暂无帖子');
    renderLoadMore();
    return;
  }

  list.innerHTML = postListHtml(state.posts.slice(0, state.visible));
  renderLoadMore();
}

function renderLoadMore() {
  const box = document.getElementById('loadMore');
  if (!box) return;

  const remaining = state.posts.length - state.visible;
  if (remaining <= 0) {
    box.innerHTML = '';
    return;
  }

  box.innerHTML = `<button type="button" data-load-more>加载更多（还有 ${remaining} 条）</button>`;
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
  const target = document.getElementById('listStats');
  if (!target) return;
  const comments = countComments(state.posts);
  target.textContent = `共 ${state.posts.length} 篇帖子 · ${comments} 条评论`;
}

/* ---------- 搜索 ---------- */

function bindSearch() {
  const input = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const clearBtn = document.getElementById('clearSearchBtn');

  searchBtn?.addEventListener('click', runSearch);
  clearBtn?.addEventListener('click', clearSearch);
  input?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      runSearch();
    }
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
  if (!resultBox) return;

  let html = '';
  if (replies.length) {
    html += `<div class="search-secret">${replies.map(escapeHtml).join('<br>')}</div>`;
  }
  html += matches.length
    ? `<div class="search-info">找到 ${matches.length} 个相关帖子</div>` +
      postListHtml(matches, { keyword })
    : emptyStateHtml('🔍 未找到相关帖子');

  resultBox.innerHTML = html;
  resultBox.style.display = 'block';
  if (listBox) listBox.style.display = 'none';
  if (moreBox) moreBox.style.display = 'none';

  state.keyword = keyword;
}

function clearSearch() {
  state.keyword = '';
  const input = document.getElementById('searchInput');
  if (input) input.value = '';

  const resultBox = document.getElementById('searchResult');
  if (resultBox) {
    resultBox.innerHTML = '';
    resultBox.style.display = 'none';
  }

  const listBox = document.getElementById('postList');
  if (listBox) listBox.style.display = '';

  renderList();
}
