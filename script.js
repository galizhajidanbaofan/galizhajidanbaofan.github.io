// ========== JSONBin配置 ==========
const BIN_ID = '6a38d65df5f4af5e291b4d68';
const API_KEY = '$2a$10$fSsQwf2TxKlfWU/zTta.l.0qsHSpmQ9G08HixJjMQvT0xzlqcM/g.';
const ADMIN_PASSWORD_HASH = '97a3142172e58c70ea51faf6fa5f26eff18c90bbea88c9b4c5354afffd048f64';

let posts = [];
let lastPostTime = 0;
let offlineMode = false;

// ========== SHA-256哈希 ==========
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ========== 主题切换 ==========
(function initTheme() {
    const savedTheme = localStorage.getItem('forum_theme') || 'modern';
    setTheme(savedTheme);
})();

function toggleTheme() {
    const currentTheme = localStorage.getItem('forum_theme') || 'modern';
    const newTheme = currentTheme === 'modern' ? 'retro' : 'modern';
    localStorage.setItem('forum_theme', newTheme);
    setTheme(newTheme);
}

function setTheme(theme) {
    const modern = document.getElementById('css-modern');
    const retro = document.getElementById('css-retro');
    if (!modern || !retro) return;
    if (theme === 'retro') {
        modern.disabled = true;
        retro.disabled = false;
    } else {
        retro.disabled = true;
        modern.disabled = false;
    }
}

// ========== 用户ID ==========
function generateUserId() {
    let userId = localStorage.getItem('forum_user_id');
    if (!userId) {
        userId = 'user_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('forum_user_id', userId);
    }
    return userId;
}

function getNickname(inputNickname) {
    if (inputNickname && inputNickname.trim()) return inputNickname.trim();
    let saved = localStorage.getItem('forum_nickname');
    if (saved) return saved;
    return '匿名用户' + generateUserId().substring(5, 10);
}

function saveNickname(nickname) {
    if (nickname && nickname.trim()) {
        localStorage.setItem('forum_nickname', nickname.trim());
    }
}

// ========== 网络 ==========
async function testConnection() {
    try {
        const r = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            method: 'GET', headers: { 'X-Master-Key': API_KEY }
        });
        return r.ok;
    } catch (e) { return false; }
}

async function loadPosts() {
    const isConnected = await testConnection();
    if (!isConnected) {
        offlineMode = true;
        const cached = localStorage.getItem('forum_posts_backup');
        posts = cached ? JSON.parse(cached) : [];
        renderCurrentPage();
        return;
    }
    offlineMode = false;
    try {
        const r = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { 'X-Master-Key': API_KEY }
        });
        const data = await r.json();
        posts = data.record.posts || [];
        localStorage.setItem('forum_posts_backup', JSON.stringify(posts));
    } catch (e) {
        const cached = localStorage.getItem('forum_posts_backup');
        posts = cached ? JSON.parse(cached) : [];
    }
    renderCurrentPage();
}

async function savePosts() {
    localStorage.setItem('forum_posts_backup', JSON.stringify(posts));
    if (offlineMode) return false;
    try {
        await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': API_KEY },
            body: JSON.stringify({ posts })
        });
        return true;
    } catch (e) { return false; }
}

// ========== 发帖 ==========
async function addPost() {
    const captchaInput = document.getElementById('captcha');
    if (captchaInput) {
        const ua = parseInt(captchaInput.value);
        const ca = parseInt(captchaInput.dataset.answer);
        if (isNaN(ua) || ua !== ca) { alert('验证码错误'); refreshCaptcha(); return; }
    }
    const now = Date.now();
    if (now - lastPostTime < 30000) { alert('请等待30秒'); return; }
    lastPostTime = now;
    
    const nicknameInput = document.getElementById('nickname');
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    
    const nickname = nicknameInput ? nicknameInput.value.trim() : '';
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    if (!title || !content) { alert('请填写标题和内容'); return; }
    if (title.length > 100 || content.length > 5000) { alert('内容过长'); return; }
    
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
    await savePosts();
    
    titleInput.value = '';
    contentInput.value = '';
    if (nicknameInput) nicknameInput.value = '';
    if (captchaInput) refreshCaptcha();
    
    await loadPosts();
    alert('✅ 发布成功！');
}

