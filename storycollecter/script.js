// ========== 安全配置 ==========
const CONFIG = {
    BIN_ID: '6a38c8d1da38895dfee99737',
    API_KEY: '$2a$10$70Gt63yNIYwnMtMKmOaJUO9qLL99C6d31ImUvdbjBgcORjS3EUBse',
    ADMIN_API_KEY: '$2a$10$d/CSfhFYMbLXEOPkOoPTUeqvLnFbB7rAIuIR.y7Ex5uZPhPDzPKoO',
    ADMIN_PASSWORD: '1.048596',
    BASE_URL: 'https://api.jsonbin.io/v3/b',
    MAX_POSTS: 100, // 最大帖子数量
    RATE_LIMIT: 30, // 发帖间隔（秒）
    MAX_TITLE_LENGTH: 100,
    MAX_CONTENT_LENGTH: 5000
};
// ===============================

let posts = [];
let isAdmin = false;
let lastPostTime = 0;

// ========== 数据操作 ==========

// 加载帖子数据
async function loadPosts() {
    try {
        const response = await fetch(`${CONFIG.BASE_URL}/${CONFIG.BIN_ID}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': CONFIG.API_KEY
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        posts = data.record.posts || [];
        
        // 按时间排序
        posts.sort((a, b) => b.id - a.id);
        
    } catch (error) {
        console.error('加载帖子失败:', error);
        posts = [];
        showMessage('加载帖子失败，请检查网络连接', 'error');
    }
    
    renderCurrentPage();
}

// 保存帖子数据
async function savePosts() {
    try {
        // 限制帖子数量
        if (posts.length > CONFIG.MAX_POSTS) {
            posts = posts.slice(0, CONFIG.MAX_POSTS);
        }
        
        const response = await fetch(`${CONFIG.BASE_URL}/${CONFIG.BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': CONFIG.ADMIN_API_KEY,
                'X-Bin-Versioning': 'false'
            },
            body: JSON.stringify({ 
                posts: posts,
                lastUpdated: new Date().toISOString(),
                totalPosts: posts.length
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log('数据保存成功');
        
    } catch (error) {
        console.error('保存失败:', error);
        throw error;
    }
}

// ========== 安全验证 ==========

// 管理员身份验证
function verifyAdmin() {
    if (isAdmin) return true;
    
    // 检查sessionStorage
    const storedPassword = sessionStorage.getItem('admin_verified');
    if (storedPassword === 'true') {
        isAdmin = true;
        return true;
    }
    
    // 要求输入密码
    const password = prompt('请输入管理员密码：');
    
    if (password === null) {
        return false; // 用户取消
    }
    
    if (password === CONFIG.ADMIN_PASSWORD) {
        sessionStorage.setItem('admin_verified', 'true');
        isAdmin = true;
        showMessage('管理员身份验证成功', 'success');
        return true;
    }
    
    showMessage('密码错误，请重试', 'error');
    return false;
}

// 退出管理员
function logoutAdmin() {
    sessionStorage.removeItem('admin_verified');
    isAdmin = false;
    showMessage('已退出管理模式', 'info');
    renderAdminList();
}

// 验证码验证
function verifyCaptcha() {
    const captchaInput = document.getElementById('captcha');
    if (!captchaInput) return true; // 没有验证码元素时跳过
    
    const userAnswer = parseInt(captchaInput.value);
    const correctAnswer = parseInt(captchaInput.dataset.answer);
    
    if (isNaN(userAnswer)) {
        showMessage('请输入验证码', 'warning');
        return false;
    }
    
    if (userAnswer !== correctAnswer) {
        showMessage('验证码错误，请重试', 'error');
        refreshCaptcha();
        return false;
    }
    
    return true;
}

// 生成验证码
function generateCaptcha() {
    const questionSpan = document.getElementById('captcha-question');
    const captchaInput = document.getElementById('captcha');
    
    if (!questionSpan || !captchaInput) return;
    
    const operations = [
        { sign: '+', calc: (a, b) => a + b },
        { sign: '-', calc: (a, b) => a - b },
        { sign: '×', calc: (a, b) => a * b }
    ];
    
    const op = operations[Math.floor(Math.random() * operations.length)];
    let num1, num2, answer;
    
    if (op.sign === '×') {
        num1 = Math.floor(Math.random() * 9) + 1;
        num2 = Math.floor(Math.random() * 9) + 1;
    } else if (op.sign === '-') {
        num1 = Math.floor(Math.random() * 20) + 5;
        num2 = Math.floor(Math.random() * num1);
    } else {
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
    }
    
    answer = op.calc(num1, num2);
    
    questionSpan.textContent = `${num1} ${op.sign} ${num2} = ?`;
    captchaInput.dataset.answer = answer;
    captchaInput.value = '';
}

// 刷新验证码
function refreshCaptcha() {
    generateCaptcha();
}

// 频率限制检查
function checkRateLimit() {
    const now = Date.now();
    const elapsed = (now - lastPostTime) / 1000;
    
    if (elapsed < CONFIG.RATE_LIMIT) {
        const waitSeconds = Math.ceil(CONFIG.RATE_LIMIT - elapsed);
        showMessage(`请等待 ${waitSeconds} 秒后再发帖`, 'warning');
        return false;
    }
    
    lastPostTime = now;
    return true;
}

// ========== 输入处理 ==========

// HTML转义
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, char => map[char]);
}

// 输入清理
function sanitizeInput(input) {
    // 移除控制字符
    let cleaned = input.replace(/[\x00-\x1F\x7F]/g, '');
    // 移除多余空格
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
}



// 验证帖子内容
function validatePost(title, content) {
    if (!title || !content) {
        showMessage('请填写标题和内容', 'warning');
        return false;
    }
    
    if (title.length > CONFIG.MAX_TITLE_LENGTH) {
        showMessage(`标题不能超过${CONFIG.MAX_TITLE_LENGTH}个字符`, 'warning');
        return false;
    }
    
    if (content.length > CONFIG.MAX_CONTENT_LENGTH) {
        showMessage(`内容不能超过${CONFIG.MAX_CONTENT_LENGTH}个字符`, 'warning');
        return false;
    }
    
    if (containsSensitiveWords(title) || containsSensitiveWords(content)) {
        showMessage('内容包含违规信息，请修改', 'error');
        return false;
    }
    
    return true;
}

// ========== 帖子操作 ==========

// 添加帖子
async function addPost() {
    // 验证码检查
    if (!verifyCaptcha()) {
        return;
    }
    
    // 频率限制检查
    if (!checkRateLimit()) {
        return;
    }
    
    const titleInput = document.getElementById('title');
    const contentInput = document.getElementById('content');
    
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    
    // 内容验证
    if (!validatePost(title, content)) {
        return;
    }
    
    // 创建帖子对象
    const post = {
        id: Date.now(),
        title: escapeHtml(sanitizeInput(title)),
        content: escapeHtml(sanitizeInput(content)),
        time: new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }),
        editTime: null
    };
    
    try {
        posts.unshift(post);
        await savePosts();
        await loadPosts();
        
        // 清空表单
        titleInput.value = '';
        contentInput.value = '';
        refreshCaptcha();
        
        showMessage('帖子发布成功！', 'success');
        renderPostList();
        
    } catch (error) {
        showMessage('发布失败，请重试', 'error');
        console.error('发布帖子失败:', error);
    }
}

