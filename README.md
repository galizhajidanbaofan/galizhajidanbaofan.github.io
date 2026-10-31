# 奇闻异事

一个收集"身边怪事"的小论坛，同时是一条用静态页讲出来的怪谈线索：
论坛里的帖子 → 搜索特定关键词 → 隐藏入口 → 聊天记录 → 档案条目。

站点是纯静态的（GitHub Pages），没有后端，所有内容都是 JSON 文件 + 前端渲染。

- 线上地址：<https://galizhajidanbaofan.github.io/>
- 技术栈：HTML + 原生 CSS + 原生 ES modules（无构建、无依赖、无 npm）

## 现在的状态

| 项目 | 状态 |
| --- | --- |
| 浏览帖子 / 评论 | 正常 |
| 搜索（含关键词彩蛋） | 正常 |
| 发帖 / 评论 | **已关闭**，点击会弹出"功能维护中"说明 |
| 管理后台 | 改为**管理员模式**：口令登录后**只读**阅读隐藏档案 |
| 双主题（现代 / 复古） | 正常，选择记在 localStorage |
| 剧情线 | 未写完，后续继续补 |

## 目录结构

```
.
├── index.html            首页：帖子列表、搜索、发帖入口（维护提示）
├── post.html             帖子详情 + 评论区（只读）
├── admin.html            管理员模式 / 档案区
├── 404.html              找不到页面
├── secret.html           隐藏入口 · 一档「轻」：点文件夹 → 输入口令 2000
├── archive.html          伪聊天窗口（江望舒）· 二档「中」
├── dossier.html          档案条目 #7742「拟物」· 三档「重」
├── office.html           江望舒的民俗研究室（官网外壳，从聊天关键词「工作」进入）
├── map.html              恸山局部图（手绘等高线 SVG，从关键词「恸山」进入）
├── ending-lost.html      坏结局 01「失联」（聊天室连说三次违禁词后触发）
├── ui.css                结构层 + 组件（布局、列表行、详情、弹窗、提示条、任务栏）
├── hidden.css            隐藏页的「不该看到」皮肤：三档配色 + 扫描线 / 噪点 / 呼吸
├── style-modern.css      主题：现代（米白纸面 / 编辑部排版）
├── style-retro.css       主题：复古（Win98 桌面 + 窗口 + 任务栏 / 2000 年论坛）
├── favicon.svg
├── .nojekyll             让 Pages 不要跑 Jekyll，并允许发布 _archive/
├── js/
│   ├── main.js           入口：定主题 + 按 body[data-page] 装载页面
│   ├── config.js         站点配置（名称、数据路径、维护文案、管理员凭据）
│   ├── format.js         转义、时间解析与格式化、摘要截断
│   ├── store.js          读取 data/*.json 并归一化
│   ├── search.js         过滤、关键词高亮、彩蛋关键词
│   ├── render.js         帖子 / 详情 / 评论的 HTML 渲染
│   ├── theme.js          双主题切换
│   ├── state.js          玩家进度（localStorage，只存选择不存正文）
│   ├── auth.js           管理员口令校验（纯前端门槛）
│   ├── ui.js             toast + 弹窗（openDialog / openModal）
│   ├── hidden.js         隐藏页：冻结时钟、多出来的任务按钮、编号抖动、口令、聊天与三类线索
│   ├── account.js        开篇谜题的账号门（卖号帖 → 账号 / 密码 → 聊天室）
│   ├── lore.js           彩蛋关键词与触发词
│   └── pages/
│       ├── home.js       首页逻辑
│       ├── post.js       详情页逻辑
│       └── admin.js      管理员模式逻辑
├── data/
│   ├── posts.json        公开帖子（当前 15 篇 / 62 条评论）
│   └── archive.json      隐藏档案（当前为空，留给后续剧情）
├── tools/
│   └── password-hash.html  本地生成 PBKDF2 口令凭据的小工具
├── _archive/             停用的旧文件（script.js、style.css）
└── _data-backup/         迁移前的 JSONBin 原始快照
```

## 聊天室的三类线索

`archive.html` 的输入框是所有剧情分支的入口，命中的顺序是**违禁词 → 异常 → 背景补充**。

