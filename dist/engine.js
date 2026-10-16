// 原创规则实现。战斗状态仅含 JSON 数据，可安全存档与恢复。
export const COURSES = [
  { id: 'charms', name: '魔咒学', icon: '✦', description: '用连续光束拆除护盾，以星光攻破回声。', color: '#d8b56c', spellIds: ['quillVolley', 'lanternLance', 'constellation'] },
  { id: 'defence', name: '黑魔法防御术', icon: '◇', description: '逐层构筑屏障，保护同伴，寻找反击时机。', color: '#9ebbd8', spellIds: ['silverVeil', 'reboundSigil', 'bastion'] },
  { id: 'potions', name: '魔药学', icon: '⚗', description: '治疗伤势、持续恢复魔力，支持持久战。', color: '#a7c597', spellIds: ['mendingDraught', 'moonDew', 'phoenixTonic'] },
  { id: 'runes', name: '古代如尼文', icon: 'ᚱ', description: '洞察弱点、汲取魔力，把积蓄化作一次强攻。', color: '#b7a0d0', spellIds: ['reveal', 'resonance', 'memoryRupture'] },
  { id: 'creatures', name: '神奇动物保护', icon: '❧', description: '用飞蛾分散护盾，以耐心安抚受惊的回声。', color: '#89bdb1', spellIds: ['softWhistle', 'mothSwarm', 'oathSong'] },
];

const spell = (id, name, course, level, cost, type, target, description, extra = {}) => ({ id, name, course, level, cost, type, target, description, ...extra });
export const SPELLS = {
  spark: spell('spark', '荧光火花', 'charms', 0, 4, 'damage', 'enemy', '造成 8 点光属性伤害；命中护盾时消耗 1 层。', { power: 8, hits: 1, element: 'light' }),
  shield: spell('shield', '基础护身咒', 'defence', 0, 5, 'barrier', 'ally', '为一名同伴增加 2 层护盾。每次命中只消耗 1 层，伤害被完全抵消。', { power: 2, element: 'moon' }),
  quillVolley: spell('quillVolley', '飞羽连咒', 'charms', 1, 6, 'damage', 'enemy', '连续命中 3 次，每次 4 点光属性伤害；适合拆除多层护盾。', { power: 4, hits: 3, element: 'light' }),
  lanternLance: spell('lanternLance', '明灯长矛', 'charms', 2, 8, 'damage', 'enemy', '造成 23 点光属性伤害。先用连击打掉护盾再施放更有效。', { power: 23, hits: 1, element: 'light' }),
  constellation: spell('constellation', '群星接力', 'charms', 3, 12, 'damage', 'enemy', '连续命中 5 次，每次 7 点光属性伤害。', { power: 7, hits: 5, element: 'light' }),
  silverVeil: spell('silverVeil', '银雾屏障', 'defence', 1, 6, 'barrier', 'ally', '为一名同伴增加 3 层月属性护盾。护盾最多 7 层。', { power: 3, element: 'moon' }),
  reboundSigil: spell('reboundSigil', '回响守护', 'defence', 2, 8, 'barrier', 'ally', '增加 3 层护盾；接下来两回合每层被击碎时向敌人反击 5 点伤害。', { power: 3, element: 'moon', reflect: 5, duration: 2 }),
  bastion: spell('bastion', '不熄壁垒', 'defence', 3, 11, 'barrier', 'ally', '增加 6 层护盾，并恢复目标 8 点生命。护盾最多 7 层。', { power: 6, heal: 8, element: 'moon' }),
  mendingDraught: spell('mendingDraught', '愈合药剂', 'potions', 1, 6, 'heal', 'ally', '恢复一名同伴 26 点生命，也能唤醒倒下的同伴。', { power: 26 }),
  moonDew: spell('moonDew', '月露回流', 'potions', 2, 5, 'regen', 'ally', '接下来 3 次回合结束时额外恢复 4 点魔力；重复施放刷新持续时间。', { power: 4, duration: 3 }),
  phoenixTonic: spell('phoenixTonic', '曙羽复苏剂', 'potions', 3, 10, 'heal', 'ally', '恢复 46 点生命、4 点魔力，并清除易伤状态，也能唤醒倒下的同伴。', { power: 46, mana: 4, cleanse: true }),
  reveal: spell('reveal', '显迹符文', 'runes', 1, 3, 'sense', 'enemy', '使敌人在接下来两回合多受 25% 伤害，适合在强攻前施放。', { power: 1.25, duration: 2 }),
  resonance: spell('resonance', '魔力共振', 'runes', 2, 7, 'drain', 'enemy', '造成 18 点符文伤害；命中生命后恢复施法者 5 点魔力。', { power: 18, hits: 1, mana: 5, element: 'rune' }),
  memoryRupture: spell('memoryRupture', '记忆解结', 'runes', 3, 0, 'burst', 'enemy', '消耗全部当前魔力，造成每点魔力 2.4 点符文伤害。只有一次命中，会被一层护盾抵消。', { power: 2.4, hits: 1, element: 'rune' }),
  softWhistle: spell('softWhistle', '低语安抚', 'creatures', 1, 4, 'pact', 'enemy', '敌人生命不高于 36% 且没有护盾时，必定缔结回声之约。失败也会消耗魔力。', { power: 0.36, maxBarrier: 0 }),
  mothSwarm: spell('mothSwarm', '引路飞蛾', 'creatures', 2, 7, 'damage', 'enemy', '引来 4 只飞蛾，每次造成 4 点自然属性伤害。', { power: 4, hits: 4, element: 'nature' }),
  oathSong: spell('oathSong', '共鸣之歌', 'creatures', 3, 8, 'pact', 'enemy', '敌人生命不高于 55% 且护盾不多于 1 层时，必定缔结回声之约。', { power: 0.55, maxBarrier: 1 }),
  companionStrike: spell('companionStrike', '青焰划击', 'defence', 0, 4, 'damage', 'enemy', '艾琳的基础咒语，造成 9 点月属性伤害。', { power: 9, hits: 1, element: 'moon' }),
  quietWord: spell('quietWord', '放下戒心', 'creatures', 0, 4, 'pact', 'enemy', '艾琳尝试安抚：敌人生命不高于 22% 且没有护盾时，必定缔结回声之约。', { power: 0.22, maxBarrier: 0 }),
};

