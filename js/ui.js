/**
 * 轻量 UI 组件：顶部提示条、友好弹窗、可承载表单的对话框。
 * 用来替代原生 alert / prompt / confirm（原生弹窗会阻塞页面、无法换行、移动端体验差）。
 *
 * 复古主题下对话框会渲染成 Win98 窗口：标题走 dialog 的 data-title，
 * 因此这里必须始终把 title 同时写进 dataset.title 和标题节点。
 */

let closeActiveDialog = null;

/** 顶部飘一条提示。type: info | success | error */
export function toast(message, type = 'info') {
  const box = document.createElement('div');
  box.className = `ui-toast ui-toast--${type}`;
  box.setAttribute('role', 'status');
  box.textContent = message;
  document.body.appendChild(box);

  requestAnimationFrame(() => box.classList.add('is-visible'));
  setTimeout(() => {
    box.classList.remove('is-visible');
    setTimeout(() => box.remove(), 300);
  }, 2600);
}

/**
 * 打开一个对话框。
 * @param {object} options
 * @param {string} options.title      标题（同时用于复古主题的标题栏）
 * @param {string} [options.kicker]   标题上方的小字
 * @param {string} [options.message]  纯文本正文，空行分段
 * @param {string} [options.html]     富正文（调用方负责转义）
 * @param {HTMLElement|null} [options.node] 直接塞进正文的 DOM 节点
 * @param {boolean} [options.wide]    宽版
 * @param {Array<{label:string, primary?:boolean, keep?:boolean, onClick?:Function}>} [options.actions]
 * @returns {{ close: Function, dialog: HTMLElement, body: HTMLElement, setActions: Function }}
 */
export function openDialog({
  title = '提示',
  kicker = '',
  message = '',
  html = '',
  node = null,
  wide = false,
  actions = [{ label: '知道了', primary: true }]
} = {}) {
  if (closeActiveDialog) closeActiveDialog();

  const mask = document.createElement('div');
  mask.className = 'ui-modal-mask';

  const dialog = document.createElement('div');
  dialog.className = `ui-modal${wide ? ' ui-modal--wide' : ''}`;
  dialog.dataset.title = title;
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-label', title);

  const heading = document.createElement('h2');
  heading.className = 'ui-modal__title';
  heading.textContent = title;

  const body = document.createElement('div');
  body.className = 'ui-modal__body';

  if (kicker) {
    const small = document.createElement('p');
    small.className = 'ui-modal__kicker';
    small.textContent = kicker;
    body.appendChild(small);
  }

  if (html) {
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    body.appendChild(wrap);
  }

  if (message) {
    String(message)
      .split(/\n{2,}/)
      .forEach((paragraph) => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        body.appendChild(p);
      });
  }

  if (node) body.appendChild(node);

  const actionBar = document.createElement('div');
  actionBar.className = 'ui-modal__actions';

  const close = () => {
    document.removeEventListener('keydown', onKey);
    mask.remove();
    closeActiveDialog = null;
  };

  const onKey = (event) => {
    if (event.key === 'Escape') close();
  };

  const setActions = (list) => {
    actionBar.textContent = '';
    list.forEach((action) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `btn${action.primary ? ' btn--primary' : ' btn--quiet'}`;
      button.textContent = action.label;
      button.addEventListener('click', () => {
        if (action.keep !== true) close();
        action.onClick?.(close);
      });
      actionBar.appendChild(button);
    });
    actionBar.lastElementChild?.focus();
  };

  setActions(actions);

  dialog.append(heading, body, actionBar);
  mask.appendChild(dialog);
  document.body.appendChild(mask);

  mask.addEventListener('click', (event) => {
    if (event.target === mask) close();
  });
  document.addEventListener('keydown', onKey);

  closeActiveDialog = close;
  requestAnimationFrame(() => mask.classList.add('is-visible'));

  return { close, dialog, body, setActions };
}

/**
 * 只有一个确认按钮的提示弹窗（保持旧签名，内部走 openDialog）。
 */
export function openModal({ title = '提示', message = '', confirmText = '知道了' } = {}) {
  return new Promise((resolve) => {
    openDialog({
      title,
      message,
      actions: [{ label: confirmText, primary: true, onClick: () => resolve() }]
    });
  });
}
