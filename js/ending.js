import { initTheme, toggleTheme } from './theme.js';
import { findEnding } from './endings.js';
import { recordChoice } from './state.js';

document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => toggleTheme());
});
initTheme();

const key = new URLSearchParams(window.location.search).get('e');
const ending = findEnding(key);

const no = document.getElementById('endingNo');
const title = document.getElementById('endingTitle');
const line = document.getElementById('endingLine');
const text = document.getElementById('endingText');
const task = document.getElementById('taskTitle');

if (!ending) {
    no.textContent = 'END ??';
    title.textContent = '没有这条记录';
    line.textContent = '记录缺失';
    text.textContent = '这次的结局没有写进档案里。';
} else {
    no.textContent = ending.no;
    title.textContent = ending.title;
    line.textContent = ending.line;
    text.textContent = ending.text;
    document.title = `${ending.title} - 奇闻异事`;
    document.getElementById('endingRoot').dataset.tone = ending.tone;
    if (task) task.textContent = ending.title;
    recordChoice('ending', ending.no);
    try {
        sessionStorage.setItem('chat_ending', key);
    } catch (error) {
        /* 隐私模式忽略 */
    }
}