const action = (type, label, description, power = 0, hits = 1, target = 'weakest', extra = {}) => ({ type, label, description, power, hits, target, ...extra });
const enemy = (id, name, description, hp, mana, regen, barrier, attack, element, weakness, art, pattern) => ({ id, name, description, hp, mana, regen, barrier, attack, element, weakness, intent: pattern[0].description, art, pactable: true, pattern });
export const ENEMIES = {
  inkshade: enemy('inkshade', '漏页墨影', '从画像空白处淌下的墨色回声。它把陌生的脚步当成了擦除自己的橡皮。', 88, 22, 4, 2, 9, 'ink', 'light', 'shade', [
    action('attack', '墨滴落下', '下一回合：攻击生命较低的一人 1 次，造成 9 点伤害。', 9),
    action('barrier', '折页藏身', '下一回合：为自身增加 2 层护盾。', 2),
    action('attack', '墨线追索', '下一回合：攻击生命较低的一人 2 次，每次造成 6 点伤害。', 6, 2),
  ]),
  armour: enemy('armour', '守夜空铠', '一副忘记守护对象的旧盔甲，依旧认真执行最后一条巡逻命令。', 112, 28, 4, 3, 12, 'metal', 'rune', 'armour', [
    action('attack', '长戟点名', '下一回合：攻击生命较低的一人 2 次，每次造成 7 点伤害。', 7, 2),
    action('barrier', '列队防守', '下一回合：为自身增加 3 层护盾。', 3),
    action('sweep', '回廊横扫', '下一回合：分别攻击两人 1 次，每次造成 12 点伤害。', 12, 1, 'all'),
    action('rest', '聆听口令', '下一回合：盔甲停下来辨认远处的钟声。'),
  ]),
  wisp: enemy('wisp', '温室游灯', '被关在旧灯罩里的记忆，害怕所有可能熄灭它的风。', 130, 34, 5, 2, 13, 'light', 'moon', 'wisp', [
    action('drain', '冷光汲流', '下一回合：从两人各汲取 4 点魔力，并各造成 5 点伤害。', 4, 1, 'all', { damage: 5 }),
    action('sweep', '碎光飞散', '下一回合：分别攻击两人 2 次，每次造成 5 点伤害。', 5, 2, 'all'),
    action('regen', '余温聚拢', '下一回合：恢复 14 点生命。', 14),
    action('rest', '灯芯摇晃', '下一回合：游灯的火焰短暂停歇。'),
  ]),
  roots: enemy('roots', '缠忆根须', '一株听过太多秘密的古树，正在把所有旧事结成不肯松开的绳结。', 150, 32, 5, 3, 14, 'nature', 'light', 'warden', [
    action('attack', '根须缠握', '下一回合：攻击生命较低的一人 3 次，每次造成 5 点伤害。', 5, 3),
    action('barrier', '树皮重叠', '下一回合：为自身增加 2 层护盾。', 2),
    action('regen', '旧梦滋养', '下一回合：恢复 17 点生命。', 17),
    action('sweep', '叶雨倾落', '下一回合：分别攻击两人 1 次，每次造成 14 点伤害。', 14, 1, 'all'),
  ]),
  mirror: enemy('mirror', '镜中陌客', '镜面里的影子借来熟悉的声音，却始终记不起自己的姓名。', 170, 40, 6, 3, 16, 'mirror', 'nature', 'shade', [
    action('sweep', '双影照面', '下一回合：分别攻击两人 2 次，每次造成 7 点伤害。', 7, 2, 'all'),
    action('drain', '借名回声', '下一回合：从两人各汲取 5 点魔力，并各造成 6 点伤害。', 5, 1, 'all', { damage: 6 }),
    action('barrier', '镜面合拢', '下一回合：为自身增加 3 层护盾。', 3),
    action('rest', '名字的间隙', '下一回合：镜中陌客迟疑，暂不攻击。'),
  ]),
  sentinel: enemy('sentinel', '观星台守望者', '留在废弃观星台的最后一道守护咒。它守护的不是门，而是一场没有完成的告别。', 195, 46, 6, 4, 18, 'moon', 'rune', 'armour', [
    action('attack', '星轨连击', '下一回合：攻击生命较低的一人 3 次，每次造成 7 点伤害。', 7, 3),
    action('sweep', '钟影横掠', '下一回合：分别攻击两人 1 次，每次造成 18 点伤害。', 18, 1, 'all'),
    action('barrier', '观测者护环', '下一回合：为自身增加 3 层护盾。', 3),
    action('regen', '旧誓回响', '下一回合：恢复 15 点生命。', 15),
  ]),
  bellkeeper: enemy('bellkeeper', '断钟守忆人', '无数不愿被遗忘的声音汇成了守钟之影。它等待一个能让记忆继续生长的回答。', 245, 58, 7, 5, 19, 'memory', 'rune', 'warden', [
    action('sweep', '破晓前的钟声', '下一回合：分别攻击两人 2 次，每次造成 8 点伤害。', 8, 2, 'all'),
    action('drain', '空白潮汐', '下一回合：从两人各汲取 5 点魔力，并各造成 7 点伤害。', 5, 1, 'all', { damage: 7 }),
    action('barrier', '封存的誓言', '下一回合：为自身增加 4 层护盾。', 4),
    action('attack', '最后一次挽留', '下一回合：攻击生命较低的一人 3 次，每次造成 9 点伤害。', 9, 3),
    action('rest', '等待回答', '下一回合：守忆人停下攻势，等待你们作出选择。'),
  ]),
};

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const numeric = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const MAX_LOG = 180;
function log(battle, message) { battle.log.push(message); if (battle.log.length > MAX_LOG) battle.log.splice(0, battle.log.length - MAX_LOG); }
function result(battle, ok, message) { return { battle, ok, message }; }
function failure(battle, message) { return result(clone(battle), false, message); }
function getActor(battle, id) { return battle.actors.find(actor => actor.id === id); }
function finish(battle) {
  if (battle.enemy.hp <= 0) { battle.enemy.hp = 0; battle.status = 'victory'; }
  else if (battle.actors.every(actor => actor.hp <= 0)) battle.status = 'defeat';
}

