// hexagram.js - yin/yang balance to the twelve sovereign hexagrams (十二消息卦)
export const HEXAGRAMS = {
  kun: { zh: '坤', ar: 'التقبّل' },
  fu: { zh: '復', ar: 'العودة' },
  lin: { zh: '臨', ar: 'الاقتراب' },
  tai: { zh: '泰', ar: 'السلام والانسجام' },
  daZhuang: { zh: '大壯', ar: 'القوة العظيمة' },
  guai: { zh: '夬', ar: 'الانفراج' },
  qian: { zh: '乾', ar: 'الإبداع' },
  gou: { zh: '姤', ar: 'اللقاء' },
  dun: { zh: '遯', ar: 'الانسحاب' },
  pi: { zh: '否', ar: 'الركود' },
  guan: { zh: '觀', ar: 'التأمل' },
  bo: { zh: '剝', ar: 'التفكك' }
};

// index = number of solid (yang) lines, 0..6
const WAXING = ['kun', 'fu', 'lin', 'tai', 'daZhuang', 'guai', 'qian'];
const WANING = ['kun', 'bo', 'guan', 'pi', 'dun', 'gou', 'qian'];

export function hexagramFor(yin, yang, rate) {
  const total = yin + yang;
  const share = total > 0.1 ? yang / total : 0.5;
  const solid = Math.max(0, Math.min(6, Math.round(share * 6)));
  const waxing = rate >= 0;
  const lines = [0, 0, 0, 0, 0, 0]; // bottom to top
  for (let i = 0; i < solid; i++) lines[waxing ? i : 5 - i] = 1;
  const name = (waxing ? WAXING : WANING)[solid];
  return { name, zh: HEXAGRAMS[name].zh, ar: HEXAGRAMS[name].ar, lines, solid, waxing };
}
