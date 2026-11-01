/* 异常事件图书馆：取书 / 开卷 / 跳转 */
const list = document.getElementById('bookList');
const flip = document.getElementById('flipLayer');

/** 已入库卷宗各自的去处。新增卷宗时把 data-target 写进 HTML，这里不用动。 */
const REGISTRY = new Map();

function register(button) {
    REGISTRY.set(button.dataset.book, button.dataset.target || '');
}

function openBook(button) {
    const target = button.dataset.target;
    if (!target || button.classList.contains('is-opening')) return;

    button.classList.add('is-opening');
    document.body.classList.add('is-reading');
    flip.classList.add('is-active');

    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 60 : 720;
    window.setTimeout(() => {
        window.location.href = target;
    }, delay);
}

if (list) {
    const books = [...list.querySelectorAll('.bk')];
    books.forEach(register);

    list.addEventListener('click', (event) => {
        const button = event.target.closest('.bk');
        if (!button || button.disabled) return;
        openBook(button);
    });

    /* 键盘：方向键在卷宗之间移动焦点 */
    list.addEventListener('keydown', (event) => {
        if (!['ArrowRight', 'ArrowLeft'].includes(event.key)) return;
        const usable = books.filter((book) => !book.disabled);
        const current = usable.indexOf(document.activeElement);
        if (current === -1) return;
        event.preventDefault();
        const next = event.key === 'ArrowRight'
            ? usable[(current + 1) % usable.length]
            : usable[(current - 1 + usable.length) % usable.length];
        next.focus();
    });
}