export function createCampaign() {
  return { version: 1, week: 0, phase: 'intro', line: 0, stats: { bond: 0, insight: 0, courage: 0 }, courses: Object.fromEntries(COURSES.map(course => [course.id, 0])), potions: 2, results: [], journal: [], history: [], unlockedEndings: [], difficulty: 'normal' };
}

export function applyEffects(state, effects = {}) {
  const next = clone(state);
  next.stats ||= { bond: 0, insight: 0, courage: 0 };
  for (const key of ['bond', 'insight', 'courage']) {
    if (effects[key] !== undefined) next.stats[key] = clamp(numeric(next.stats[key]) + numeric(effects[key]), 0, 30);
  }
  if (effects.potions !== undefined) next.potions = clamp(numeric(next.potions) + numeric(effects.potions), 0, 9);
  return next;
}

export function study(state, courseIds) {
  if (!Array.isArray(courseIds) || courseIds.length !== 2 || new Set(courseIds).size !== 2 || courseIds.some(id => !COURSES.some(course => course.id === id))) {
    throw new RangeError('每周请选择两门不同的有效课程。');
  }
  const next = clone(state);
  next.courses ||= {};
  const lessons = courseIds.map(id => {
    const course = COURSES.find(item => item.id === id);
    const oldLevel = clamp(numeric(next.courses[id]), 0, 3);
    const level = Math.min(3, oldLevel + 1);
    next.courses[id] = level;
    return { course: clone(course), level, spell: clone(SPELLS[course.spellIds[level - 1]]), newSpell: level > oldLevel };
  });
  return { state: next, lessons };
}

