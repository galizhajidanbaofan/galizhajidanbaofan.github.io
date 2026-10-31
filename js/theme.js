/**
 * 双主题切换：modern（浅色卡片）/ retro（2000 年论坛皮肤）。
 * 通过启用/禁用两个 <link> 实现，页面里必须存在 #css-modern 与 #css-retro。
 */

const STORAGE_KEY = 'forum_theme';
export const THEMES = ['modern', 'retro'];

export function currentTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  return THEMES.includes(saved) ? saved : 'modern';
}

export function applyTheme(theme) {
  const isRetro = theme === 'retro';
  const modern = document.getElementById('css-modern');
  const retro = document.getElementById('css-retro');

  if (modern) modern.disabled = isRetro;
  if (retro) retro.disabled = !isRetro;

  document.body.dataset.theme = isRetro ? 'retro' : 'modern';

  document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    const label = button.querySelector('[data-theme-label]');
    if (label) label.textContent = isRetro ? '风格·复古' : '风格·现代';
    button.setAttribute('title', `切换风格（当前：${isRetro ? '复古' : '现代'}）`);
  });
}

export function setTheme(theme) {
  const next = THEMES.includes(theme) ? theme : 'modern';
  localStorage.setItem(STORAGE_KEY, next);
  applyTheme(next);
}

export function toggleTheme() {
  setTheme(currentTheme() === 'retro' ? 'modern' : 'retro');
}

export function initTheme() {
  applyTheme(currentTheme());
}
