import { initTheme, toggleTheme } from './theme.js';
import { isAdmin } from './auth.js';
import { escapeHtml } from './format.js';

document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => toggleTheme());
});
initTheme();

/* ── 日志骨架 ────────────────────────────────────────────────
   条目内容等作者定稿：把 body 换成正文即可，其余字段不用动。
   time 用本地时间字符串，原样展示。 */
const ENTRIES = [
    { no: '001', time: '2026-06-22 06:04:11', tag: 'system', body: '（待补）' },
    { no: '002', time: '2026-06-22 06:29:49', tag: 'system', body: '（待补）' },
    { no: '003', time: '2026-09-26 23:46:34', tag: 'audit', body: '（待补）' },
    { no: '004', time: '2026-09-27 01:20:00', tag: 'audit', body: '（待补）' },
    { no: '005', time: '2026-10-31 21:58:49', tag: 'audit', body: '（待补）' }
];

const root = document.getElementById('logRoot');

function entryHtml(entry) {
    const pending = entry.body === '（待补）';
    return `<li class="logview__row">
        <span class="logview__no">#${entry.no}</span>
        <time class="logview__time">${escapeHtml(entry.time)}</time>
        <div class="logview__main">
            <span class="logview__tag">${escapeHtml(entry.tag)}</span>
            <span class="logview__body${pending ? ' logview__pend' : ''}">${escapeHtml(entry.body)}</span>
        </div>
    </li>`;
}

if (!isAdmin()) {
    root.innerHTML = `
        <p class="detail__kicker">仅限站务</p>
        <h2 class="admin-gate__title">需要先登录</h2>
        <p class="admin-gate__desc">管理员日志只对管理员模式开放。请先在「管理员登录」用账号与密码登录。</p>
        <p class="row-actions"><a class="btn btn--primary" href="admin.html">前往管理员登录</a></p>`;
} else {
    root.innerHTML = `
        <p class="detail__kicker">日志 · 由站务系统自动记录</p>
        <h2 class="detail__title">管理员日志</h2>
        <p class="admin-mode__hint">这些条目不是论坛自己写的。日志的写入者另有其人——它一直在记录，也一直在替论坛补东西。</p>
        <ol class="logview">${ENTRIES.map(entryHtml).join('')}</ol>
        <div class="row-actions">
            <a class="btn btn--primary" href="duel.html">做出决定 →</a>
        </div>`;
}
