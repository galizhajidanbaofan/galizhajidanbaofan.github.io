/**
 * 数据读取层。
 *
 * 现在数据是仓库里的静态 JSON（data/posts.json / data/archive.json），只读。
 * 以后要换成别的来源（GitHub Issues、Supabase、本地 mock），只要改这个文件，
 * 页面与渲染逻辑不用动。
 */
import { CONFIG } from './config.js';
import { parseTime } from './format.js';

const cache = new Map();

function normalizeComment(comment, index) {
  return {
    id: comment.id ?? index,
    floor: Number.isInteger(comment.floor) ? comment.floor : index + 1,
    userId: comment.userId || '',
    author: String(comment.author || '匿名').trim() || '匿名',
    content: String(comment.content ?? ''),
    time: parseTime(comment.time) ? comment.time : null
  };
}

function normalizePost(post) {
  const rawComments = Array.isArray(post.comments) ? post.comments : [];
  return {
    id: post.id,
    tier: Number.isFinite(post.tier) ? post.tier : undefined,
    userId: post.userId || '',
    author: String(post.author || '匿名').trim() || '匿名',
    title: String(post.title || '(无标题)'),
    content: String(post.content ?? ''),
    time: parseTime(post.time) ? post.time : null,
    editTime: parseTime(post.editTime) ? post.editTime : null,
    comments: rawComments
      .map(normalizeComment)
      .filter((comment) => comment.content.trim().length > 0)
  };
}

function timeValue(post) {
  return parseTime(post.time)?.getTime() || 0;
}

async function fetchDataset(url) {
  const response = await fetch(url, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`读取 ${url} 失败（HTTP ${response.status}）`);
  }

  const payload = await response.json();
  const posts = (Array.isArray(payload.posts) ? payload.posts : []).map(normalizePost);
  posts.sort((a, b) => timeValue(b) - timeValue(a) || Number(b.id) - Number(a.id));

  return {
    posts,
    note: payload.note || '',
    schemaVersion: payload.schemaVersion || 1
  };
}

/** 带缓存的加载：同一 URL 只请求一次，失败时清掉缓存以便重试。 */
export function loadDataset(url) {
  if (!cache.has(url)) {
    const pending = fetchDataset(url).catch((error) => {
      cache.delete(url);
      throw error;
    });
    cache.set(url, pending);
  }
  return cache.get(url);
}

export function loadPosts() {
  return loadDataset(CONFIG.data.posts);
}

export function loadArchive() {
  return loadDataset(CONFIG.data.archive);
}

/**
 * 聊天室进度（sessionStorage.chat_state）。
 * 只用来决定「哪些帖子现在该出现」，页面其它地方一律不读它。
 */
function chatProgress() {
  try {
    const raw = sessionStorage.getItem('chat_state');
    if (!raw) return { anomalies: 0, impostor: false };
    const state = JSON.parse(raw);
    return {
      anomalies: Array.isArray(state?.anomalies) ? state.anomalies.length : 0,
      impostor: Boolean(state?.impostor)
    };
  } catch (error) {
    return { anomalies: 0, impostor: false };
  }
}

async function loadStoryExtras(progress) {
  const extras = [];

  if (progress.anomalies > 0) {
    const glitch = await loadDataset(CONFIG.data.glitch).catch(() => ({ posts: [] }));
    extras.push(...(glitch.posts || []).filter((post) => (post.tier ?? 1) <= progress.anomalies));
  }

  if (progress.impostor) {
    const late = await loadDataset(CONFIG.data.late).catch(() => ({ posts: [] }));
    extras.push(...(late.posts || []));
  }

  return extras;
}

/**
 * 帖子列表 = 公开帖 + 当前进度解锁的剧情帖，统一按时间倒序。
 * 时间坏掉的（拟物抄坏的残片）落在列表最后。
 * 首页、详情页都用这个，保证「刚刚刷出来的帖子」点得进去。
 */
export async function loadStoryPosts() {
  const dataset = await loadPosts();
  const extras = await loadStoryExtras(chatProgress());
  if (!extras.length) return dataset;

  const posts = [...dataset.posts, ...extras].sort(
    (a, b) => timeValue(b) - timeValue(a) || Number(b.id) - Number(a.id)
  );

  return { ...dataset, posts };
}

export function countComments(posts) {
  return posts.reduce((sum, post) => sum + post.comments.length, 0);
}

export function findPost(posts, id) {
  const target = Number(id);
  return posts.find((post) => Number(post.id) === target) || null;
}