| 类 | 触发词（举例） | 结果 |
|---|---|---|
| 一类 · 背景补充 | `工作` / `职业`、`恸山`、`姜家寨`、`井`、`那东西` | 她讲一段设定；`工作` 给 `office.html` 链接，`恸山` 给 `map.html` 链接 |
| 二类 · 异常 | `广告` / `AAA` / `道士`、`编号` / `序号`、`口口` / `方块` / `打码` | 每次新发现，井壁多一道刻痕；集齐三条后假江望舒出现（「有人用我的账号在发帖」） |
| 三类 · 违禁词 | `拟物`、`仿造`、`收容`、`仿制品` | 她说的话被涂黑，系统提示「已自动屏蔽违禁词，请文明用语」；第二次后多出一枚红色「拟物」选项；第三次跳 `ending-lost.html` |

状态存在 `sessionStorage.chat_state`（`{ redact, anomalies, impostor }`），刷新不丢，关掉标签页重来。加/改线索都在 `js/hidden.js` 顶部的 `CHAT` 常量里，不用动逻辑。

## 双主题是怎么做的

只有**一份 HTML**，两套主题只换「变量 + 皮肤」，结构不重复：

- `ui.css` 定布局与组件（`.shell` `.mast` `.feed` `.row` `.detail` `.ui-modal` `.taskbar` …），
  颜色字体全走变量，`body[data-theme]` 不参与样式判断；
- `style-modern.css` / `style-retro.css` 只负责变量与皮肤；
- 复古主题要画「窗口」，靠的是元素上的 `data-window="标题"` 属性：
  `style-retro.css` 用 `[data-window]::before{content:attr(data-window)}` 画标题栏、
  `::after` 画右上角按钮，`style-modern.css` 再用 `content:none` 关掉。
  所以给一个区块加窗口外观 = 加一个属性，不用改结构；
- `.desktop-icons`、`.taskbar` 只在复古主题下 `display:flex`，现代主题里是 `display:none`。

窄屏（≤600px）两套主题都退化成单列：复古隐藏桌面图标、压缩任务栏、列表编号栏让位给标题。

## 隐藏页的三档反差

`secret.html` → `archive.html` → `dossier.html` 越往里越不对劲，靠 `<body data-hidden="light|mid|heavy">` 分档，
`hidden.css` 只覆盖变量与少量皮肤，不改结构：

| 档位 | 页面 | 现代主题 | 复古主题 |
|---|---|---|---|
| 轻 | `secret.html` | 纸色偏黄、锈红强调 | 桌面青绿压暗一档、标题栏转灰 |
| 中 | `archive.html` | 墨黑纸 + 锈红，聊天记录像老终端 | 暗酒红桌面、标题栏酒红、聊天记录白底内凹 |
| 重 | `dossier.html` | 近黑、锈红、噪点最重 | 窗口内部全黑、只剩标题栏还是系统色 |

反差手段只有三类：**配色反转**、**系统症状**、**动效**。

- 系统症状（`js/hidden.js`）：任务栏时钟冻结在 `00:00`；任务栏上多一个没有任何说明的 `?` 按钮；
  档案编号每隔 5–11 秒抖动一下（`jitterNumber`，取数字位的 34% 改成相邻数字，620ms 后恢复）。
  这些症状在常态页面不会出现——`js/main.js` 的时钟每 20 秒刷新一次，`hidden.js` 不启动定时器。
- 动效：扫描线 / 噪点 / 极轻的整块闪烁（`@keyframes hiddenFlicker`），
  全部挂在 `@media (prefers-reduced-motion: reduce)` 之下，系统开了「减少动态效果」就整组关掉。
- 刻意**不加**任何警告文案：不对劲要靠玩家自己看出来，不能靠一行字告诉他们。

## 玩家进度（localStorage）

`js/state.js` 把玩家的选择存在 `localStorage['qiwenyishi_progress']`：

```js
{ version: 1, updatedAt: 1761888000000, choices: { duel: 'save_real' }, flags: {}, visited: [] }
```