export function learnedSpells(state, actorId) {
  let ids;
  if (actorId === 'player') {
    ids = ['spark', 'shield'];
    for (const course of COURSES) ids.push(...course.spellIds.slice(0, clamp(numeric(state.courses?.[course.id]), 0, 3)));
  } else if (actorId === 'companion') {
    ids = ['companionStrike', 'silverVeil', 'mendingDraught', 'quietWord'];
    if (numeric(state.week) >= 2) ids.push('reboundSigil');
    if (numeric(state.week) >= 4) ids.push('moonDew', 'phoenixTonic');
  } else return [];
  return [...new Set(ids)].map(id => clone(SPELLS[id]));
}

export function createBattle(state, enemyId) {
  const definition = ENEMIES[enemyId];
  if (!definition) throw new RangeError('找不到这段回声。');
  const week = clamp(numeric(state.week), 0, 6);
  const scale = state.difficulty === 'easy' ? 0.82 : state.difficulty === 'hard' ? 1.16 : 1;
  const playerMax = 66 + week * 4;
  const companionMax = 74 + week * 4;
  const makeActor = (id, name, maxHp, maxMana, regen) => ({ id, name, hp: maxHp, maxHp, mana: Math.min(maxMana, regen), maxMana, regen, barrier: 0, shieldElement: null, status: {}, learnedSpellIds: learnedSpells(state, id).map(item => item.id) });
  const foe = clone(definition);
  foe.maxHp = Math.round(foe.hp * scale);
  foe.hp = foe.maxHp;
  foe.maxMana = foe.mana;
  foe.attack = Math.round(foe.attack * scale);
  foe.pattern = foe.pattern.map(item => ({ ...item, power: ['attack', 'sweep'].includes(item.type) ? Math.round(item.power * scale) : item.power, damage: item.damage ? Math.round(item.damage * scale) : undefined }));
  // 保证 undefined 不会进入持久化状态。
  foe.pattern = clone(foe.pattern);
  foe.patternIndex = 0;
  foe.intent = clone(foe.pattern[0]);
  foe.status = {};
  foe.sensed = false;
  foe.shieldElement = foe.element;
  const battle = { round: 1, active: 'player', actors: [makeActor('player', '洛岚', playerMax, 24 + Math.floor(week / 2) * 2, 8), makeActor('companion', '艾琳·维尔', companionMax, 24 + Math.floor(week / 2) * 2, 8)], enemy: foe, log: [], status: 'active', potions: clamp(numeric(state.potions, 2), 0, 9), sourceWeek: week, resolved: false, resolutionId: `${week}:${enemyId}`, pact: false };
  log(battle, `${foe.name}挡住了去路。两人可轮流施法，魔力不足时结束回合。`);
  return battle;
}

