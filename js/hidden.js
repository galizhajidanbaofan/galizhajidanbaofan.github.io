/* ============================================================
   隐藏页逻辑：secret / archive / dossier
   ------------------------------------------------------------
   与常态页共用主题变量与窗口结构，这里只做四件事：
   1. 主题初始化 + 主题按钮；
   2. "系统症状"：任务栏时钟冻结在 00:00、多出一个无名任务按钮、
      档案编号偶尔跳一位（拟物仿得不完美的破绽）；
   3. 各页自己的玩法（口令、聊天、档案）；
   4. 聊天室的账号门：没登录的人打字会被告知"请先登录"。
   ============================================================ */

import { initTheme, toggleTheme } from './theme.js';
import { toast } from './ui.js';
import { getAccount, isLoggedIn, logout, openLoginDialog } from './account.js';

const KIND = document.body.dataset.hiddenKind;

/* ---------- 系统症状 ---------- */

/** 时钟冻在 00:00，不再走动（常态页由 main.js 每 20 秒刷新） */
function freezeClock() {
    const clock = document.getElementById('clock');
    if (clock) clock.textContent = '00:00';
}

/** 任务栏上多出一个不该存在的任务按钮 */
function addPhantomTask() {
    const anchor = document.querySelector('.taskbar .tray') || document.querySelector('.taskbar .clock');
    if (!anchor) return;
    const task = document.createElement('span');
    task.className = 'task task--phantom';
    task.textContent = '?';
    anchor.before(task);
}

/** 编号偶尔跳一位，半秒后自己恢复 */
function jitterNumber(el, options = {}) {
    if (!el) return;
    const original = el.textContent;
    const digits = original.replace(/\\D/g, '') || '0000';
    const { min = 5000, max = 11000 } = options;

    const tick = () => {
        el.textContent = original.replace(digits, () => {
            const n = digits
                .split('')
                .map((d, i) => (Math.random() < 0.34 ? String((Number(d) + 1 + i) % 10) : d))
                .join('');
            return n;
        });
        window.setTimeout(() => {
            el.textContent = original;
            window.setTimeout(tick, min + Math.random() * (max - min));
        }, 620);
    };

    window.setTimeout(tick, min + Math.random() * (max - min));
}

/* ---------- secret：口令入口 ---------- */

function bindSecret() {
    const icon = document.getElementById('folderIcon');
    if (!icon) return;

    icon.addEventListener('click', () => {
        const password = window.prompt('请输入密码：');
        if (password === '2000') {
            window.location.href = 'archive.html';
        } else if (password !== null) {
            window.alert('✕ 密码错误');
        }
    });
}

/* ---------- chat：与江望舒的对话 ---------- */

const CHAT = {
    historyKey: 'chat_history',
    firstVisitKey: 'chat_first_visit',
    defaultReply: '...',
    autoReplies: {
        '你好': '你好。',
        '你是谁': '我是谁...',
        '这里是什么地方': '这里是我留下的聊天室。',
        '怎么回事': [
            '先说怎么进去的。',
            '恸山在行政区划上不属于任何一个县，地图上那一带是空白，只有等高线。我按姜生帖子里写的方位，从镇子往北，坐了两个小时的中巴，又走了半天山路。姜家寨比我想的小，几十户人家，全姓姜，祠堂在最里面，青石台阶，门槛有半人高。',
            '我到的时候，村里人不赶我走，也不跟我说话。只有一位老太太给我递了碗水，说，你不该来。后来我才明白，那不是客气话。',
            '那天入夜，村里没人点灯。我在祠堂西厢抄碑文，抄到一半，听见正厅里有动静，像是有指甲在擦玻璃。',
            '我过去看，供桌上摆着一面铜镜，镜面朝上，被一块黑布盖着，布的一角翘起来了。我伸手把布掖回去，又拿祠堂门口那串铁链，绕着镜台缠了三圈。我记得很清楚，盖上了，缠了三圈。',
            '然后我听见身后有人说话。回头，看见一个我。一样的衣服，一样的包，连我右手虎口上那道旧疤都在。它说，你怎么还在这儿。——那句话本来该是我问它的。',
            '再之后我记不清了。醒来时天已经亮了，我在井里，井壁刻满名字，密密麻麻，全是姜家的女人。我数到第七行，最后那个名字是我的，墨还新着。',
            '完整的我不在这儿。你现在跟我说话的，是我借这个论坛留下来的一点东西——2000 年那个旧论坛的壳子还能通电，信号很弱，一次只能说几句。',
            '所以你得帮我弄清楚一件事：那天站在祠堂门口的那个，后来去了哪里。'
        ],
        '卖号': '（聊天室里突然洋溢起一股快活的气氛）',
        '送号': '（聊天室里突然洋溢起一股快活的气氛）',
        '女神': '（聊天室里突然洋溢起一股快活的气氛）',
        '再见': '一路顺风',
        '咖喱炸鸡蛋包饭': '真的好想吃...',
        '咖喱蛋包饭': '好想吃...',
        '奇异': '算是对这类超自然现象以及生物的统称',
        '拟物': [
            '很危险棘手的奇异',
            '你读了资料应该明白，我想恐怕它就是造成姜家惨案的元凶'
        ],
        '你还好吗': '还活着，能说话，就不算太糟。',
        '救援': '他们会来的。只是山里比地图上要绕。'
    },
    openingLines: [
        '你终于来了...',
        '这里是我留下的聊天室',
        '我是江望舒，那个民俗学家',
        '看看这个文件夹，我把发现的资料都放在里面了',
        '📁',
        '如果你没有头绪，先输入"怎么回事"吧'
    ],
    /* 固定选项按钮（暂定，等作者定稿后再增删） */
    quickReplies: ['怎么回事', '你是谁', '这里是什么地方', '你还好吗']
};

