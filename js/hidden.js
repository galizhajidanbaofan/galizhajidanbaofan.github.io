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
import { escapeHtml } from './format.js';
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
    stateKey: 'chat_state',
    defaultReply: '...',
    /* 三类线索共用一张表，命中顺序：违禁词 → 异常 → 这里 */
    autoReplies: {
        '你好': '你好。',
        '你是谁': '我是谁...',
        '这里是什么地方': '这里是我留下的聊天室。',
        '怎么回事': [
            '先说怎么进去的。',
            '恸山在行政区划上不完全属于任何一个县，地图上那一带是空白，只有等高线。我按姜生帖子里写的方位，从镇子往北，坐了两个小时的中巴，又走了半天山路。',
            '我同行的几位同伴先在山脚附近寻找住所，而我先行一步进了寨。姜家寨比我想的小，几十户人家，全姓姜，祠堂在最里面，青石台阶，门槛有半人高。',
            '我到的时候，村里人不赶我走，也不跟我说话。只有一位老太太给我递了碗水，说，你该早点回去了。当时我没在意，那不是客气话。',
            '那天入夜，我一直没等到同伴们的消息，才惊觉信号断了。村里没人点灯，我在祠堂西厢歇脚，听见正厅里有动静，像是有指甲在划玻璃。',
            '我过去看，供桌上多了一面来时没见过的铜镜，镜面朝上，被一块黑布盖着，布的一角翘起来了。',
            '我心里毛毛的，决定把它收起来，于是伸手把布掖回去，又拿祠堂门口那串铁链，绕着镜台缠了三圈。我记得很清楚，缠了三圈，再把镜面向下盖上，放进了最近的一个红漆木柜子里。',
            '然后我听见身后有人说话。回头却看见另一个我。一样的衣服，一样的包，连我父母留给我独一无二的蝴蝶发饰都一模一样。它咧开嘴巴，似乎正要说话，可我却眼前一黑——',
            '再之后我记不清了。醒来时天已经亮了，我在井里，我的包掉在我旁边，全身每一处关节和肌肉都疼的不行。井壁刻满了东西，密密麻麻，全是姜家的女人与她们留下的留言。我数到第七行，最后那个名字正是我的，刻痕崭新。',
            '现在我仍在井底，好在手机没坏掉，还有联系外界求救的机会。我也留了后手：如果我失联超过七十二小时，我在市区的朋友就会替我报警搜寻。',
            '不过我依旧没有信号发短信打电话；最奇怪的一点是，我居然还能登入这个论坛，甚至进入这个聊天室——这不合常理。',
            '我担心这个网站恐怕也有问题，也和另一个我有千丝万缕的联系。所以拜托你了，如果你还是人的话……小心地调查研究这个论坛，可以的话，帮我找出另一个我的线索，我也会与你同步我的发现。'
        ],
        /* ── 一类：背景补充 ── */
        '工作': [
            '工作？算是半个自由职业。',
            '我在市里的民俗文化研究所挂了个研究助理的名头，平时接地方志整理、庙会流程记录、口述史整理这类活。',
            '牌匾是没有的，但我在事务所的官网留了个页面，你可以看看。',
            { text: '（链接已传输）', link: { href: 'office.html', label: '望舒民俗研究室' } }
        ],
        '职业': [
            '做民俗研究的，说白了就是跑田野、记口述、整理地方志。',
            '我在市里的民俗文化研究所挂着研究助理的名头，接的活不固定。',
            { text: '（链接已传输）', link: { href: 'office.html', label: '望舒民俗研究室' } }
        ],
        '恸山': [
            '恸山……你问到点子上了。',
            '它不在任何一张正式地图上。我在县里的地名志里只翻到过一行注记：『恸山，俗呼恸山坳，无定界。』',
            '界都没有，怎么丈量？我是照着姜生帖子里写的方位，自己描了一遍等高线。',
            { text: '（地图已传输）', link: { href: 'map.html', label: '恸山局部图' } }
        ],
        '姜家寨': [
            '几十户人家，全姓姜。没有门牌，屋与屋之间只有踩出来的土路。',
            '祠堂在最里面，青石台阶，门槛有半人高。正厅的梁上挂着一排木牌，字都磨平了，只剩最右边两块还看得清名字。',
            '村里人不赶我走，也不跟我说话。唯一跟我搭话的是位老太太，她递了碗水，说，你该早点回去了。'
        ],
        '井': [
            '井就在祠堂后面，井口不宽，我掉下去的时候肩膀两边都擦到了。',
            '井壁的刻痕不是画，是字。一行一行，像名册，也有零碎的句子。我认得出其中几个是简体，还有几个是刻得很艰难的字，像是手在抖。',
            '我数到第七行，最后那个名字是我的。刻痕崭新，石粉还沾在缝里。'
        ],
        '那东西': [
            '……你问得很小心，我也回答得小心一点。',
            '我是按类归档的：它不是鬼，不是煞，也不是「灵」。档案里给它的类目是「智慧生物」，可它做出来的事又不像活物——它抄。',
            '它仿东西仿得太好，好到你会觉得「本来就是这样」。但你盯着同一处多看几遍，就发现它只会照抄，不会连坐。',
            '所以别在这里打它的名字。它会听见的。'
        ],
        '卖号': '（聊天室里突然洋溢起一股快活的气氛）',
        '送号': '（聊天室里突然洋溢起一股快活的气氛）',
        '女神': '（聊天室里突然洋溢起一股快活的气氛）',
        '再见': '一路顺风',
        '咖喱炸鸡蛋包饭': '真的好想吃...',
        '咖喱蛋包饭': '好想吃...',
        '奇异': '算是对这类超自然现象以及生物的统称',
        '你还好吗': '还活着，能说话，就不算太糟。',
        '救援': '他们会来的。只是山里比地图上要绕。'
    },

    /* ── 二类：异常。命中即登记，第一次会在井壁上多一道刻痕 ── */
    anomalies: [
        {
            id: 'ad',
            pattern: /广告|AAA|道士|代课|代考/,
            replies: [
                '那些「AAA」开头的号，我第一天看着就不对。',
                '它们把名字改成那样，是为了在列表里排到最前面。可它们回帖的时间，集中在凌晨两三点，而且一模一样。'
            ]
        },
        {
            id: 'numbering',
            pattern: /编号|序号|NO\./i,
            replies: [
                '编号会自己跳。',
                '我抄下来过一次：同一篇帖子，上一秒是 011，下一次刷新变成 012，可帖子里的字一个没变。'
            ]
        },
        {
            id: 'censor',
            pattern: /口口|□□|方块|打码|乱码/,
            replies: [
                '你说的那些方块，不是排版问题。',
                '有人把字从句子中间挖走了，挖得很干净，连字节数都补平了。帖子还读得通，只是缺了几处指代。'
            ]
        }
    ],
    anomalyTrace: '井壁上多了一道新的刻痕，比刚才深。',

    /* ── 三类：违禁词。打出来就会被涂黑，三次之后强制失联 ── */
    banned: ['拟物', '仿造', '收容', '仿制品'],
    censorSystemLine: '已自动屏蔽违禁词，请文明用语',
    censorAsks: [
        '你说什么了？',
        '你难道在说█████？'
    ],
    censorWarning: '看来这个网站果然和那东西有联系，我们暂时不要直接聊这个话题了，以免惊觉了它引来麻烦',
    censorChip: '拟物',
    ending: 'ending-lost.html',

    /* 三条异常凑齐之后 ── */
    impostorLines: [
        '等等。',
        '有人用我的账号在发帖。',
        '我在这儿，一句话都没有发。'
    ],
    impostorTrace: '—— 论坛有新帖，署名 🌕 ——',

    openingLines: [
        '有人和我建立了通讯连接？怎么会？',
        '信号一直是断的，连短信都发不出去……你那边是怎么进来的？',
        '算了，先不管这个。能看见我打的字吗？我是江望舒，做民俗研究的。',
        '我人还在恸山，在一口井里。'
    ],
    /* 讲完经过之后才递文件夹 */
    afterOriginStory: ['这儿有个文件夹，我把找到的东西都放里面了。', '📁'],
    /* 固定选项按钮 */
    quickReplies: ['怎么回事', '你是谁', '这里是什么地方', '你还好吗']
};

