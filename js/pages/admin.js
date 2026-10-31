/**
 * 管理后台 → 管理员模式（只读档案区）。
 *
 * 这里没有任何写操作：登录后只能阅读隐藏条目，不能改、不能删。
 */
import { isAdmin, login, logout } from '../auth.js';
import { countComments, loadArchive } from '../store.js';
import { emptyStateHtml, postItemHtml } from '../render.js';
import { toast } from '../ui.js';

export async function boot() {
  const root = document.getElementById('adminRoot');
  if (!root) return;

  if (!isAdmin()) {
    renderGate(root);
    return;
  }

  await renderArchive(root);
}

/* ---------- 登录 ---------- */

function renderGate(root) {
  root.innerHTML = `
    <div class="admin-gate">
      <h2>管理员模式</h2>
      <p class="admin-gate__desc">登录后可阅读未公开的档案条目。管理模式为只读，不提供修改或删除功能。</p>
      <form id="adminForm" autocomplete="off">
        <label class="admin-gate__label" for="adminPassword">管理员口令</label>
        <input type="password" id="adminPassword" placeholder="请输入口令" required>
        <p class="admin-gate__error" id="adminError" role="alert"></p>
        <button type="submit" class="ui-btn ui-btn--primary">进入管理员模式</button>
      </form>
    </div>`;

  const form = root.querySelector('#adminForm');
  const input = root.querySelector('#adminPassword');
  const error = root.querySelector('#adminError');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;

    const ok = await login(input.value);
    button.disabled = false;

    if (!ok) {
      error.textContent = '口令不正确。';
      input.select();
      return;
    }

    toast('已进入管理员模式', 'success');
    await renderArchive(root);
  });

  input?.focus();
}

/* ---------- 档案区 ---------- */

async function renderArchive(root) {
  const archiveUrl = new URL('data/archive.json', window.location.href).href;

  root.innerHTML = `
    <div class="admin-toolbar">
      <div>
        <p class="admin-mode">🔓 管理员模式 · 只读</p>
        <p class="admin-mode__hint">显示的是未公开条目，格式与公开帖一致。</p>
      </div>
      <button type="button" class="ui-btn" id="adminLogout">退出管理员模式</button>
    </div>
    <div class="post-list" id="archiveList">
      <p class="empty-state">正在读取档案...</p>
    </div>`;

  root.querySelector('#adminLogout')?.addEventListener('click', () => {
    logout();
    toast('已退出管理员模式', 'success');
    renderGate(root);
  });

  const list = root.querySelector('#archiveList');

  try {
    const dataset = await loadArchive();
    if (!dataset.posts.length) {
      list.innerHTML = emptyStateHtml('档案区目前是空的。以后加入的隐藏条目会出现在这里。');
      return;
    }

    const stats = document.createElement('p');
    stats.className = 'list-stats';
    stats.textContent = `共 ${dataset.posts.length} 条档案 · ${countComments(dataset.posts)} 条评论`;
    list.before(stats);

    list.innerHTML = dataset.posts.map((post) => postItemHtml(post, { archive: true })).join('');
  } catch (error) {
    console.error(error);
    list.innerHTML = emptyStateHtml(`读取档案失败：${error.message}${archiveUrl ? '' : ''}`);
  }
}
