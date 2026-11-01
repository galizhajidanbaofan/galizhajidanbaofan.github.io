import { initTheme, toggleTheme } from './theme.js';
import { isAdmin } from './auth.js';
import { escapeHtml } from './format.js';

document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => toggleTheme());
});
initTheme();

/* ── 管理员日志 ──────────────────────────────────────────────
   正文由作者定稿。time 用本地时间字符串，原样展示。 */
const ENTRIES = [
    { no: '001', time: '2026-06-22 06:04:11', tag: 'system', body: '山外的来宾，我是奇闻异事的管理员，也是那东西的管理员' },
    { no: '002', time: '2026-06-22 06:29:49', tag: 'system', body: '除了这段话，你们得到的文件其实也是我特别留下的' },
    { no: '003', time: '2026-09-26 23:46:34', tag: 'audit', body: '加入这场斗争很麻烦吧，很抱歉突然拉了你进来' },
    { no: '004', time: '2026-09-27 01:10:00', tag: 'audit', body: '好吧，因为想要彻底解决这件事情呢，必须要由一个外来者来做' },
    { no: '005', time: '2026-09-28 01:22:00', tag: 'audit', body: '关于具体的方法，我无法直接告诉你' },
    { no: '006', time: '2026-09-29 07:20:00', tag: 'audit', body: '停止深入就此回头之类的，希望你不会这么选择' },
    { no: '007', time: '2026-09-30 05:23:00', tag: 'audit', body: '网站的管理权限很快会交给你。请一定' },
    { no: '008', time: '2026-10-31 21:58:49', tag: 'audit', body: '站在正确的一方，理解第一，理解至上' }
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
        <p class="admin-mode__hint">本日志由站务系统自动记录，供管理员核对。记录只增不改。</p>
        <ol class="logview">${ENTRIES.map(entryHtml).join('')}</ol>
        <div class="row-actions">
            <a class="btn btn--primary" href="duel.html">进入站务操作 →</a>
        </div>`;
}