function damageTarget(battle, target, power, element, source = null) {
  if (target.hp <= 0) return { damage: 0, blocked: false };
  if (target.barrier > 0) {
    target.barrier -= 1;
    // 只有显式的护盾状态允许按同属性回蓝；普通护盾无此效果。
    if (target.status?.shieldRefund && target.shieldElement === element && target.maxMana) target.mana = Math.min(target.maxMana, target.mana + target.status.shieldRefund);
    if (source && target.status?.reflect && target.status.reflectTurns > 0) {
      source.hp = Math.max(0, source.hp - target.status.reflect);
      log(battle, `${target.name}的守护反击造成 ${target.status.reflect} 点伤害。`);
    }
    return { damage: 0, blocked: true };
  }
  const weak = target.weakness === element ? 1.5 : 1;
  const vulnerable = target.status?.vulnerableTurns > 0 ? numeric(target.status.vulnerable, 1) : 1;
  const damage = Math.max(1, Math.round(power * weak * vulnerable));
  target.hp = Math.max(0, target.hp - damage);
  return { damage, blocked: false };
}

export function castSpell(battle, actorId, spellId, targetId, options = {}) {
  if (battle.status !== 'active') return failure(battle, '这场交锋已经结束。');
  const originalActor = getActor(battle, actorId);
  const magic = SPELLS[spellId];
  if (!originalActor) return failure(battle, '请选择有效的施法者。');
  if (originalActor.hp <= 0) return failure(battle, '倒下的同伴暂时无法施法。');
  if (!magic || !originalActor.learnedSpellIds?.includes(spellId)) return failure(battle, '这名角色还没有掌握此咒语。');
  const resolvedId = targetId ?? (magic.target === 'enemy' ? 'enemy' : actorId);
  const isEnemy = resolvedId === 'enemy' || resolvedId === battle.enemy.id;
  const originalTarget = isEnemy ? battle.enemy : getActor(battle, resolvedId);
  if (!originalTarget || (magic.target === 'enemy' && !isEnemy) || (magic.target === 'ally' && isEnemy) || (magic.target === 'self' && resolvedId !== actorId)) return failure(battle, '这个咒语不能对该目标使用。');
  if (originalTarget.hp <= 0 && magic.type !== 'heal') return failure(battle, '该目标已经倒下。');
  const cost = magic.type === 'burst' ? originalActor.mana : magic.cost;
  if (originalActor.mana < cost || (magic.type === 'burst' && cost < 1)) return failure(battle, '魔力不足；可以换另一人施法，或结束回合恢复魔力。');

  const next = clone(battle);
  const actor = getActor(next, actorId);
  const target = isEnemy ? next.enemy : getActor(next, resolvedId);
  next.active = actorId;
  actor.mana -= cost;
  let message;
  if (['damage', 'drain', 'burst'].includes(magic.type)) {
    let total = 0; let stripped = 0;
    for (let index = 0; index < (magic.hits || 1) && target.hp > 0; index += 1) {
      const hit = damageTarget(next, target, magic.type === 'burst' ? magic.power * cost : magic.power, magic.element, actor);
      total += hit.damage; stripped += Number(hit.blocked);
    }
    if (magic.type === 'drain' && total > 0) actor.mana = Math.min(actor.maxMana, actor.mana + magic.mana);
    message = `${actor.name}施放「${magic.name}」：${stripped ? `拆除 ${stripped} 层护盾` : ''}${stripped && total ? '，' : ''}${total ? `造成 ${total} 点伤害` : stripped ? '' : '回声没有受到伤害'}。`;
  } else if (magic.type === 'barrier') {
    const gained = Math.min(7 - target.barrier, magic.power);
    target.barrier = Math.min(7, target.barrier + magic.power);
    target.shieldElement = magic.element || null;
    if (magic.reflect) { target.status.reflect = magic.reflect; target.status.reflectTurns = magic.duration; }
    if (magic.heal) target.hp = Math.min(target.maxHp, target.hp + magic.heal);
    message = `${actor.name}施放「${magic.name}」，为${target.name}增加 ${gained} 层护盾${magic.heal ? `并恢复 ${magic.heal} 点生命` : ''}。`;
  } else if (magic.type === 'heal') {
    const before = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + magic.power);
    if (magic.mana) target.mana = Math.min(target.maxMana, target.mana + magic.mana);
    if (magic.cleanse) { delete target.status.vulnerable; delete target.status.vulnerableTurns; }
    message = `${actor.name}使用「${magic.name}」，${target.name}恢复 ${target.hp - before} 点生命。`;
  } else if (magic.type === 'regen') {
    target.status.manaRegen = magic.power;
    target.status.manaRegenTurns = magic.duration;
    message = `${target.name}获得「${magic.name}」，接下来 ${magic.duration} 回合额外恢复 ${magic.power} 点魔力。`;
  } else if (magic.type === 'sense') {
    next.enemy.sensed = true;
    next.enemy.status.vulnerable = magic.power;
    next.enemy.status.vulnerableTurns = magic.duration;
    message = `显迹符文照出了弱点：${next.enemy.name}接下来 ${magic.duration} 回合多受 25% 伤害；低生命、少护盾时可以安抚。`;
  } else if (magic.type === 'pact') {
    const hpThreshold = Math.floor(target.maxHp * magic.power);
    const layersAllowed = magic.maxBarrier || 0;
    const success = target.pactable && target.hp <= hpThreshold && target.barrier <= layersAllowed;
    if (success) { next.status = 'pact'; next.pact = true; }
    message = success ? `${actor.name}以「${magic.name}」回应了${target.name}。它放下戒备，回声之约缔结。` : `安抚尚未成功：需要敌人生命不高于 ${hpThreshold}、护盾不多于 ${layersAllowed} 层。`;
  }
  log(next, message);
  if (next.status === 'active') finish(next);
  if (next.status === 'victory') log(next, `${next.enemy.name}的执念消散，回声被找回了。`);
  return result(next, true, message);
}

