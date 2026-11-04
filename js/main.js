/**
 * 入口：先定主题，再按 <body data-page="..."> 装载对应页面。
 */
import { initTheme, toggleTheme } from './theme.js';
import { hasFlag } from './state.js';

initTheme();

document.addEventListener('click', (event) => {
  const toggle = event.target.closest('[data-theme-toggle]');
  if (!toggle) return;
  event.preventDefault();
  toggleTheme();
});

/* 复古主题任务栏的时钟；现代主题下任务栏不可见，但保持数值一致 */
const clock = document.getElementById('clock');
if (clock) {
  const tick = () => {
    const now = new Date();
    clock.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };
  tick();
  setInterval(tick, 20000);
}

const pageModules = {
  home: './pages/home.js',
  post: './pages/post.js',
  admin: './pages/admin.js'
};

const modulePath = pageModules[document.body.dataset.page];

if (modulePath) {
  try {
    const page = await import(modulePath);
    await page.boot();
  } catch (error) {
    console.error('[启动失败]', error);
  }
}

/* 帖子里的可疑 ID 是按钮：点它，回聊天室，让她把这句话从头听一遍。
   但先得过门槛——没进过聊天室、没问过「怎么回事」，点了也不跳（防止缓存里的旧 DOM 绕过渲染层）。 */
document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-probe-id]');
  if (!trigger) return;
  event.preventDefault();
  if (!hasFlag('chat.entered') || !hasFlag('chat.briefed')) return;
  window.location.href = `archive.html?probe=${encodeURIComponent(trigger.dataset.probeId)}`;
});