// ========== 评论 ==========
async function addComment() {
    const postId = parseInt(new URLSearchParams(window.location.search).get('id'));
    const post = posts.find(p => p.id === postId);
    if (!post) { alert('帖子不存在'); return; }
    
    const nicknameInput = document.getElementById('commentNickname');
    const contentInput = document.getElementById('commentContent');
    
    const nickname = nicknameInput ? nicknameInput.value.trim() : '';
    const content = contentInput.value.trim();
    
    if (!content) { alert('请输入评论'); return; }
    if (content.length > 1000) { alert('评论过长'); return; }
    
    saveNickname(nickname);
    
    if (!post.comments) post.comments = [];
    post.comments.push({
        id: Date.now(),
        userId: generateUserId(),
        author: getNickname(nickname),
        content: escapeHtml(content),
        time: new Date().toLocaleString('zh-CN')
    });
    
    await savePosts();
    if (nicknameInput) nicknameInput.value = '';
    contentInput.value = '';
    await loadPosts();
    renderPostDetail();
}

// ========== 管理员验证 ==========
async function verifyAdminAction() {
    const password = prompt('请输入管理员密码：');
    if (!password) return false;
    
    const hashed = await sha256(password);
    if (hashed === ADMIN_PASSWORD_HASH) {
        sessionStorage.setItem('admin_expires', Date.now() + 300000);
        return true;
    }
    alert('密码错误！');
    return false;
}

function isAdminSessionValid() {
    const expires = sessionStorage.getItem('admin_expires');
    if (!expires) return false;
    if (Date.now() > parseInt(expires)) {
        sessionStorage.removeItem('admin_expires');
        return false;
    }
    return true;
}

// 管理页面登录按钮专用
async function adminLogin() {
    const success = await verifyAdminAction();
    if (success) {
        renderAdminList();
    }
}

// ========== 管理操作 ==========
async function deletePost(id) {
    if (!isAdminSessionValid()) {
        const ok = await verifyAdminAction();
        if (!ok) return;
    }
    if (!confirm('确定删除？')) return;
    posts = posts.filter(p => p.id !== id);
    await savePosts();
    await loadPosts();
    renderAdminList();
}

async function editPost(id) {
    if (!isAdminSessionValid()) {
        const ok = await verifyAdminAction();
        if (!ok) return;
    }
    const post = posts.find(p => p.id === id);
    if (!post) { alert('帖子不存在'); return; }
    
    const newTitle = prompt('新标题：', post.title);
    if (newTitle === null) return;
    const newContent = prompt('新内容：', post.content);
    if (newContent === null) return;
    
    if (!newTitle.trim() || !newContent.trim()) { alert('不能为空'); return; }
    
    post.title = escapeHtml(newTitle.trim());
    post.content = escapeHtml(newContent.trim());
    post.editTime = new Date().toLocaleString('zh-CN');
    
    await savePosts();
    await loadPosts();
    renderAdminList();
}

async function deleteComment(postId, commentId) {
    if (!isAdminSessionValid()) {
        const ok = await verifyAdminAction();
        if (!ok) return;
    }
    if (!confirm('确定删除这条评论？')) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    post.comments = post.comments.filter(c => c.id !== commentId);
    await savePosts();
    await loadPosts();
    renderPostDetail();
}

function logoutAdmin() {
    sessionStorage.removeItem('admin_expires');
    alert('已退出管理');
    renderAdminList();
}

// ========== 辅助功能 ==========
function generateCaptcha() {
    const q = document.getElementById('captcha-question');
    const i = document.getElementById('captcha');
    if (!q || !i) return;
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    q.textContent = `${a} + ${b} = ?`;
    i.dataset.answer = a + b;
    i.value = '';
}