- `recordChoice(key, value)` 记一次选择，`getChoice(key)` 读回来，`hasFlag/setFlags` 记剧情标记；
- 只存选择与标记，**不存正文、不存口令**；读写都包了 try/catch，隐私模式下静默失败；
- 目前还没人调用它，留给后续「两个江望舒对峙」的结局判定。

## 本地预览

`js/` 用了 ES modules，直接双击 `index.html` 会被浏览器拦（file:// 不允许 import），
必须起一个静态服务：

```bash
cd galizhajidanbaofan.github.io
python -m http.server 8000
# 浏览器打开 http://127.0.0.1:8000/
```

## 内容怎么维护

### 加一篇公开帖子

编辑 `data/posts.json`，往 `posts` 数组里加一条：

```json
{
  "id": "1790000000000",
  "userId": "usr_abc123",
  "author": "🌕",
  "title": "帖子标题",
  "content": "正文，支持换行（渲染时按原文保留）",
  "time": "2026-10-31T14:30:00+08:00",
  "editTime": null,
  "comments": [
    {
      "id": "1790000000001",
      "floor": 1,
      "author": "路人",
      "content": "评论内容",
      "time": "2026-10-31T15:02:00+08:00"
    }
  ]
}
```

要点：

- `id` 用字符串形式的毫秒时间戳即可，全站唯一。
- 时间统一写带时区的 ISO 8601（`+08:00`），前端按本地时区显示成 `2026/10/31 14:30:00`。
- 列表按发布时间倒序，前端不做排序以外的任何处理。
- `editTime` 有值就在标题后显示「(已编辑)」。

### 加一条隐藏档案

同样的结构写进 `data/archive.json` 的 `posts` 数组。
这类条目只能通过 `post.html?id=...&from=archive` 打开，并且必须先进入管理员模式。

### 改管理员口令

1. 本地打开 `tools/password-hash.html`（或线上同名页面），输入新口令，点「生成凭据」；
2. 把输出的 JSON 粘进 `js/config.js` 的 `admin.credentials`，并删掉旧的 `sha256` 条目。

`credentials` 支持两种类型，可以并存：

```js
credentials: [
  { type: 'pbkdf2', salt: '...', iterations: 150000, hash: '...' }, // 推荐
  { type: 'sha256', hash: '...' }                                    // 旧格式，兼容用
]
```

### 维护开关

发帖 / 评论的弹窗文案在 `js/config.js`：

```js
maintenance: {
  title: '功能维护中',
  message: '本站因维护，已关闭发帖与评论功能。\n\n已有内容仍可正常阅读。',
  confirmText: '知道了'
}
```

想把发帖功能真的打开，需要接一个能写数据的后端（或退回 JSONBin 那类托管），
纯静态站做不到。

## 部署

推送到 `main` 分支即可，GitHub Pages 会自动发布仓库根目录。
不需要构建步骤，也不需要 Actions。

## 已知取舍（重要）

- **管理员模式不是安全边界**。静态站没有服务端，`data/archive.json` 是公开可下载的文件，
  口令只挡页面上的门，不挡直接抓文件。所以隐藏内容适合放"叙事彩蛋"，不适合放真秘密。
- **旧的 JSONBin 数据源已彻底停用**。原 `script.js` 里以明文形式写了一枚 JSONBin Master Key，
  它曾随公开站点暴露，等于全网可读写、甚至清空整份数据。迁移时该文件已归档到
  `_archive/script.js` 并把 key 换成了占位符。**如果那枚 key 还在 JSONBin 后台生效，请务必吊销。**
- `_archive/script.js`、`_archive/style.css` 只是历史留档，页面已不再引用。

## 后续待办

- [ ] 把剧情线写完整（隐藏档案 `data/archive.json` 目前是空壳）
- [ ] 管理员口令换成 PBKDF2（工具已就位，需要你亲自生成）
- [ ] 搜索彩蛋的关键词表仍然写在 `js/lore.js`，跟帖子的 `■□` 遮蔽还没联动
- [ ] 老帖子里的 `■□` 遮蔽字符目前是原样文本，尚未做成可交互的`打码`效果
- [ ] 拟物的"瑕疵"线索还没埋进 UI 元信息（编号、ID、编辑时间、状态行都可做手脚）