export function usePotion(battle, actorId) {
  if (battle.status !== 'active') return failure(battle, '这场交锋已经结束。');
  if (!getActor(battle, actorId)) return failure(battle, '请选择有效的同伴。');
  if (battle.potions <= 0) return failure(battle, '应急药剂已经用完了。');
  const next = clone(battle);
  const actor = getActor(next, actorId);
  const oldHp = actor.hp; const oldMana = actor.mana;
  actor.hp = Math.min(actor.maxHp, actor.hp + 34);
  actor.mana = Math.min(actor.maxMana, actor.mana + 12);
  next.potions -= 1;
  const message = `${actor.name}饮下应急药剂，恢复 ${actor.hp - oldHp} 点生命、${actor.mana - oldMana} 点魔力。`;
  log(next, message);
  return result(next, true, message);
}

function expireStatus(target) {
  for (const [turns, amount] of [['manaRegenTurns', 'manaRegen'], ['vulnerableTurns', 'vulnerable'], ['reflectTurns', 'reflect']]) {
    if (target.status[turns] > 0) target.status[turns] -= 1;
    if (target.status[turns] === 0) { delete target.status[turns]; delete target.status[amount]; }
  }
}

export function endRound(battle) {
  if (battle.status !== 'active') return failure(battle, '这场交锋已经结束。');
  const next = clone(battle);
  const foe = next.enemy;
  const intent = foe.intent;
  const living = next.actors.filter(actor => actor.hp > 0);
  const weak = [...living].sort((a, b) => a.hp - b.hp || a.id.localeCompare(b.id))[0];
  if (!weak) { next.status = 'defeat'; return result(next, true, '两人都已倒下，可以接受援助后重试。'); }
  if (['attack', 'sweep', 'drain'].includes(intent.type)) {
    const targets = intent.target === 'all' ? living : [weak];
    for (const target of targets) {
      let total = 0; let stripped = 0;
      if (intent.type === 'drain') target.mana = Math.max(0, target.mana - intent.power);
      for (let index = 0; index < intent.hits && target.hp > 0 && foe.hp > 0; index += 1) {
        const hit = damageTarget(next, target, intent.type === 'drain' ? (intent.damage || 0) : intent.power, foe.element, foe);
        total += hit.damage; stripped += Number(hit.blocked);
      }
      log(next, `${foe.name}使用「${intent.label}」：${target.name}${stripped ? `失去 ${stripped} 层护盾` : ''}${stripped && total ? '，' : ''}${total ? `受到 ${total} 点伤害` : stripped ? '' : '避开了伤害'}${intent.type === 'drain' ? `，流失至多 ${intent.power} 点魔力` : ''}。`);
    }
  } else if (intent.type === 'barrier') {
    const gained = Math.min(7 - foe.barrier, intent.power);
    foe.barrier += gained;
    log(next, `${foe.name}使用「${intent.label}」，增加 ${gained} 层护盾。`);
  } else if (intent.type === 'regen') {
    const before = foe.hp; foe.hp = Math.min(foe.maxHp, foe.hp + intent.power);
    log(next, `${foe.name}使用「${intent.label}」，恢复 ${foe.hp - before} 点生命。`);
  } else log(next, `${foe.name}暂时停下了攻势。`);
  finish(next);
  if (next.status === 'active') {
    for (const actor of next.actors) {
      if (actor.hp > 0) actor.mana = Math.min(actor.maxMana, actor.mana + actor.regen + (actor.status.manaRegenTurns > 0 ? actor.status.manaRegen : 0));
      expireStatus(actor);
    }
    expireStatus(foe);
    foe.mana = Math.min(foe.maxMana, foe.mana + foe.regen);
    foe.patternIndex = (foe.patternIndex + 1) % foe.pattern.length;
    foe.intent = clone(foe.pattern[foe.patternIndex]);
    next.round += 1;
    next.active = next.actors.find(actor => actor.hp > 0)?.id || 'player';
    log(next, `第 ${next.round} 回合：仍站立的同伴已恢复魔力。`);
  } else if (next.status === 'defeat') log(next, '你们暂时退回亮着灯的走廊。教授的援助让这次失利不必成为终点。');
  else if (next.status === 'victory') log(next, '守护咒的回响驱散了敌人的最后一丝执念。');
  return result(next, true, next.status === 'defeat' ? '暂时失利；可以接受援助重试或继续。' : '敌方行动结束。');
}