function refreshCaptcha() { generateCaptcha(); }

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showMessage(msg, type) {
    const div = document.createElement('div');
    div.style.cssText = `position:fixed;top:20px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:6px;color:white;z-index:9999;background:${type==='success'?'#28a745':type==='error'?'#dc3545':'#17a2b8'};`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// ========== 渲染函数 ==========
function renderCurrentPage() {
    if (document.getElementById('postList')) renderPostList();
    else if (document.getElementById('postDetail')) renderPostDetail();
    else if (document.getElementById('adminList')) renderAdminList();
}

function renderPostList() {
    const list = document.getElementById('postList');
    if (!list) return;
    const statusText = offlineMode ? '⚠️ 离线模式' : '';
    
    if (posts.length === 0) {
        list.innerHTML = `<p style="text-align:center;padding:40px;">📝 暂无帖子</p>${statusText?`<p style="text-align:center;color:orange;">${statusText}</p>`:''}`;
        return;
    }
    
    list.innerHTML = `${statusText?`<p style="text-align:center;color:orange;">${statusText}</p>`:''}${posts.map(p => `
        <div class="post-item">
            <h3><a href="post.html?id=${p.id}">${p.title}</a>${p.editTime?'<span style="font-size:12px;color:#999;">(已编辑)</span>':''}</h3>
            <div class="meta"><span class="post-author">👤 ${p.author||'匿名'}</span>📅 ${p.editTime||p.time}<span class="comment-count">💬 ${p.comments?p.comments.length:0}</span></div>
            <div class="content">${p.content.substring(0,150)}...</div>
        </div>`).join('')}`;
}

function renderPostDetail() {
    const detail = document.getElementById('postDetail');
    if (!detail) return;
    const id = parseInt(new URLSearchParams(window.location.search).get('id'));
    const post = posts.find(p => p.id === id);
    
    if (!post) {
        detail.innerHTML = '<p style="text-align:center;padding:40px;">帖子不存在</p>';
        const sec = document.getElementById('commentsSection');
        if (sec) sec.style.display = 'none';
        return;
    }
    
    detail.innerHTML = `
        <div class="detail-header">
            <h2>${post.title}</h2>
            <div class="meta"><span class="post-author">👤 ${post.author||'匿名'}</span>📅 ${post.time}💬 ${post.comments?post.comments.length:0} 条评论</div>
            <div style="margin-top:20px;white-space:pre-wrap;">${post.content}</div>
            <a href="index.html">← 返回</a>
        </div>`;
    
    const sec = document.getElementById('commentsSection');
    if (sec) sec.style.display = 'block';
    renderComments(post);
}

function renderComments(post) {
    const list = document.getElementById('commentsList');
    if (!list) return;
    if (!post.comments || post.comments.length === 0) {
        list.innerHTML = '<div class="no-comments">💬 暂无评论</div>';
        return;
    }
    const isAdmin = isAdminSessionValid();
    list.innerHTML = post.comments.map(c => `
        <div class="comment-item">
            <div class="comment-header"><span class="comment-author">👤 ${c.author||'匿名'}</span><span class="comment-time">${c.time}</span></div>
            <div class="comment-body">${c.content}</div>
            ${isAdmin?`<div class="comment-actions"><button onclick="deleteComment(${post.id},${c.id})">🗑️</button></div>`:''}
        </div>`).join('');
}

function renderAdminList() {
    const list = document.getElementById('adminList');
    if (!list) return;
    
    if (!isAdminSessionValid()) {
        list.innerHTML = `
            <div style="text-align:center;padding:40px;">
                <p style="margin-bottom:20px;">🔒 需要管理员权限</p>
                <button onclick="adminLogin()">🔑 管理员登录</button>
            </div>`;
        return;
    }
    
    if (posts.length === 0) {
        list.innerHTML = `
            <p style="text-align:center;padding:40px;">暂无帖子</p>
            <div style="text-align:center;margin-top:10px;">
                <button onclick="logoutAdmin()">退出管理</button>
            </div>`;
        return;
    }
    
    list.innerHTML = posts.map((p, i) => `
        <div class="admin-item">
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <div>
                    <h3>${p.title}</h3>
                    <div class="meta">#${i+1} | 👤 ${p.author||'匿名'} | 💬 ${p.comments?p.comments.length:0} | ${p.editTime||p.time}</div>
                </div>
                <div style="display:flex;gap:10px;">
                    <button class="edit" onclick="editPost(${p.id})">✏️</button>
                    <button class="delete" onclick="deletePost(${p.id})">🗑️</button>
                </div>
            </div>
        </div>`).join('') + `
        <div style="text-align:center;margin-top:20px;">
            <button onclick="logoutAdmin()">退出管理</button>
        </div>`;
}

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', async () => {
    generateCaptcha();
    await loadPosts();
});