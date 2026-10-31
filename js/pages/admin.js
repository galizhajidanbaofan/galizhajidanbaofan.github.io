/**
 * 档案区 → 管理员模式（只读）。
 *
 * 这里没有任何写操作：解锁后只能阅读隐藏条目，不能改、不能删。
 */
import { isAdmin, login, logout } from '../auth.js';
import { countComments, loadArchive } from '../store.js';
import { emptyStateHtml, postListHtml } from '../render.js';
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

/* ---------- 口令门 ---------- */

function renderGate(root) {
  root.innerHTML = `
    <div class="admin-gate">
      <p class="detail__kicker">管理员模式</p>
      <h2 class="admin-gate__title">需要口令</h2>
      <p class="admin-gate__desc">解锁后可阅读未公开的档案条目。管理员模式只读，不提供修改或删除功能。</p>
      <form id="adminForm" autocomplete="off">
        <label class="form-hint" for="adminPassword">管理员口令</label>
        <input class="field" type="password" id="adminPassword" placeholder="请输入口令" required>
        <p class="admin-gate__error" id="adminError" role="alert"></p>
        <button type="submit" class="btn btn--primary">解锁档案区</button>
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

/* ---------- 档案列表 ---------- */

async function renderArchive(root) {
  root.innerHTML = `
    <div class="admin-toolbar">
      <div>
        <p class="admin-mode">管理员模式 · 只读</p>
        <p class="admin-mode__hint">显示的是未公开条目，格式与公开帖一致。</p>
      </div>
      <button type="button" class="btn btn--quiet" id="adminLogout">退出管理员模式</button>
    </div>
    <p class="list-stats" id="archiveStats">正在读取档案…</p>
    <ol class="post-list" id="archiveList"></ol>`;

  root.querySelector('#adminLogout')?.addEventListener('click', () => {
    logout();
    toast('已退出管理员模式', 'success');
    renderGate(root);
  });

  const list = root.querySelector('#archiveList');
  const stats = root.querySelector('#archiveStats');

  try {
    const dataset = await loadArchive();

    if (!dataset.posts.length) {
      if (stats) stats.textContent = '暂无档案';
      list.innerHTML = `<li>${emptyStateHtml('档案区目前是空的。以后加入的隐藏条目会出现在这里。')}</li>`;
      return;
    }

    if (stats) {
      stats.textContent = `共 ${dataset.posts.length} 条档案 · ${countComments(dataset.posts)} 条评论 · 只读`;
    }
    list.innerHTML = postListHtml(dataset.posts, { archive: true });
  } catch (error) {
    console.error(error);
    if (stats) stats.textContent = '读取失败';
    list.innerHTML = `<li>${emptyStateHtml(`读取档案失败：${error.message}`)}</li>`;
  }
}
