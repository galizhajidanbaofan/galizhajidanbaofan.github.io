/**
 * 轻量 UI 组件：顶部提示条、友好弹窗。
 * 用来替代原生 alert / prompt（原生弹窗会阻塞页面、无法换行、移动端体验差）。
 */

let closeActiveModal = null;

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
 * 打开一个只有一个「知道了」按钮的弹窗。
 * 段落用空行分隔。
 */
export function openModal({ title = '提示', message = '', confirmText = '知道了' } = {}) {
  if (closeActiveModal) closeActiveModal();

  return new Promise((resolve) => {
    const mask = document.createElement('div');
    mask.className = 'ui-modal-mask';

    const dialog = document.createElement('div');
    dialog.className = 'ui-modal';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', title);

    const heading = document.createElement('h2');
    heading.className = 'ui-modal__title';
    heading.textContent = title;

    const body = document.createElement('div');
    body.className = 'ui-modal__body';
    String(message)
      .split(/\n{2,}/)
      .forEach((paragraph) => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        body.appendChild(p);
      });

    const actions = document.createElement('div');
    actions.className = 'ui-modal__actions';

    const confirm = document.createElement('button');
    confirm.type = 'button';
    confirm.className = 'ui-btn ui-btn--primary';
    confirm.textContent = confirmText;
    actions.appendChild(confirm);

    dialog.append(heading, body, actions);
    mask.appendChild(dialog);
    document.body.appendChild(mask);

    const close = () => {
      document.removeEventListener('keydown', onKey);
      mask.remove();
      closeActiveModal = null;
      resolve();
    };
    const onKey = (event) => {
      if (event.key === 'Escape') close();
    };

    confirm.addEventListener('click', close);
    mask.addEventListener('click', (event) => {
      if (event.target === mask) close();
    });
    document.addEventListener('keydown', onKey);

    closeActiveModal = close;
    requestAnimationFrame(() => mask.classList.add('is-visible'));
    confirm.focus();
  });
}
