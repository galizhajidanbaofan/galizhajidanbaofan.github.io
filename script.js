// ========== JSONBin配置 ==========
const BIN_ID = '6a38d65df5f4af5e291b4d68';  // 你的BIN_ID
const API_KEY = '$2a$10$fSsQwf2TxKlfWU/zTta.l.0qsHSpmQ9G08HixJjMQvT0xzlqcM/g.';  // 替换为你的密钥
const ADMIN_PASSWORD = 'admin123';

let posts = [];
let isAdmin = false;
let lastPostTime = 0;
let offlineMode = false;

// ========== 核心功能 ==========

// 测试连接
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

// 加载帖子
async function loadPosts() {
    console.log('📥 正在加载帖子...');
    
    const isConnected = await testConnection();
    
    if (!isConnected) {
        console.warn('⚠️ JSONBin连接失败，使用离线模式');
        offlineMode = true;
        
        const cached = localStorage.getItem('forum_posts_backup');
        if (cached) {
            posts = JSON.parse(cached);
            console.log('📦 从本地加载了', posts.length, '个帖子');
        } else {
            posts = [];
            console.log('📭 本地无缓存');
        }
        
        renderCurrentPage();
        return;
    }
    
    offlineMode = false;
    
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: { 'X-Master-Key': API_KEY }
        });
        
        console.log('📊 加载状态:', response.status);
        
        if (!response.ok) {
            if (response.status === 401) {
                console.error('❌ 401 - API密钥权限不足');
                showMessage('API密钥权限不足，请检查配置', 'error');
            }
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        posts = data.record.posts || [];
        
        localStorage.setItem('forum_posts_backup', JSON.stringify(posts));
        
        console.log('✅ 加载成功！帖子数:', posts.length);
        
    } catch (error) {
        console.error('❌ 加载失败:', error.message);
        
        const cached = localStorage.getItem('forum_posts_backup');
        if (cached) {
            posts = JSON.parse(cached);
            console.log('📦 使用本地缓存:', posts.length, '个帖子');
        } else {
            posts = [];
        }
    }
    
    renderCurrentPage();
}

// 保存帖子
async function savePosts() {
    localStorage.setItem('forum_posts_backup', JSON.stringify(posts));
    
    if (offlineMode) {
        console.log('💾 离线模式，仅保存到本地');
        return false;
    }
    
    try {
        console.log('💾 正在保存到JSONBin...');
        
        const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify({ posts })
        });
        
        console.log('📊 保存状态:', response.status);
        
        if (response.status === 401) {
            console.error('❌ 401 - 没有写入权限');
            showMessage('保存失败：API密钥权限不足', 'error');
            return false;
        }
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        console.log('✅ 保存成功');
        return true;
        
    } catch (error) {
        console.error('❌ 保存失败:', error.message);
        showMessage('服务器保存失败，已保存到本地', 'warning');
        return false;
    }
}

// 添加帖子
async function addPost() {
    console.log('📝 开始添加帖子');
    
    // 验证码检查
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
    
    // 频率限制
    const now = Date.now();
    if (now - lastPostTime < 30000) {
        alert('请等待30秒后再发帖');
        return;
    }
    lastPostTime = now;
    
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    // 输入验证
    if (!title || !content) {
        alert('请填写标题和内容');
        return;
    }
    
    if (title.length > 100) {
        alert('标题不能超过100字');
        return;
    }
    
    if (content.length > 5000) {
        alert('内容不能超过5000字');
        return;
    }
    
    // 创建帖子
    const post = {
        id: Date.now(),
        title: escapeHtml(title),
        content: escapeHtml(content),
        time: new Date().toLocaleString('zh-CN'),
        editTime: null
    };
    
    console.log('📝 新帖子:', post.title);
    
    // 添加到列表
    posts.unshift(post);
    
    // 保存
    const saved = await savePosts();
    
    // 清空表单
    titleInput.value = '';
    contentInput.value = '';
    if (captchaInput) {
        refreshCaptcha();
    }
    
    if (saved) {
        alert('✅ 发布成功！');
    } else {
        alert('⚠️ 已保存到本地（离线模式）');
    }
    
    // 重新加载
    await loadPosts();
}

// 删除帖子
async function deletePost(id) {
    if (!verifyAdmin()) return;
    if (!confirm('确定要删除这个帖子吗？')) return;
    
    posts = posts.filter(p => p.id !== id);
    await savePosts();
    await loadPosts();
    renderAdminList();
    alert('删除成功');
}

// 修改帖子
async function editPost(id) {
    if (!verifyAdmin()) return;
    
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

// ========== 辅助功能 ==========

function verifyAdmin() {
    if (isAdmin) return true;
    
    const stored = sessionStorage.getItem('admin_verified');
    if (stored === 'true') {
        isAdmin = true;
        return true;
    }
    
    const password = prompt('请输入管理员密码：');
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('admin_verified', 'true');
        isAdmin = true;
        return true;
    }
    
    alert('密码错误！');
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
    sessionStorage.removeItem('admin_verified');
    isAdmin = false;
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
                <div class="meta">📅 ${post.editTime || post.time}</div>
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
        return;
    }
    
    detail.innerHTML = `
        <div class="detail-header">
            <h2>${post.title}</h2>
            <div class="meta">${post.editTime || post.time}</div>
            <div style="margin-top:20px;white-space:pre-wrap;">${post.content}</div>
            <div style="margin-top:20px;">
                <a href="index.html">← 返回首页</a>
            </div>
        </div>
    `;
}

function renderAdminList() {
    const adminList = document.getElementById('adminList');
    if (!adminList) return;
    
    if (!isAdmin && !sessionStorage.getItem('admin_verified')) {
        adminList.innerHTML = `
            <div style="text-align:center;padding:40px;">
                <p style="margin-bottom:20px;">🔒 需要管理员权限</p>
                <button onclick="verifyAdmin()">管理员登录</button>
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
                    <div class="meta">#${i+1} | ${post.editTime || post.time}</div>
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
    console.log('加载中');
    console.log('BIN_ID:', BIN_ID);
    console.log('API_KEY前10位:', API_KEY.substring(0, 10) + '...');
    
    generateCaptcha();
    await loadPosts();
});