// 删除帖子
async function deletePost(id) {
    if (!verifyAdmin()) {
        return;
    }
    
    if (!confirm('确定要删除这个帖子吗？此操作不可恢复！')) {
        return;
    }
    
    try {
        posts = posts.filter(p => p.id !== id);
        await savePosts();
        await loadPosts();
        
        showMessage('帖子已删除', 'success');
        renderAdminList();
        
    } catch (error) {
        showMessage('删除失败，请重试', 'error');
        console.error('删除帖子失败:', error);
    }
}

// 修改帖子
async function editPost(id) {
    if (!verifyAdmin()) {
        return;
    }
    
    const post = posts.find(p => p.id === id);
    if (!post) {
        showMessage('帖子不存在', 'error');
        return;
    }
    
    const newTitle = prompt('请输入新标题：', post.title);
    if (newTitle === null) return;
    
    const newContent = prompt('请输入新内容：', post.content);
    if (newContent === null) return;
    
    const trimmedTitle = newTitle.trim();
    const trimmedContent = newContent.trim();
    
    if (!validatePost(trimmedTitle, trimmedContent)) {
        return;
    }
    
    try {
        post.title = escapeHtml(sanitizeInput(trimmedTitle));
        post.content = escapeHtml(sanitizeInput(trimmedContent));
        post.editTime = new Date().toLocaleString('zh-CN');
        
        await savePosts();
        await loadPosts();
        
        showMessage('帖子修改成功', 'success');
        renderAdminList();
        
    } catch (error) {
        showMessage('修改失败，请重试', 'error');
        console.error('修改帖子失败:', error);
    }
}

// ========== 页面渲染 ==========

// 判断当前页面并渲染
function renderCurrentPage() {
    if (document.getElementById('postList')) {
        renderPostList();
    } else if (document.getElementById('postDetail')) {
        renderPostDetail();
    } else if (document.getElementById('adminList')) {
        renderAdminList();
    }
}

