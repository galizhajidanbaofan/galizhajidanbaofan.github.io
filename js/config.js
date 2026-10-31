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
    // 支持两种口令写法：
    //   { type: 'sha256', hash: '<64 位十六进制>' }
    //   { type: 'pbkdf2', iterations: 210000, salt: '<hex>', hash: '<hex>' }
    // 用 tools/password-hash.html 生成 pbkdf2 条目，替换下面这条即可。
    credentials: [
      { type: 'sha256', hash: '97a3142172e58c70ea51faf6fa5f26eff18c90bbea88c9b4c5354afffd048f64' }
    ]
  }
};
