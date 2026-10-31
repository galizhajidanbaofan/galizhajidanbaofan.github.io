/**
 * 管理员口令校验（纯前端）。
 *
 * 说明：静态站没有服务器，这里只能把「谁能看档案」做成一道门槛，
 * 不是真正的访问控制——任何人下载 data/archive.json 都能读到里面的字。
 * 它的用途是「叙事上的门」，不是安全边界。
 */
import { CONFIG } from './config.js';

const TOKEN_KEY = 'admin_token';
const COOKIE_NAME = 'admin_token';

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function fromHex(hex) {
  const clean = String(hex).trim();
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
}

export async function sha256(text) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return toHex(digest);
}

async function pbkdf2(text, saltHex, iterations) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(text),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: fromHex(saltHex), iterations, hash: 'SHA-256' },
    key,
    256
  );
  return toHex(bits);
}

/** 按 config 里的凭据逐条比对。 */
export async function verifyPassword(password) {
  if (!password) return false;

  for (const credential of CONFIG.admin.credentials) {
    if (credential.type === 'pbkdf2') {
      const hash = await pbkdf2(password, credential.salt, credential.iterations);
      if (hash === credential.hash) return true;
    } else if (credential.type === 'sha256') {
      const hash = await sha256(password);
      if (hash === credential.hash) return true;
    }
  }
  return false;
}

function getCookie(name) {
  const entry = document.cookie
    .split(';')
    .map((item) => item.trim().split('='))
    .find(([key]) => key === name);
  return entry ? entry[1] : null;
}

function issueToken() {
  return `tok_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

/** 是否已处于管理员模式：session 与 cookie 双匹配。 */
export function isAdmin() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  return Boolean(token) && getCookie(COOKIE_NAME) === token;
}

export async function login(password) {
  const ok = await verifyPassword(password);
  if (!ok) return false;

  const token = issueToken();
  const expires = new Date();
  expires.setDate(expires.getDate() + CONFIG.admin.sessionDays);

  sessionStorage.setItem(TOKEN_KEY, token);
  document.cookie = `${COOKIE_NAME}=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
  return true;
}

export function logout() {
  sessionStorage.removeItem(TOKEN_KEY);
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}
