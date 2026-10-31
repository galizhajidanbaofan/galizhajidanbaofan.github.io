/**
 * 本地存档：把玩家的选择记在浏览器里（localStorage）。
 *
 * 为什么不做服务器存档：本站是纯静态的 GitHub Pages，没有后端；维护期也不接
 * 任何外部服务。代价是换设备 / 清缓存就丢档，所以这里做三件事：
 *   1. 带版本号，结构升级时旧档不会被误读；
 *   2. 读写都包 try/catch —— 隐私模式下 localStorage 会直接抛错；
 *   3. 只存必要的东西（选择、已解锁标记），不存正文。
 *
 * 后续「两个江望舒对峙」与结局判定，都在这里记录选择。
 */

const KEY = 'qiwenyishi_progress';
const VERSION = 1;

function readRaw() {
  try {
    const text = localStorage.getItem(KEY);
    if (!text) return null;
    const data = JSON.parse(text);
    if (!data || data.version !== VERSION) return null;
    return data;
  } catch {
    return null;
  }
}

function empty() {
  return {
    version: VERSION,
    updatedAt: null,
    choices: {},   // { [sceneId]: optionId }
    flags: {},     // { [flagName]: true }
    visited: []    // 已读过的场景 id
  };
}

/** 读取整份存档（永远返回可写的对象，不返回 null） */
export function loadProgress() {
  return readRaw() || empty();
}

/** 落盘；失败时安静返回 false，调用方不必处理 */
export function saveProgress(progress) {
  const payload = { ...progress, version: VERSION, updatedAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

/** 记一次选择 */
export function recordChoice(sceneId, optionId) {
  const progress = loadProgress();
  progress.choices[sceneId] = optionId;
  if (!progress.visited.includes(sceneId)) progress.visited.push(sceneId);
  saveProgress(progress);
  return progress;
}

/** 记一个标记（例如「见过假江望舒」） */
export function setFlag(name, value = true) {
  const progress = loadProgress();
  progress.flags[name] = value;
  saveProgress(progress);
  return progress;
}

export function getChoice(sceneId) {
  return loadProgress().choices[sceneId] ?? null;
}

export function hasFlag(name) {
  return Boolean(loadProgress().flags[name]);
}

/** 清档：留给「重新开始」用，先不接任何按钮 */
export function clearProgress() {
  try {
    localStorage.removeItem(KEY);
    return true;
  } catch {
    return false;
  }
}
