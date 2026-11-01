/**
 * 站点配置。所有「可能需要改的东西」都集中在这里。
 */
export const CONFIG = {
  siteName: '奇闻异事',

  data: {
    // 公开帖子
    posts: 'data/posts.json',
    // 隐藏帖子（管理员模式可读），文件格式与 posts.json 相同
    archive: 'data/archive.json',
    // 异常帖：聊天室里每发现一条异常就多出几条（tier 见文件内注释）
    glitch: 'data/posts-glitch.json',
    // 假江望舒的帖子：聊天室出现「有人用我的账号在发帖」之后才可见
    late: 'data/posts-late.json'
  },

  clues: {
    // 这几个 ID 在帖子列表与详情页里会加粗、可点；点了回聊天室把它念给她听
    suspectUids: ['user_r0a4np06', 'user_tmdiygzf', 'user_duynljbi']
  },

  list: {
    // 首页每次显示多少条，多余的点「加载更多」
    pageSize: 10
  },

  maintenance: {
    title: '功能维护中',
    message: '本站因维护，已关闭发帖与评论功能。\n\n已有内容仍可正常阅读。',
    confirmText: '知道了'
  },

  admin: {
    // 管理令牌有效期（天）
    sessionDays: 7,
    // 管理员账号（明文比对；口令只存哈希）
    // 取档案 #7742 的编号：user_7742
    account: 'user_7742',
    // 支持两种口令写法：
    //   { type: 'sha256', hash: '<64 位十六进制>' }
    //   { type: 'pbkdf2', iterations: 210000, salt: '<hex>', hash: '<hex>' }
    // 用 tools/password-hash.html 生成 pbkdf2 条目，替换下面这条即可。
    // 当前口令即玩家在站内反复遇到的那个年份。
    credentials: [
      { type: 'sha256', hash: '81a83544cf93c245178cbc1620030f1123f435af867c79d87135983c52ab39d9' }
    ]
  }
};