// 渲染帖子列表
function renderPostList() {
    const postList = document.getElementById('postList');
    if (!postList) return;
    
    if (posts.length === 0) {
        postList.innerHTML = `
            <div class="post-item" style="text-align:center;padding:40px;">
                <p style="font-size:18px;color:#999;">📝 暂无帖子</p>
                <p style="color:#aaa;margin-top:8px;">成为第一个发帖的人吧！</p>
            </div>
        `;
        return;
    }
    
    postList.innerHTML = posts.map(post => `
        <div class="post-item">
            <h3>
                <a href="post.html?id=${post.id}">${post.title}</a>
                ${post.editTime ? '<span style="font-size:12px;color:#999;">(已编辑)</span>' : ''}
            </h3>
            <div class="meta">📅 发布时间：${post.editTime || post.time}</div>
            <div class="content">${post.content.substring(0, 150)}${post.content.length > 150 ? '...' : ''}</div>
        </div>
    `).join('');
}

// 渲染帖子详情
function renderPostDetail() {
    const detail = document.getElementById('postDetail');
    if (!detail) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const id = parseInt(urlParams.get('id'));
    
    if (!id) {
        detail.innerHTML = '<p style="text-align:center;padding:40px;">无效的帖子ID</p>';
        return;
    }
    
    const post = posts.find(p => p.id === id);
    
    if (!post) {
        detail.innerHTML = `
            <div style="text-align:center;padding:40px;">
                <p style="font-size:18px;color:#999;">帖子不存在或已被删除</p>
                <a href="index.html" style="color:#1a73e8;">返回首页</a>
            </div>
        `;
        return;
    }
    
    detail.innerHTML = `
        <div class="detail-header">
            <h2>${post.title}</h2>
            <div class="meta">
                📅 发布时间：${post.time}
                ${post.editTime ? ` | ✏️ 最后编辑：${post.editTime}` : ''}
            </div>
            <div style="margin-top: 24px; white-space: pre-wrap; line-height: 1.8; font-size: 16px;">
                ${post.content}
            </div>
            <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #eee;">
                <a href="index.html" style="color:#1a73e8;">← 返回首页</a>
            </div>
        </div>
    `;
}

// 渲染管理列表
function renderAdminList() {
    const adminList = document.getElementById('adminList');
    if (!adminList) return;
    
    // 验证管理员身份
    if (!isAdmin && !sessionStorage.getItem('admin_verified')) {
        adminList.innerHTML = `
            <div style="text-align:center;padding:40px;">
                <p style="font-size:18px;margin-bottom:20px;">需要管理员权限</p>
                <button onclick="verifyAdmin()">验证管理员身份</button>
            </div>
        `;
        return;
    }
    
    if (posts.length === 0) {
        adminList.innerHTML = `
            <div style="text-align:center;padding:40px;">
                <p style="font-size:18px;color:#999;">📝 暂无帖子</p>
            </div>
        `;
        return;
    }
    
    adminList.innerHTML = posts.map((post, index) => `
        <div class="admin-item">
            <div style="display:flex;justify-content:space-between;align-items:start;">
                <div style="flex:1;">
                    <h3>
                        ${post.title}
                        ${post.editTime ? '<span style="font-size:12px;color:#ffc107;">(已编辑)</span>' : ''}
                    </h3>
                    <div class="meta">
                        #${index + 1} | 📅 ${post.editTime || post.time}
                    </div>
                </div>
                <div class="admin-actions">
                    <button class="edit" onclick="editPost(${post.id})">✏️ 修改</button>
                    <button class="delete" onclick="deletePost(${post.id})">🗑️ 删除</button>
                </div>
            </div>
        </div>
    `).join('');
}

// ========== 工具函数 ==========

// 显示消息提示
function showMessage(message, type = 'info') {
    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 6px;
        color: white;
        font-size: 14px;
        z-index: 9999;
        animation: fadeIn 0.3s;
    `;
    
    switch(type) {
        case 'success':
            messageDiv.style.backgroundColor = '#28a745';
            break;
        case 'error':
            messageDiv.style.backgroundColor = '#dc3545';
            break;
        case 'warning':
            messageDiv.style.backgroundColor = '#ffc107';
            messageDiv.style.color = '#333';
            break;
        default:
            messageDiv.style.backgroundColor = '#17a2b8';
    }
    
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        messageDiv.style.animation = 'fadeOut 0.3s';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 300);
    }, 3000);
}

// ========== 初始化 ==========
window.addEventListener('DOMContentLoaded', async () => {
    // 生成验证码
    generateCaptcha();
    
    // 加载数据
    await loadPosts();
    
    console.log('安全论坛初始化完成');
    console.log(`已加载 ${posts.length} 个帖子`);
});

// ========== 定时刷新 ==========
// 每30秒自动刷新一次数据
setInterval(async () => {
    await loadPosts();
}, 30000);

// ========== 键盘快捷键 ==========
document.addEventListener('keydown', (e) => {
    // Ctrl+Enter 提交帖子
    if (e.ctrlKey && e.key === 'Enter') {
        const submitButton = document.querySelector('.post-form button');
        if (submitButton && document.activeElement) {
            submitButton.click();
        }
    }
});