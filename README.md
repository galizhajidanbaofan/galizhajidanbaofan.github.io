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
├── secret.html           隐藏入口（点文件夹 → 输入口令 2000）
├── archive.html          伪聊天窗口（江望舒）
├── dossier.html          档案条目 #7742「拟物」
├── ui.css                通用组件层（弹窗、提示条、档案区、只读正文）
├── style-modern.css      主题：现代（浅色卡片）
├── style-retro.css       主题：复古（2000 年论坛皮肤 / Win98）
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
│   ├── auth.js           管理员口令校验（纯前端门槛）
│   ├── ui.js             toast + 弹窗
│   ├── lore.js           彩蛋关键词与触发词
│   └── pages/
│       ├── home.js       首页逻辑
│       ├── post.js       详情页逻辑
│       └── admin.js      管理员模式逻辑
├── data/
│   ├── posts.json        公开帖子（当前 13 篇 / 56 条评论）
│   └── archive.json      隐藏档案（当前为空，留给后续剧情）
├── tools/
│   └── password-hash.html  本地生成 PBKDF2 口令凭据的小工具
├── _archive/             停用的旧文件（script.js、style.css）
└── _data-backup/         迁移前的 JSONBin 原始快照
```

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
- [ ] 搜索彩蛋里「帮助」那条文案还写着"输入昵称后即可发帖评论"，与已关闭发帖不一致
- [ ] 老帖子里的 `■□` 遮蔽字符目前是原样文本，尚未做成可交互的`打码`效果