function chatTime() {
    const now = new Date();
    return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
}

function messageHtml(type, text) {
    const isSelf = type === 'self';
    return `
        <div class="msg ${isSelf ? 'msg--self' : 'msg--other'}">
            <div class="msg__avatar">${isSelf ? '👤' : '🌕'}</div>
            <div class="msg__body">
                <div class="msg__bubble">${text}</div>
                <div class="msg__time">${chatTime()}</div>
            </div>
        </div>`;
}

function systemHtml(text) {
    return `<div class="msg-system">——— ${text} ———</div>`;
}

function fileMessageHtml() {
    return `
        <div class="msg msg--other">
            <div class="msg__avatar">🌕</div>
            <div class="msg__body">
                <a class="msg__bubble msg__bubble--file" href="dossier.html" title="点击查看档案">📁</a>
                <div class="msg__time">${chatTime()}</div>
            </div>
        </div>`;
}

const toList = (value) => (Array.isArray(value) ? value : [value]);

/**
 * 关键词命中：完全匹配 → 前缀 → 包含 → 兜底。
 * 关键词一多，旧的"谁先出现在表里就用谁"会互相抢，这里按匹配精度排序。
 */
function repliesFor(text) {
    const said = text.trim();
    const entries = Object.entries(CHAT.autoReplies);
    const exact = entries.find(([keyword]) => keyword === said);
    if (exact) return toList(exact[1]);
    const prefix = entries.find(([keyword]) => said.startsWith(keyword));
    if (prefix) return toList(prefix[1]);
    const partial = entries.find(([keyword]) => said.includes(keyword));
    if (partial) return toList(partial[1]);
    return [CHAT.defaultReply];
}

function bindChat() {
    const log = document.getElementById('chatMessages');
    const form = document.getElementById('chatForm');
    const input = document.getElementById('chatInput');
    const loginButton = document.getElementById('loginBtn');
    if (!log || !form || !input) return;

    const save = () => sessionStorage.setItem(CHAT.historyKey, log.innerHTML);
    const scroll = () => { log.scrollTop = log.scrollHeight; };

    const append = (html) => {
        log.insertAdjacentHTML('beforeend', html);
        scroll();
    };

    /* ---------- 账号门 ---------- */

    let lastPromptAt = 0;

    const renderLoginState = () => {
        const account = getAccount();
        if (loginButton) {
            loginButton.textContent = account ? '退出' : '登录';
            loginButton.title = account ? `当前账号：${account.id}` : '登录后才能说话';
        }
        input.placeholder = account ? '输入消息...' : '请先登录';
        input.classList.toggle('is-locked', !account);
    };

    const afterLogin = (account) => {
        renderLoginState();
        append(systemHtml(`已登录：${account.id}`));
        save();
        toast('登录成功，可以说话了。', 'success');
        input.focus();
    };

    const promptLogin = (reason) => {
        const now = Date.now();
        if (now - lastPromptAt < 1500) return;
        lastPromptAt = now;
        openLoginDialog({ reason, onSuccess: afterLogin });
    };

    loginButton?.addEventListener('click', () => {
        if (isLoggedIn()) {
            logout();
            renderLoginState();
            append(systemHtml('已退出账号'));
            save();
            toast('已退出。');
            return;
        }
        promptLogin('登录后才能说话');
    });

    input.addEventListener('input', () => {
        if (isLoggedIn()) return;
        input.value = '';
        promptLogin('需要账号才能说话');
    });

    /* ---------- 固定选项按钮 ---------- */

    const quickBar = document.createElement('div');
    quickBar.className = 'chat__quick';
    CHAT.quickReplies.forEach((label) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn--quiet';
        button.textContent = label;
        button.addEventListener('click', () => {
            if (!isLoggedIn()) {
                promptLogin('需要账号才能说话');
                return;
            }
            input.value = label;
            form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        });
        quickBar.appendChild(button);
    });
    form.before(quickBar);

    /* ---------- 开场与历史 ---------- */

    const isFirstVisit = !sessionStorage.getItem(CHAT.firstVisitKey);

    if (isFirstVisit) {
        sessionStorage.setItem(CHAT.firstVisitKey, 'false');
        log.innerHTML = '<div class="msg-system">——— 通讯已建立 ———</div>';
        CHAT.openingLines.forEach((line, index) => {
            window.setTimeout(() => {
                append(line === '📁' ? fileMessageHtml() : messageHtml('other', line));
                save();
            }, 1000 + index * 1500);
        });
    } else {
        const saved = sessionStorage.getItem(CHAT.historyKey);
        log.innerHTML = saved || '<div class="msg-system">——— 通讯已建立 ———</div>';
        scroll();
    }

    renderLoginState();
    input.focus();

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!isLoggedIn()) {
            promptLogin('需要账号才能说话');
            return;
        }

        const text = input.value.trim();
        if (!text) return;

        append(messageHtml('self', text));
        input.value = '';
        save();

        repliesFor(text).forEach((reply, index) => {
            window.setTimeout(() => {
                append(messageHtml('other', reply));
                save();
            }, 800 + index * 1500);
        });
    });
}

/* ---------- 启动 ---------- */

initTheme();
freezeClock();
addPhantomTask();

const themeButton = document.querySelector('[data-theme-toggle]');
if (themeButton) themeButton.addEventListener('click', toggleTheme);

if (KIND === 'secret') bindSecret();
if (KIND === 'chat') bindChat();
if (KIND === 'dossier') jitterNumber(document.getElementById('dossierNo'));
