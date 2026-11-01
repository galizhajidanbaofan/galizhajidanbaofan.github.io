/* 结局表。编号从 END 01「失联」开始，01 在 ending-lost.html 里是写死的，
   这里从 02 起排。text 为展示正文，note 只在内部备注用（不渲染）。 */
export const ENDINGS = {
    shutdown: {
        no: 'END 02',
        title: '关站',
        line: '你选择了关闭全站',
        text: '你放弃了得知最后的真相，但这一切至少结束了？',
        tone: 'normal'
    },
    compromise: {
        no: 'END 03',
        title: '折中的对策',
        line: '两个账号都已封停',
        text: '至少这一切结束了？',
        tone: 'normal'
    },
    insight: {
        no: 'END 04',
        title: '识破',
        line: '论坛已关闭',
        text: '你成功识破了奇异的阴谋。',
        tone: 'happy'
    },
    outplayed: {
        no: 'END 05',
        title: '棋差一着',
        line: '你退出了系统',
        text: '你退出了。它还在。',
        tone: 'false'
    },
    innocent: {
        no: 'END 06',
        title: '无辜的牺牲者',
        line: '账号已封停',
        text: '井底再也没有回过话。',
        tone: 'bad'
    }
};

export function findEnding(key) {
    return ENDINGS[key] || null;
}
