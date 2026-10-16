// A visual appears only at a scripted reveal. `week` is the zero-based state.week.
export const STORY_VISUALS = {
  ink: {
    id: 'ink', art: 'story-ink', title: '画框外的墨钟',
    caption: '旧纸说：只记画像愿意留下的事。', motion: 'ink', focus: [85, 54]
  },
  ledger: {
    id: 'ledger', art: 'story-ledger', title: '被截断的撤回令',
    caption: '羽毛笔写出被截断的撤回指令。', motion: 'gear', focus: [84, 28]
  },
  leaves: {
    id: 'leaves', art: 'story-leaves', title: '银叶藤的叶片',
    caption: '试验卡提醒：旧副本不能盖住原画。', motion: 'leaves', focus: [50, 24]
  },
  letter: {
    id: 'letter', art: 'story-letter', title: '雨斑里的抢修信',
    caption: '雷暴打断回返环，旧档必须停录。', motion: 'letter', focus: [52, 48]
  },
  mirror: {
    id: 'mirror', art: 'story-mirror', title: '水镜里的擦痕',
    caption: '她签过名，也在三年后亲手改画。', motion: 'ripple', focus: [50, 53]
  },
  ring: {
    id: 'ring', art: 'story-ring', title: '钟舌下的空拍',
    caption: '裂环跳过等待，把沉默也当许可。', motion: 'ring', focus: [51, 52]
  },
  finale: {
    id: 'finale', art: 'story-finale', title: '守钟咒现身',
    caption: '它举起长杖，用洛岚的声音施咒。', motion: 'bell', focus: [51, 49]
  },
  endingTogether: {
    id: 'endingTogether', art: 'ending-together', title: '钟声前的回答',
    caption: '六段节拍归位，画像自己决定何时开口。', motion: 'sunrise', focus: [50, 50]
  },
  endingArchive: {
    id: 'endingArchive', art: 'ending-archive', title: '星图柜开放',
    caption: '旧档按日期封存，画像自己挑回哪页。', motion: 'archive', focus: [50, 50]
  },
  endingDawn: {
    id: 'endingDawn', art: 'ending-dawn', title: '海重新画起',
    caption: '旧声散去，老妇人在画里添上新海。', motion: 'fireflies', focus: [50, 50]
  },
  endingSilence: {
    id: 'endingSilence', art: 'ending-silence', title: '钟室暂时安静',
    caption: '备用咒封住铜环，遗失的片段仍待找回。', motion: 'quiet', focus: [50, 50]
  }
};

// Journal images, indexed by the same zero-based week as state.week.
export const WEEK_VISUALS = [
  'story-ink', 'story-ledger', 'story-leaves',
  'story-letter', 'story-mirror', 'story-ring'
];

export const ENDING_VISUALS = {
  together: 'ending-together',
  archive: 'ending-archive',
  dawn: 'ending-dawn',
  silence: 'ending-silence'
};

// Intervals are inclusive. Early appearances reuse an image with the caption
// appropriate to what has already happened, without revealing later clues.
// No scene text or object identity is inspected.
const WEEK_REVEALS = [
  [
    { next: 'choice', first: 3, last: 4, id: 'ink',
      title: '画框外的墨钟', caption: '墨从画框流出，慢慢绕成钟形。' },
    { next: 'choice', first: 9, last: 9, id: 'ink',
      caption: '六个针孔亮起，旧纸从钟纹中出现。' },
    { next: 'battle', first: 0, last: 2, id: 'ink' }
  ],
  [
    { next: 'choice', first: 3, last: 8, id: 'ledger',
      title: '守着空行的铁甲', caption: '空名册和守门铁甲连着同一道钟纹。' },
    { next: 'battle', first: 0, last: 2, id: 'ledger' }
  ],
  [
    { next: 'choice', first: 1, last: 5, id: 'leaves',
      title: '叶片里的两段往事', caption: '海边与城堡在银色叶片中轮流亮起。' },
    { next: 'battle', first: 0, last: 2, id: 'leaves' }
  ],
  [{ next: 'choice', first: 4, last: 6, id: 'letter' }],
  [
    { next: 'choice', first: 3, last: 4, id: 'mirror',
      title: '画家改过的画', caption: '画家改过画，水镜却只记得旧版。' },
    { next: 'choice', first: 9, last: 9, id: 'mirror',
      caption: '画家改过画，水镜却只记得旧版。' },
    { next: 'battle', first: 0, last: 2, id: 'mirror' }
  ],
  [
    { next: 'battle', first: 1, last: 2, id: 'ring' },
    { next: 'night', first: 0, last: 2, id: 'ring' }
  ]
];

export function visualForScene({ week, sceneNext, line, scene, isFinal, ending } = {}) {
  if (ending && Object.hasOwn(ENDING_VISUALS, ending)
      && (sceneNext === undefined || sceneNext === 'ending')) {
    const key = `ending${ending[0].toUpperCase()}${ending.slice(1)}`;
    return STORY_VISUALS[key];
  }

  if (!Number.isInteger(line) || line < 0) return null;
  if (scene !== undefined && (!Array.isArray(scene) || line >= scene.length)) return null;

  if (isFinal) {
    return sceneNext === 'final-battle' && line >= 3 && line <= 5
      ? STORY_VISUALS.finale
      : null;
  }

  if (!Number.isInteger(week) || week < 0 || week >= WEEK_REVEALS.length) return null;
  const reveal = WEEK_REVEALS[week].find(
    ({ next, first, last }) => sceneNext === next && line >= first && line <= last
  );
  if (!reveal) return null;
  const base = STORY_VISUALS[reveal.id];
  return reveal.title || reveal.caption
    ? { ...base, title: reveal.title ?? base.title, caption: reveal.caption ?? base.caption }
    : base;
}
