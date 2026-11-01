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
        <p class="detail__kicker">管理员权限 · 最后一步</p>
        <h2 class="detail__title">你打算怎么收尾</h2>
        <p class="duel__lead">日志读到这里，往下只有两条路。定了就不能回头。</p>
        <div class="duel__ops">
            <button type="button" class="duel__op" data-act="shutdown">
                <b>关闭全站</b>
                <span>论坛立刻下线。帖子、账号、日志，一并消失。</span>
            </button>
            <button type="button" class="duel__op" data-act="ban">
                <b>封停账号</b>
                <span>先把号封了，站暂时留着。</span>
            </button>
        </div>`,

    accounts: () => `
        <p class="detail__kicker">封停账号 · 选择对象</p>
        <h2 class="detail__title">封哪一个</h2>
        <p class="duel__lead">这两个账号都署着「🌕」。封错了，那个人就再也回不来了。</p>
        <ul class="duel__accounts">
            <li>
                <button type="button" class="duel__acc" data-act="ban-fake">
                    <b>user_r0a4np06</b>
                    <span>发帖 4 篇 · 最近一次 2026-09-27 01:20 · 三帖连发</span>
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
            <button type="button" class="btn btn--primary" data-act="ban-both">两个都封</button>
            <button type="button" class="btn btn--quiet" data-act="back">← 返回</button>
        </div>`,

    afterFake: () => `
        <p class="detail__kicker">已封停</p>
        <h2 class="detail__title">user_r0a4np06 已封停</h2>
        <p class="duel__lead">那个账号的页面空了。帖子还挂着，只是再也发不出新的。接下来呢？</p>
        <div class="duel__ops">
            <button type="button" class="duel__op" data-act="close-forum">
                <b>关闭论坛</b>
                <span>把它连同这整套东西一起关掉。</span>
            </button>
            <button type="button" class="duel__op" data-act="quit">
                <b>退出</b>
                <span>号已经封了，剩下的不动了。</span>
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
        <p class="admin-gate__desc">这一步只有管理员能做。请先在「管理员登录」用账号与密码登录。</p>
        <p class="row-actions"><a class="btn btn--primary" href="admin.html">前往管理员登录</a></p>`;
} else {
    const stage = readStage();
    if (stage === 'accounts') render('accounts');
    else if (stage === 'afterFake') render('afterFake');
    else if (stage === 'done') {
        root.innerHTML = `
            <p class="detail__kicker">这一步已经做完</p>
            <h2 class="detail__title">没有第二次决定</h2>
            <p class="duel__lead">你已经在前面做完了选择。存档里留着那条记录。</p>
            <p class="row-actions"><a class="btn btn--quiet" href="index.html">回到论坛首页</a></p>`;
    } else render('main');
}
