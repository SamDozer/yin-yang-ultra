// texts.js - classical passages as data. A passage ships only when verified === true.
// Verified against Chinese Wikisource (zh.wikisource.org): 周易/繫辭上, 道德經 (王弼本), 太極圖說 and 太極圖說述解.
export const PASSAGES = [
  {
    id: 'wuji', movement: 0, verified: true,
    zh: '無極而太極',
    ar: 'من اللاقطب ينبثق القطب الأعظم',
    note: 'قبل الانقسام لا شيء يُرى؛ ومن هذا الفراغ يبدأ كل شيء.',
    source: { book: '周敦頤 · 太極圖說', chapter: 'الجملة الأولى' }
  },
  {
    id: 'taiji', movement: 1, verified: true,
    zh: '太極動而生陽，動極而靜，靜而生陰，靜極復動',
    ar: 'القطب الأعظم يتحرك فيلد اليانغ؛ وإذا بلغت الحركة منتهاها سكن، وبالسكون يلد الين؛ وإذا بلغ السكون منتهاه عاد فتحرّك.',
    note: 'الحركة والسكون ليسا ضدّين متخاصمين، بل نفَسٌ واحد.',
    source: { book: '周敦頤 · 太極圖說', chapter: 'الفقرة الأولى' }
  },
  {
    id: 'sixiang', movement: 2, verified: true,
    zh: '易有太極，是生兩儀，兩儀生四象，四象生八卦',
    ar: 'في التغيّر قطبٌ أعظم يلد الصورتين، والصورتان تلدان الصور الأربع، والأربع تلد الرموز الثمانية.',
    note: 'اليانغ والين يتفرّعان إلى أطوارٍ أربعة: ناشئ وأعظم لكلٍّ منهما.',
    source: { book: '易經 · 繫辭上', chapter: 'الفصل 11' }
  },
  {
    id: 'reversal-dao', movement: 3, verified: true,
    zh: '反者道之動',
    ar: 'الرجوع هو حركة الداو.',
    note: 'ما يبلغ منتهاه يعود؛ هذه هي الحركة الدائمة للطريق.',
    source: { book: '道德經', chapter: 'الفصل 40' }
  },
  {
    id: 'return-yijing', movement: 4, verified: true,
    zh: '一陰一陽之謂道',
    ar: 'ين واحد ويانغ واحد: ذلك هو الداو.',
    note: 'الطريق ليس أحدهما، بل تعاقبهما.',
    source: { book: '易經 · 繫辭上', chapter: 'الفصل 5' }
  },
  {
    id: 'return-dao', movement: 4, verified: true,
    zh: '萬物負陰而抱陽',
    ar: 'الكائنات تحمل الين على ظهورها وتحتضن اليانغ.',
    note: 'كل شيء يحمل نقيضه في داخله.',
    source: { book: '道德經', chapter: 'الفصل 42' }
  },
  {
    id: 'wuwei', movement: 5, verified: true,
    zh: '無為而無不為',
    ar: 'بلا تكلّف، وليس شيء بلا إنجاز.',
    note: 'اترك اليدين؛ فالاتزان يعود وحده.',
    source: { book: '道德經', chapter: 'الفصل 37' }
  }
];

export const FOUR_IMAGES_LABELS = {
  balance: { zh: '和', ar: 'اتزان' },
  youngYang: { zh: '少陽', ar: 'اليانغ الناشئ' },
  oldYang: { zh: '太陽', ar: 'اليانغ الأعظم' },
  youngYin: { zh: '少陰', ar: 'الين الناشئ' },
  oldYin: { zh: '太陰', ar: 'الين الأعظم' }
};