export function resolveBattle(state, battle) {
  if (!['victory', 'pact', 'defeat'].includes(battle.status)) throw new RangeError('交锋尚未结束，不能结算。');
  const next = clone(state);
  next.results ||= [];
  // 重复结算同一周同一敌人不会重复发放奖励；失败后的成功重试会替换记录。
  const key = battle.resolutionId || `${battle.sourceWeek ?? state.week}:${battle.enemy.id}`;
  const previous = next.results.find(item => item.key === key);
  if (previous?.outcome !== 'defeat' && previous) return next;
  next.potions = clamp(numeric(battle.potions), 0, 9);
  const record = { key, week: battle.sourceWeek ?? state.week, enemyId: battle.enemy.id, outcome: battle.status, rounds: battle.round };
  if (previous) next.results[next.results.indexOf(previous)] = record;
  else next.results.push(record);
  if (battle.status === 'defeat') {
    next.recovery = { enemyId: battle.enemy.id, week: record.week, canRetry: true, assisted: true };
    // 援助保证没有药剂、任意课程路线都仍能重新尝试。
    next.potions = Math.max(1, next.potions);
    return next;
  }
  delete next.recovery;
  return applyEffects(next, battle.status === 'pact' ? { bond: 1, insight: 1 } : { courage: 1 });
}

export function chooseEnding(state) {
  const stats = state.stats || {};
  if (numeric(stats.bond) >= 6 && numeric(stats.insight) >= 4) return 'together';
  if (numeric(stats.insight) >= 6) return 'archive';
  if (numeric(stats.courage) >= 4) return 'dawn';
  return 'silence';
}
