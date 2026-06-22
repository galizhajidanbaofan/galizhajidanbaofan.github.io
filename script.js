// ========== JSONBin配置 ==========
const BIN_ID = '6a38d65df5f4af5e291b4d68';
const API_KEY = '$2a$10$fSsQwf2TxKlfWU/zTta.l.0qsHSpmQ9G08HixJjMQvT0xzlqcM/g.';
const ADMIN_PASSWORD_HASH = '97a3142172e58c70ea51faf6fa5f26eff18c90bbea88c9b4c5354afffd048f64';

let posts = [];
let lastPostTime = 0;
let offlineMode = false;

// ========== 安全管理员认证（闭包保护）==========
const AdminAuth = (function() {
    let _adminToken = null;
    
    function generateToken() {
        return 'tok_' + Math.random().toString(36).substring(2, 8) + 
               Date.now().toString(36) + 
               Math.random().toString(36).substring(2, 8);
    }
    
    function getCookie(name) {
        const cookies = document.cookie.split(';');
        for (let c of cookies) {
            const [key, val] = c.trim().split('=');
            if (key === name) return val;
        }
        return null;
    }
    
    return {
        async verify(password) {
            if (!password) return false;
            const hashedInput = await sha256(password);
            if (hashedInput === ADMIN_PASSWORD_HASH) {
                _adminToken = generateToken();
                sessionStorage.setItem('admin_token', _adminToken);
                const expires = new Date();
                expires.setDate(expires.getDate() + 7);
                document.cookie = `admin_token=${_adminToken}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
                return true;
            }
            return false;
        },
        
        isAuthenticated() {
            if (!_adminToken) return false;
            const sessionToken = sessionStorage.getItem('admin_token');
            const cookieToken = getCookie('admin_token');
            if (sessionToken === _adminToken && cookieToken === _adminToken) {
                return true;
            }
            // 验证失败，清除
            _adminToken = null;
            sessionStorage.removeItem('admin_token');
            document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            return false;
        },
        
        logout() {
            _adminToken = null;
            sessionStorage.removeItem('admin_token');
            document.cookie = 'admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
    };
})();

// SHA-256哈希
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 用户ID生成
function generateUserId() {
    let userId = localStorage.getItem('forum_user_id');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('forum_user_id', userId);
    }
    return userId;
}

function getNickname(inputNickname) {
    if (inputNickname && inputNickname.trim()) {
        return inputNickname.trim();
    }
    let savedNickname = localStorage.getItem('forum_nickname');
    if (savedNickname) return savedNickname;
    return '匿名用户' + generateUserId().substring(5, 10);
}

function saveNickname(nickname) {
    if (nickname && nickname.trim() && nickname !== '匿名用户') {
        localStorage.setItem('forum_nickname', nickname.trim());
    }
}

// ========== 主题切换 ==========
(function initTheme() {
    const savedTheme = localStorage.getItem('forum_theme') || 'modern';
    setTheme(savedTheme);
})();

function toggleTheme() {
    const currentTheme = localStorage.getItem('forum_theme') || 'modern';
    const newTheme = currentTheme === 'modern' ? 'retro' : 'modern';
    setTheme(newTheme);
    localStorage.setItem('forum_theme', newTheme);
}

function setTheme(theme) {
    const modernCss = document.getElementById('css-modern');
    const retroCss = document.getElementById('css-retro');
    
    if (theme === 'retro') {
        modernCss.disabled = true;
        retroCss.disabled = false;
    } else {
        retroCss.disabled = true;
        modernCss.disabled = false;
    }
    
    const label = document.getElementById('themeLabel');
    if (label) {
        label.textContent = '风格';
    }
}

// ========== 核心功能 ==========

async function testConnection() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            method: 'GET',
            headers: { 'X-Master-Key': API_KEY }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}

async function loadPosts() {
    console.log('📥 正在加载帖子...');
    
    const isConnected = await testConnection();
    
    if (!isConnected) {
        console.warn('⚠️ JSONBin连接失败，使用离线模式');
        offlineMode = true;
        const cached = localStorage.getItem('forum_posts_backup');
        posts = cached ? JSON.parse(cached) : [];
        renderCurrentPage();
        return;
    }
    
    offlineMode = false;
    
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { 'X-Master-Key': API_KEY }
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        posts = data.record.posts || [];
        localStorage.setItem('forum_posts_backup', JSON.stringify(posts));
        console.log('✅ 加载成功！帖子数:', posts.length);
        
    } catch (error) {
        console.error('加载失败:', error);
        const cached = localStorage.getItem('forum_posts_backup');
        posts = cached ? JSON.parse(cached) : [];
    }
    
    renderCurrentPage();
}

async function savePosts() {
    localStorage.setItem('forum_posts_backup', JSON.stringify(posts));
    if (offlineMode) return false;
    
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify({ posts })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        console.log('✅ 保存成功');
        return true;
        
    } catch (error) {
        console.error('保存失败:', error);
        showMessage('服务器保存失败，已保存到本地', 'warning');
        return false;
    }
}

// 添加帖子
async function addPost() {
    const captchaInput = document.getElementById('captcha');
    if (captchaInput) {
        const userAnswer = parseInt(captchaInput.value);
        const correctAnswer = parseInt(captchaInput.dataset.answer);
        if (isNaN(userAnswer) || userAnswer !== correctAnswer) {
            alert('验证码错误');
            refreshCaptcha();
            return;
        }
    }
    
    const now = Date.now();
    if (now - lastPostTime < 30000) {
        alert('请等待30秒后再发帖');
        return;
    }
    lastPostTime = now;
    
    const nicknameInput = document.getElementById('nickname');
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    
    const nickname = nicknameInput ? nicknameInput.value.trim() : '';
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!title || !content) {
        alert('请填写标题和内容');
        return;
    }
    
    if (title.length > 100 || content.length > 5000) {
        alert('内容过长');
        return;
    }
    
    saveNickname(nickname);
    
    const post = {
        id: Date.now(),
        userId: generateUserId(),
        author: getNickname(nickname),
        title: escapeHtml(title),
        content: escapeHtml(content),
        time: new Date().toLocaleString('zh-CN'),
        editTime: null,
        comments: []
    };
    
    posts.unshift(post);
    
    const saved = await savePosts();
    
    titleInput.value = '';
    contentInput.value = '';
    if (nicknameInput) nicknameInput.value = '';
    if (captchaInput) refreshCaptcha();
    
    if (saved) {
        alert('✅ 发布成功！');
    } else {
        alert('⚠️ 已保存到本地（离线模式）');
    }
    
    await loadPosts();
}

// 添加评论
async function addComment() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = parseInt(urlParams.get('id'));
    
    const post = posts.find(p => p.id === postId);
    if (!post) {
        alert('帖子不存在');
        return;
    }
    
    const nicknameInput = document.getElementById('commentNickname');
    const contentInput = document.getElementById('commentContent');
    
    const nickname = nicknameInput ? nicknameInput.value.trim() : '';
    const content = contentInput.value.trim();
    
    if (!content) {
        alert('请输入评论内容');
        return;
    }
    
    if (content.length > 1000) {
        alert('评论不能超过1000字');
        return;
    }
    
    saveNickname(nickname);
    
    const comment = {
        id: Date.now(),
        userId: generateUserId(),
        author: getNickname(nickname),
        content: escapeHtml(content),
        time: new Date().toLocaleString('zh-CN')
    };
    
    if (!post.comments) {
        post.comments = [];
    }
    
    post.comments.push(comment);
    
    const saved = await savePosts();
    
    if (nicknameInput) nicknameInput.value = '';
    contentInput.value = '';
    
    if (saved) {
        await loadPosts();
        renderPostDetail();
        showMessage('✅ 评论发表成功', 'success');
    } else {
        showMessage('⚠️ 评论已保存到本地', 'warning');
        renderPostDetail();
    }
}

// 删除评论
async function deleteComment(postId, commentId) {
    if (!await verifyAdmin()) return;
    if (!confirm('确定要删除这条评论吗？')) return;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    post.comments = post.comments.filter(c => c.id !== commentId);
    
    await savePosts();
    await loadPosts();
    renderPostDetail();
    showMessage('评论已删除', 'success');
}

// 删除帖子
async function deletePost(id) {
    if (!await verifyAdmin()) return;
    if (!confirm('确定要删除这个帖子吗？')) return;
    
    posts = posts.filter(p => p.id !== id);
    await savePosts();
    await loadPosts();
    renderAdminList();
    alert('删除成功');
}

// 修改帖子
async function editPost(id) {
    if (!await verifyAdmin()) return;
    
    const post = posts.find(p => p.id === id);
    if (!post) {
        alert('帖子不存在');
        return;
    }
    
    const newTitle = prompt('新标题：', post.title);
    if (newTitle === null) return;
    
    const newContent = prompt('新内容：', post.content);
    if (newContent === null) return;
    
    if (!newTitle.trim() || !newContent.trim()) {
        alert('标题和内容不能为空');
        return;
    }
    
    post.title = escapeHtml(newTitle.trim());
    post.content = escapeHtml(newContent.trim());
    post.editTime = new Date().toLocaleString('zh-CN');
    
    await savePosts();
    await loadPosts();
    renderAdminList();
    alert('修改成功');
}

// ========== 管理员验证（安全版）==========

async function verifyAdmin() {
    // 先检查安全认证
    if (AdminAuth.isAuthenticated()) {
        return true;
    }
    
    const password = prompt('请输入管理员密码：');
    if (!password) return false;
    
    const success = await AdminAuth.verify(password);
    
    if (success) {
        showMessage('✅ 验证成功（7天免登录）', 'success');
        return true;
    }
    
    showMessage('❌ 密码错误', 'error');
    return false;
}

function generateCaptcha() {
    const questionSpan = document.getElementById('captcha-question');
    const captchaInput = document.getElementById('captcha');
    if (!questionSpan || !captchaInput) return;
    
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    
    questionSpan.textContent = `${num1} + ${num2} = ?`;
    captchaInput.dataset.answer = num1 + num2;
    captchaInput.value = '';
}

function refreshCaptcha() {
    generateCaptcha();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function logoutAdmin() {
    AdminAuth.logout();
    alert('已退出管理');
    renderAdminList();
}

function showMessage(msg, type) {
    const div = document.createElement('div');
    div.style.cssText = `
        position:fixed;top:20px;left:50%;transform:translateX(-50%);
        padding:12px 24px;border-radius:6px;color:white;z-index:9999;
        background:${type==='success'?'#28a745':type==='error'?'#dc3545':type==='warning'?'#ffc107':'#17a2b8'};
    `;
    if (type === 'warning') div.style.color = '#333';
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// ========== 渲染函数 ==========

function renderCurrentPage() {
    if (document.getElementById('postList')) {
        renderPostList();
    } else if (document.getElementById('postDetail')) {
        renderPostDetail();
    } else if (document.getElementById('adminList')) {
        renderAdminList();
    }
}

function renderPostList() {
    const postList = document.getElementById('postList');
    if (!postList) return;
    
    const statusText = offlineMode ? '⚠️ 离线模式 - 数据仅保存在本地' : '';
    
    if (posts.length === 0) {
        postList.innerHTML = `
            <p style="text-align:center;padding:40px;color:#999;">📝 暂无帖子</p>
            ${statusText ? `<p style="text-align:center;color:orange;">${statusText}</p>` : ''}
        `;
        return;
    }
    
    postList.innerHTML = `
        ${statusText ? `<p style="text-align:center;color:orange;margin-bottom:15px;">${statusText}</p>` : ''}
        ${posts.map(post => `
            <div class="post-item">
                <h3>
                    <a href="post.html?id=${post.id}">${post.title}</a>
                    ${post.editTime ? '<span style="font-size:12px;color:#999;">(已编辑)</span>' : ''}
                </h3>
                <div class="meta">
                    <span class="post-author">👤 ${post.author || '匿名'}</span>
                    📅 ${post.editTime || post.time}
                    <span class="comment-count">💬 ${post.comments ? post.comments.length : 0}</span>
                </div>
                <div class="content">${post.content.substring(0, 150)}...</div>
            </div>
        `).join('')}
    `;
}

function renderPostDetail() {
    const detail = document.getElementById('postDetail');
    if (!detail) return;
    
    const id = parseInt(new URLSearchParams(window.location.search).get('id'));
    const post = posts.find(p => p.id === id);
    
    if (!post) {
        detail.innerHTML = '<p style="text-align:center;padding:40px;">帖子不存在</p>';
        const commentsSection = document.getElementById('commentsSection');
        if (commentsSection) commentsSection.style.display = 'none';
        return;
    }
    
    detail.innerHTML = `
        <div class="detail-header">
            <h2>${post.title}</h2>
            <div class="meta">
                <span class="post-author">👤 ${post.author || '匿名'}</span>
                <span style="font-size:11px;color:#999;">ID: ${post.userId || '未知'}</span>
                ${post.editTime ? ` | ✏️ 编辑于 ${post.editTime}` : ''}
                <br>📅 发布于 ${post.time}
                <span class="comment-count">💬 ${post.comments ? post.comments.length : 0} 条评论</span>
            </div>
            <div style="margin-top:20px;white-space:pre-wrap;">${post.content}</div>
            <div style="margin-top:20px;">
                <a href="index.html">← 返回首页</a>
            </div>
        </div>
    `;
    
    const commentsSection = document.getElementById('commentsSection');
    if (commentsSection) {
        commentsSection.style.display = 'block';
    }
    
    renderComments(post);
}

function renderComments(post) {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;
    
    if (!post.comments || post.comments.length === 0) {
        commentsList.innerHTML = '<div class="no-comments">💬 暂无评论，来说两句吧</div>';
        return;
    }
    
    // 使用安全验证
    const isAdminUser = AdminAuth.isAuthenticated();
    
    commentsList.innerHTML = post.comments.map(comment => `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-author">👤 ${comment.author || '匿名'}</span>
                <span class="comment-time">${comment.time}</span>
            </div>
            <div class="comment-body">${comment.content}</div>
            ${isAdminUser ? `
                <div class="comment-actions">
                    <button onclick="deleteComment(${post.id}, ${comment.id})">🗑️ 删除</button>
                </div>
            ` : ''}
        </div>
    `).join('');
}

function renderAdminList() {
    const adminList = document.getElementById('adminList');
    if (!adminList) return;
    
    // 使用安全验证
    if (!AdminAuth.isAuthenticated()) {
        adminList.innerHTML = `
            <div style="text-align:center;padding:40px;">
                <p style="margin-bottom:20px;">🔒 需要管理员权限</p>
                <button onclick="verifyAdmin()">登录</button>
            </div>
        `;
        return;
    }
    
    if (posts.length === 0) {
        adminList.innerHTML = '<p style="text-align:center;padding:40px;">暂无帖子</p>';
        return;
    }
    
    adminList.innerHTML = posts.map((post, i) => `
        <div class="admin-item">
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <div>
                    <h3>${post.title}</h3>
                    <div class="meta">
                        👤 ${post.author || '匿名'} | 
                        💬 ${post.comments ? post.comments.length : 0} 评论 | 
                        #${i+1} | ${post.editTime || post.time}
                    </div>
                </div>
                <div style="display:flex;gap:10px;">
                    <button class="edit" onclick="editPost(${post.id})">✏️ 修改</button>
                    <button class="delete" onclick="deletePost(${post.id})">🗑️ 删除</button>
                </div>
            </div>
        </div>
    `).join('');
}

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 论坛启动');
    console.log('用户ID:', generateUserId());
    
    generateCaptcha();
    await loadPosts();
});