function chatTime() {
    const now = new Date();
    return String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
}

/**
 * 气泡。content 可以是字符串，也可以是 { text, link:{href,label} }。
 * 玩家的输入也会走这里，所以正文一律转义。
 */
function messageHtml(type, content) {
    const isSelf = type === 'self';
    /* 注意：字符串上也有 String.prototype.link 这个方法，不能直接读 content.link */
    const isObject = content !== null && typeof content === 'object';
    const text = isObject ? content.text : content;
    const link = isObject && content.link
        ? `<a class="msg__link" href="${content.link.href}">${escapeHtml(content.link.label)}</a>`
        : '';
    return `
        <div class="msg ${isSelf ? 'msg--self' : 'msg--other'}">
            <div class="msg__avatar">${isSelf ? '👤' : '🌕'}</div>
            <div class="msg__body">
                <div class="msg__bubble">${escapeHtml(text)}${link ? '<br>' + link : ''}</div>
                <div class="msg__time">${chatTime()}</div>
            </div>
        </div>`;
}

/** 被涂黑的一条：长度按原字数走，读屏只读到"已屏蔽" */
function redactedHtml(text) {
    const width = Math.min(Math.max(text.replace(/\s+/g, '').length, 4), 26);
    return `
        <div class="msg msg--self">
            <div class="msg__avatar">👤</div>
            <div class="msg__body">
                <div class="msg__bubble msg__bubble--redacted" role="text" aria-label="已屏蔽">
                    <span aria-hidden="true">${'█'.repeat(width)}</span>
                </div>
                <div class="msg__time">${chatTime()}</div>
            </div>
        </div>`;
}

