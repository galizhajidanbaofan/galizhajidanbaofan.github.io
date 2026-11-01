import { initTheme, toggleTheme } from './theme.js';
import { isAdmin } from './auth.js';
import { recordChoice } from './state.js';

document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => toggleTheme());
});
initTheme();

const STAGE_KEY = 'chat_duel';
const root = document.getElementById('duelRoot');

function readStage() {
    try {
        return sessionStorage.getItem(STAGE_KEY) || 'main';
    } catch (error) {
        return 'main';
    }
}

function writeStage(stage) {
    try {
        sessionStorage.setItem(STAGE_KEY, stage);
    } catch (error) {
        /* 隐私模式忽略 */
    }
}

function goEnding(key) {
    writeStage('done');
    window.location.href = `ending.html?e=${encodeURIComponent(key)}`;
}

const VIEWS = {
    main: () => `
        <p class="detail__kicker">站务操作 · 不可撤销</p>
        <h2 class="detail__title">请选择处置方式</h2>
        <p class="duel__lead">本次操作将影响站点与全部账号，执行后不可恢复。请选择其中一项。</p>
        <div class="duel__ops">
            <button type="button" class="duel__op" data-act="shutdown">
                <b>关闭全站</b>
                <span>站点立即下线，帖子、账号与日志一并终止，不可恢复。</span>
            </button>
            <button type="button" class="duel__op" data-act="ban">
                <b>封禁账号</b>
                <span>终止指定账号的登录与发言权限，站点继续运行。</span>
            </button>
        </div>`,

    accounts: () => `
        <p class="detail__kicker">站务操作 · 封禁账号</p>
        <h2 class="detail__title">选择封禁账号</h2>
        <p class="duel__lead">下列账号均以「🌕」署名，请核对后选择。封禁范围仅限所选账号，其余内容不受影响。</p>
        <ul class="duel__accounts">
            <li>
                <button type="button" class="duel__acc" data-act="ban-fake">
                    <b>user_r0a4np06</b>
                    <span>发帖 4 篇 · 最近一次 2026-09-27 01:20 · 同日连续发布 3 篇</span>
                </button>
            </li>
            <li>
                <button type="button" class="duel__acc" data-act="ban-real">
                    <b>user_5wkmj0tr</b>
                    <span>发帖 1 篇 · 2026-06-27 22:46</span>
                </button>
            </li>
        </ul>
        <div class="row-actions">
            <button type="button" class="btn btn--primary" data-act="ban-both">同时封禁两个账号</button>
            <button type="button" class="btn btn--quiet" data-act="back">返回上一步</button>
        </div>`,

    afterFake: () => `
        <p class="detail__kicker">操作已完成</p>
        <h2 class="detail__title">user_r0a4np06 已封禁</h2>
        <p class="duel__lead">该账号的登录与发言权限已终止，既有内容保留。请选择后续操作。</p>
        <div class="duel__ops">
            <button type="button" class="duel__op" data-act="close-forum">
                <b>关闭论坛</b>
                <span>终止站点运行，全部内容不再对外提供。</span>
            </button>
            <button type="button" class="duel__op" data-act="quit">
                <b>结束操作</b>
                <span>本次站务操作到此为止，不再执行其他处置。</span>
            </button>
        </div>`
};

const STAGE_OF_VIEW = { main: 'main', accounts: 'accounts', afterFake: 'afterFake' };

function render(viewName) {
    root.innerHTML = VIEWS[viewName]();
}

function handle(act) {
    switch (act) {
        case 'shutdown':
            recordChoice('duel', 'shutdown');
            goEnding('shutdown');
            break;
        case 'ban':
            recordChoice('duel', 'ban');
            writeStage('accounts');
            render('accounts');
            break;
        case 'ban-fake':
            recordChoice('duel', 'ban-fake');
            writeStage('afterFake');
            render('afterFake');
            break;
        case 'ban-real':
            recordChoice('duel', 'ban-real');
            goEnding('innocent');
            break;
        case 'ban-both':
            recordChoice('duel', 'ban-both');
            goEnding('compromise');
            break;
        case 'close-forum':
            recordChoice('duel', 'close-forum');
            goEnding('insight');
            break;
        case 'quit':
            recordChoice('duel', 'quit');
            goEnding('outplayed');
            break;
        case 'back':
            writeStage('main');
            render('main');
            break;
        default:
            break;
    }
}

root.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-act]');
    if (trigger) handle(trigger.dataset.act);
});

if (!isAdmin()) {
    root.innerHTML = `
        <p class="detail__kicker">仅限站务</p>
        <h2 class="admin-gate__title">需要先登录</h2>
        <p class="admin-gate__desc">本站务操作仅对管理员开放。请先在「管理员登录」完成账号与密码验证。</p>
        <p class="row-actions"><a class="btn btn--primary" href="admin.html">前往管理员登录</a></p>`;
} else {
    const stage = readStage();
    if (stage === 'accounts') render('accounts');
    else if (stage === 'afterFake') render('afterFake');
    else if (stage === 'done') {
        root.innerHTML = `
            <p class="detail__kicker">操作已完成</p>
            <h2 class="detail__title">本次站务操作已执行</h2>
            <p class="duel__lead">该处置在同一会话中不可重复执行。如需另行处理，请重新登录后台。</p>
            <p class="row-actions"><a class="btn btn--quiet" href="index.html">回到论坛首页</a></p>`;
    } else render('main');
}
