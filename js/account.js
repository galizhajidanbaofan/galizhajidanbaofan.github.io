/**
 * 站内账号。
 *
 * 开篇第一个谜题：论坛里有人"送号"（data/posts.json 里 2026-07-14 那篇），
 * 账号就是楼主贴在帖子里的 ID，密码是他自己会取的那几个数字——另一个帖子里写着。
 * 这里只做前端校验，没有后端，跟管理员口令一样是"门槛"而不是"安全"。
 *
 * 注意：密码只存 sha256，不存明文。玩家翻源码也只能看到一串哈希。
 */

import { sha256 } from './auth.js';
import { openDialog } from './ui.js';
import { loadPosts, findPost } from './store.js';

/** 卖号帖的 id，账号名从这条帖子的 userId 读，避免两处写死。 */
const SELLER_POST_ID = 1784036160000;

/** sha256('0622') */
const PASSWORD_HASH = '8d74cc8b0e09f446ffe37b6fd5b8a08f6b0fdba3af65fec63fb6c984e2b71368';

const STORAGE_KEY = 'qiwenyishi_account';

let sellerIdCache = null;

export function getAccount() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.id ? parsed : null;
  } catch (error) {
    return null;
  }
}

export function isLoggedIn() {
  return Boolean(getAccount()?.id);
}

export function logout() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    /* 隐私模式下静默失败 */
  }
}

async function sellerId() {
  if (sellerIdCache !== null) return sellerIdCache;
  try {
    const { posts } = await loadPosts();
    sellerIdCache = findPost(posts, SELLER_POST_ID)?.userId || '';
  } catch (error) {
    sellerIdCache = '';
  }
  return sellerIdCache;
}

/**
 * 校验账号密码。
 * @returns {Promise<{ok: boolean, account?: object, error?: string}>}
 */
export async function login(rawId, rawPassword) {
  const id = String(rawId || '').trim();
  const password = String(rawPassword || '');
  if (!id || !password) return { ok: false, error: '请填写账号与密码。' };

  const expected = await sellerId();
  if (!expected) return { ok: false, error: '账号数据读取失败，请稍后重试。' };

  const idMatches = id.toLowerCase() === expected.toLowerCase();
  const passwordMatches = (await sha256(password)) === PASSWORD_HASH;
  if (!idMatches || !passwordMatches) {
    return { ok: false, error: '账号或密码错误。' };
  }

  const account = { id: expected, since: Date.now() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
  } catch (error) {
    /* 存不进也不影响本次使用 */
  }
  return { ok: true, account };
}

const LOGIN_FORM_HTML = `
  <form class="login-form" id="loginForm" autocomplete="off" novalidate>
    <label class="form-hint" for="loginId">账号</label>
    <input class="field" type="text" id="loginId" placeholder="请输入账号" autocomplete="username" spellcheck="false">
    <label class="form-hint" for="loginPassword">密码</label>
    <input class="field" type="password" id="loginPassword" placeholder="请输入密码" autocomplete="current-password">
    <p class="admin-gate__error" id="loginError" role="alert"></p>
  </form>
`;

/**
 * 弹窗式登录。
 * @param {{onSuccess?: (account: object) => void, reason?: string}} options
 */
export function openLoginDialog({ onSuccess, reason = '' } = {}) {
  const { close, dialog } = openDialog({
    title: '登录',
    kicker: reason || '此功能需要登录账号',
    html: LOGIN_FORM_HTML,
    actions: [
      { label: '取消' },
      { label: '登录', primary: true, keep: true, onClick: () => {} }
    ]
  });

  const form = dialog.querySelector('#loginForm');
  const idInput = dialog.querySelector('#loginId');
  const passwordInput = dialog.querySelector('#loginPassword');
  const errorEl = dialog.querySelector('#loginError');
  const submitButton = dialog.querySelector('.ui-modal__actions .btn--primary');

  const setError = (message) => {
    errorEl.textContent = message || '';
  };

  const submit = async () => {
    setError('');
    submitButton.disabled = true;
    const result = await login(idInput.value, passwordInput.value);
    submitButton.disabled = false;
    if (result.ok) {
      close();
      onSuccess?.(result.account);
      return;
    }
    setError(result.error);
    passwordInput.value = '';
    passwordInput.focus();
  };

  submitButton.addEventListener('click', submit);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    submit();
  });

  idInput.focus();
  return { close };
}