function systemHtml(text) {
    return `<div class="msg-system"><span class="msg-system__text">${escapeHtml(text)}</span></div>`;
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

/** 她的一条回复：'📁' 走文件夹气泡，其余（含带链接的对象）走普通气泡 */
const replyHtml = (reply) => (reply === '📁' ? fileMessageHtml() : messageHtml('other', reply));

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

/* ---------- 线索状态（一次会话内有效） ---------- */

const blankState = () => ({ redact: 0, anomalies: [], impostor: false });

function loadChatState() {
    try {
        return Object.assign(blankState(), JSON.parse(sessionStorage.getItem(CHAT.stateKey)) || {});
    } catch (error) {
        return blankState();
    }
}

function saveChatState(state) {
    try {
        sessionStorage.setItem(CHAT.stateKey, JSON.stringify(state));
    } catch (error) {
        /* 隐私模式下存不了，忽略 */
    }
}

const BANNED_RE = new RegExp(CHAT.banned.join('|'));

const anomalyFor = (text) => CHAT.anomalies.find((item) => item.pattern.test(text));

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

    /* 第三次被涂黑之前，她只肯用这层皮来指代那东西：一枚红色的「拟物」 */
    let chipShown = false;
    const revealChip = () => {
        if (chipShown) return;
        chipShown = true;
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'btn btn--quiet btn--danger';
        chip.textContent = CHAT.censorChip;
        chip.addEventListener('click', () => {
            if (!isLoggedIn()) {
                promptLogin('需要账号才能说话');
                return;
            }
            input.value = CHAT.censorChip;
            form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        });
        quickBar.appendChild(chip);
    };

    /* ---------- 开场与历史 ---------- */

    const isFirstVisit = !sessionStorage.getItem(CHAT.firstVisitKey);

    if (isFirstVisit) {
        sessionStorage.setItem(CHAT.firstVisitKey, 'false');
        log.innerHTML = systemHtml('通讯已建立');
        CHAT.openingLines.forEach((line, index) => {
            window.setTimeout(() => {
                append(line === '📁' ? fileMessageHtml() : messageHtml('other', line));
                save();
            }, 1000 + index * 1500);
        });
    } else {
        const saved = sessionStorage.getItem(CHAT.historyKey);
        log.innerHTML = saved || systemHtml('通讯已建立');
        scroll();
    }

    renderLoginState();
    if (loadChatState().redact >= 2) revealChip();
    input.focus();

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!isLoggedIn()) {
            promptLogin('需要账号才能说话');
            return;
        }

        const text = input.value.trim();
        if (!text) return;

        input.value = '';

        const chatState = loadChatState();
        const hitsBanned = BANNED_RE.test(text);
        const anomaly = hitsBanned ? null : anomalyFor(text);

        append(hitsBanned ? redactedHtml(text) : messageHtml('self', text));

        const queue = [];

        if (hitsBanned) {
            /* 三类：违禁词。涂黑自己说的那句，再看她怎么接 */
            chatState.redact += 1;
            saveChatState(chatState);

            if (chatState.redact >= 3) {
                append(systemHtml(CHAT.censorSystemLine));
                save();
                window.setTimeout(() => {
                    window.location.href = CHAT.ending;
                }, 1100);
                return;
            }

            queue.push(systemHtml(CHAT.censorSystemLine));
            queue.push(messageHtml('other', CHAT.censorAsks[chatState.redact - 1]));
            if (chatState.redact === 2) {
                queue.push(messageHtml('other', CHAT.censorWarning));
                window.setTimeout(revealChip, 700 + queue.length * 1500);
            }
        } else if (anomaly) {
            /* 二类：异常。第一次提到才计数，每一条都让井壁多一道刻痕 */
            if (!chatState.anomalies.includes(anomaly.id)) {
                chatState.anomalies.push(anomaly.id);
                queue.push(...anomaly.replies.map((line) => messageHtml('other', line)));
                queue.push(systemHtml(CHAT.anomalyTrace));

                if (chatState.anomalies.length >= 3 && !chatState.impostor) {
                    chatState.impostor = true;
                    queue.push(...CHAT.impostorLines.map((line) => messageHtml('other', line)));
                    queue.push(systemHtml(CHAT.impostorTrace));
                }
                saveChatState(chatState);
            } else {
                queue.push(messageHtml('other', '这条我已经记下了。'));
            }
        } else {
            /* 一类：背景补充 */
            const replies = repliesFor(text);
            if (text.includes('怎么回事')) replies.push(...CHAT.afterOriginStory);
            queue.push(...replies.map(replyHtml));
        }

        save();

        /* 长段（比如"怎么回事"）挤得密一点，短问答留出发消息的节奏 */
        const gap = queue.length > 5 ? 700 : 1500;
        queue.forEach((html, index) => {
            window.setTimeout(() => {
                append(html);
                save();
            }, 700 + index * gap);
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
