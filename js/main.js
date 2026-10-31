/**
 * 入口：先定主题，再按 <body data-page="..."> 装载对应页面。
 */
import { initTheme, toggleTheme } from './theme.js';

initTheme();

document.addEventListener('click', (event) => {
  const toggle = event.target.closest('[data-theme-toggle]');
  if (!toggle) return;
  event.preventDefault();
  toggleTheme();
});

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
