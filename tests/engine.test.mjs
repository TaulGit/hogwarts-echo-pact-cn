import test from 'node:test';
import assert from 'node:assert/strict';
import { COURSES, SPELLS, ENEMIES, createCampaign, applyEffects, study, learnedSpells, createBattle, castSpell, usePotion, endRound, resolveBattle, chooseEnding } from '../dist/engine.js';
import { WEEKS } from '../dist/content.js';

const copy = value => JSON.parse(JSON.stringify(value));
function trained(ids, level = 3, week = 0) {
  let state = createCampaign();
  state.week = week;
  for (let index = 0; index < level; index += 1) state = study(state, ids).state;
  return state;
}
function cast(battle, actor, spell, target = 'enemy') {
  const response = castSpell(battle, actor, spell, target);
  assert.equal(response.ok, true, response.message);
  return response.battle;
}

test('课程安排只接受两门不同的有效课程，最高三级且保持输入不变', () => {
  const state = createCampaign();
  for (const invalid of [[], ['charms'], ['charms', 'charms'], ['charms', 'unknown'], ['charms', 'defence', 'runes'], null]) {
    assert.throws(() => study(state, invalid), RangeError);
  }
  let next = state;
  for (let index = 0; index < 4; index += 1) {
    const response = study(next, ['charms', 'runes']);
    next = response.state;
    assert.equal(response.lessons[0].newSpell, index < 3);
  }
  assert.equal(next.courses.charms, 3);
  assert.equal(state.courses.charms, 0);
  assert.ok(learnedSpells(next, 'player').some(spell => spell.id === 'constellation'));
  assert.ok(learnedSpells(state, 'companion').some(spell => spell.type === 'heal'));
  assert.deepEqual(learnedSpells(state, 'unknown'), []);
  assert.equal(COURSES.length, 5);
  assert.ok(Object.keys(SPELLS).length >= 17);
});

test('每次命中单独移除一层护盾，多段攻击剩余命中才伤害生命', () => {
  const state = trained(['charms', 'runes']);
  const original = createBattle(state, 'inkshade');
  const single = cast(original, 'player', 'spark');
  assert.equal(single.enemy.barrier, original.enemy.barrier - 1);
  assert.equal(single.enemy.hp, original.enemy.hp);
  assert.equal(single.actors[0].mana, original.actors[0].mana - 4);
  const multi = cast(original, 'player', 'quillVolley');
  assert.equal(multi.enemy.barrier, 0);
  assert.equal(multi.enemy.hp, original.enemy.hp - 6); // 4 × 光弱点 1.5
  assert.equal(original.enemy.barrier, 2);
  assert.equal(original.actors[0].mana, 8);
});

test('同一人可以持续施法，魔力用尽后另一人仍可行动，回合结束恢复魔力', () => {
  let battle = createBattle(createCampaign(), 'bellkeeper');
  const otherMana = battle.actors[1].mana;
  assert.equal(battle.actors[0].mana, battle.actors[0].regen);
  assert.ok(battle.actors[0].mana < battle.actors[0].maxMana);
  for (let index = 0; index < 2; index += 1) battle = cast(battle, 'player', 'spark');
  assert.equal(battle.actors[0].mana, 0);
  const rejected = castSpell(battle, 'player', 'spark', 'enemy');
  assert.equal(rejected.ok, false);
  assert.equal(rejected.battle.actors[0].mana, 0);
  battle = cast(battle, 'companion', 'companionStrike');
  assert.equal(battle.actors[1].mana, otherMana - 4);
  const predicted = copy(battle.enemy.intent);
  const response = endRound(battle);
  assert.equal(response.ok, true);
  assert.equal(response.battle.actors[0].mana, 8);
  assert.equal(response.battle.round, 2);
  assert.notEqual(response.battle.enemy.intent.type, predicted.type);
  assert.equal(battle.round, 1);
});

test('非法目标、未学习技能、倒下的施法者不会扣除魔力或改变状态', () => {
  const battle = createBattle(createCampaign(), 'armour');
  for (const [actor, spell, target] of [['player', 'spark', 'player'], ['player', 'shield', 'enemy'], ['missing', 'spark', 'enemy'], ['player', 'constellation', 'enemy'], ['player', 'spark', 'missing']]) {
    const response = castSpell(battle, actor, spell, target);
    assert.equal(response.ok, false);
    assert.deepEqual(response.battle, battle);
  }
  const down = copy(battle);
  down.actors[0].hp = 0;
  assert.equal(castSpell(down, 'player', 'spark', 'enemy').ok, false);
  assert.equal(usePotion(battle, 'missing').ok, false);
});

test('护盾上限与逐击抵消正确，普通同属性破盾不会自动回蓝', () => {
  let battle = createBattle(trained(['defence', 'potions']), 'bellkeeper');
  battle.actors[0].mana = battle.actors[0].maxMana;
  battle = cast(battle, 'player', 'bastion', 'player');
  battle = cast(battle, 'player', 'silverVeil', 'player');
  assert.equal(battle.actors[0].barrier, 7);
  const before = battle.actors[0].hp;
  battle.actors[0].mana = 0;
  battle.enemy.element = 'moon';
  const ended = endRound(battle).battle;
  assert.equal(ended.actors[0].barrier, 5);
  assert.equal(ended.actors[0].hp, before);
  assert.equal(ended.actors[0].mana, 8);
});

test('持续回蓝按回合触发并到期，显迹易伤与汲取有实际作用', () => {
  let battle = createBattle(trained(['potions', 'runes']), 'armour');
  battle.actors[0].mana = battle.actors[0].maxMana;
  battle.enemy.barrier = 0;
  battle = cast(battle, 'player', 'reveal');
  assert.equal(battle.enemy.sensed, true);
  const hp = battle.enemy.hp;
  battle = cast(battle, 'player', 'resonance');
  assert.equal(hp - battle.enemy.hp, Math.round(18 * 1.5 * 1.25));
  assert.equal(battle.actors[0].mana, 19); // 24 - 3 - 7 + 5
  battle = cast(battle, 'player', 'moonDew', 'player');
  battle.actors[0].mana = 0;
  battle = endRound(battle).battle;
  assert.equal(battle.actors[0].mana, 12);
  assert.equal(battle.actors[0].status.manaRegenTurns, 2);
  battle = endRound(battle).battle;
  assert.equal(battle.enemy.status.vulnerableTurns, undefined);
  battle = endRound(battle).battle;
  assert.equal(battle.actors[0].status.manaRegenTurns, undefined);
});

test('全魔力爆发仍会被一层盾抵消，且拒绝零魔力施放', () => {
  const state = trained(['runes', 'defence']);
  const original = createBattle(state, 'bellkeeper');
  const blocked = cast(original, 'player', 'memoryRupture');
  assert.equal(blocked.actors[0].mana, 0);
  assert.equal(blocked.enemy.hp, original.enemy.hp);
  assert.equal(blocked.enemy.barrier, original.enemy.barrier - 1);
  assert.equal(castSpell(blocked, 'player', 'memoryRupture', 'enemy').ok, false);
  const clear = copy(original);
  clear.enemy.barrier = 0;
  const landed = cast(clear, 'player', 'memoryRupture');
  assert.equal(clear.enemy.hp - landed.enemy.hp, Math.round(clear.actors[0].mana * 2.4 * 1.5));
});

test('安抚由生命和护盾阈值确定，成功立即结束且不可重复行动', () => {
  const original = createBattle(trained(['creatures', 'charms']), 'inkshade');
  original.enemy.hp = 30;
  original.enemy.barrier = 1;
  const failed = cast(original, 'player', 'softWhistle');
  assert.equal(failed.status, 'active');
  assert.equal(failed.actors[0].mana, original.actors[0].mana - 4);
  const success = cast(original, 'player', 'oathSong');
  assert.equal(success.status, 'pact');
  assert.equal(success.pact, true);
  assert.equal(endRound(success).ok, false);
  assert.equal(castSpell(success, 'companion', 'companionStrike', 'enemy').ok, false);
  const hostile = copy(original);
  hostile.enemy.pactable = false;
  assert.equal(cast(hostile, 'player', 'oathSong').status, 'active');
});

test('药剂、治疗和倒地恢复遵守库存，输入状态保持不变', () => {
  const battle = createBattle(createCampaign(), 'roots');
  battle.actors[0].hp = 0;
  battle.actors[0].mana = 0;
  const healed = cast(battle, 'companion', 'mendingDraught', 'player');
  assert.equal(healed.actors[0].hp, 26);
  const potion = usePotion(battle, 'player');
  assert.equal(potion.ok, true);
  assert.equal(potion.battle.actors[0].hp, 34);
  assert.equal(potion.battle.actors[0].mana, 12);
  assert.equal(potion.battle.potions, 1);
  assert.equal(battle.potions, 2);
  const empty = copy(battle);
  empty.potions = 0;
  assert.equal(usePotion(empty, 'player').ok, false);
});

test('失败可以接受援助重试，成功结算不重复奖励，未结束不能结算', () => {
  const state = createCampaign();
  let battle = createBattle(state, 'inkshade');
  assert.throws(() => resolveBattle(state, battle), RangeError);
  battle.actors.forEach(actor => { actor.hp = 1; });
  battle.enemy.intent = { type: 'sweep', label: '测试横扫', description: '', power: 99, hits: 1, target: 'all' };
  battle.potions = 0;
  battle = endRound(battle).battle;
  assert.equal(battle.status, 'defeat');
  const assisted = resolveBattle(state, battle);
  assert.equal(assisted.recovery.canRetry, true);
  assert.equal(assisted.potions, 1);
  assert.equal(assisted.results.length, 1);
  let retried = createBattle(assisted, 'inkshade');
  assert.equal(retried.actors[0].hp, retried.actors[0].maxHp);
  retried.enemy.barrier = 0;
  retried.enemy.hp = 1;
  retried = cast(retried, 'player', 'spark');
  assert.equal(retried.status, 'victory');
  const settled = resolveBattle(assisted, retried);
  assert.equal(settled.results.length, 1);
  assert.equal(settled.results[0].outcome, 'victory');
  assert.equal(settled.stats.courage, 1);
  assert.equal(settled.recovery, undefined);
  assert.deepEqual(resolveBattle(settled, retried), settled);
});

test('四种结局都有可达条件，优先级固定，数值效果有合理上限', () => {
  const initial = createCampaign();
  assert.equal(chooseEnding(initial), 'silence');
  assert.equal(chooseEnding(applyEffects(initial, { courage: 4 })), 'dawn');
  assert.equal(chooseEnding(applyEffects(initial, { insight: 6, courage: 6 })), 'archive');
  assert.equal(chooseEnding(applyEffects(initial, { bond: 6, insight: 4, courage: 6 })), 'together');
  const capped = applyEffects(initial, { bond: 999, insight: -9, potions: 999 });
  assert.equal(capped.stats.bond, 30);
  assert.equal(capped.stats.insight, 0);
  assert.equal(capped.potions, 9);
  assert.equal(initial.stats.bond, 0);
});

// 自动策略只根据公开的状态行动：读预告、治疗/护盾、拆盾、安抚或输出。
function playBattle(state, enemyId) {
  let battle = createBattle(state, enemyId);
  for (let round = 0; round < 80 && battle.status === 'active'; round += 1) {
    for (let actionIndex = 0; actionIndex < 60 && battle.status === 'active'; actionIndex += 1) {
      const choices = [];
      for (const actor of battle.actors.filter(item => item.hp > 0)) {
        const magic = actor.learnedSpellIds.map(id => SPELLS[id]);
        for (const skill of magic) {
          if (actor.mana < skill.cost || (skill.type === 'burst' && actor.mana < 4)) continue;
          if (skill.type === 'pact' && battle.enemy.pactable && battle.enemy.hp <= Math.floor(battle.enemy.maxHp * skill.power) && battle.enemy.barrier <= (skill.maxBarrier || 0)) choices.push({ score: 1000, actor: actor.id, skill: skill.id, target: 'enemy' });
          if (skill.type === 'heal') {
            for (const ally of battle.actors) if (ally.hp < 30 && ally.maxHp - ally.hp >= 22) choices.push({ score: 300 - ally.hp, actor: actor.id, skill: skill.id, target: ally.id });
          }
          if (skill.type === 'barrier') {
            const intent = battle.enemy.intent;
            const living = battle.actors.filter(item => item.hp > 0);
            const weak = [...living].sort((a, b) => a.hp - b.hp || a.id.localeCompare(b.id))[0];
            const targets = ['attack', 'sweep', 'drain'].includes(intent.type) ? (intent.target === 'all' ? living : [weak]) : [];
            for (const ally of targets) if (ally.barrier < intent.hits && ally.hp < 46) choices.push({ score: 90 + intent.hits * 2 - skill.cost, actor: actor.id, skill: skill.id, target: ally.id });
          }
          if (['damage', 'drain', 'burst'].includes(skill.type)) {
            const hits = skill.hits || 1;
            const clearHits = Math.max(0, hits - battle.enemy.barrier);
            const power = skill.type === 'burst' ? skill.power * actor.mana : skill.power;
            const factor = battle.enemy.weakness === skill.element ? 1.5 : 1;
            const raw = clearHits * power * factor;
            const strips = Math.min(hits, battle.enemy.barrier);
            const cost = skill.type === 'burst' ? actor.mana : skill.cost;
            choices.push({ score: (raw + strips * 7) / Math.max(1, cost) + (raw >= battle.enemy.hp ? 80 : 0), actor: actor.id, skill: skill.id, target: 'enemy' });
          }
        }
      }
      choices.sort((a, b) => b.score - a.score);
      if (!choices.length) break;
      const best = choices[0];
      const response = castSpell(battle, best.actor, best.skill, best.target);
      assert.equal(response.ok, true, response.message);
      battle = response.battle;
    }
    if (battle.status === 'active') battle = endRound(battle).battle;
  }
  return battle;
}

test('十种双课程路线均可完成六周与终战，零应急药剂也不会软锁', () => {
  const ids = COURSES.map(course => course.id);
  const enemies = Object.keys(ENEMIES);
  for (let first = 0; first < ids.length; first += 1) {
    for (let second = first + 1; second < ids.length; second += 1) {
      let state = createCampaign();
      state.potions = 0;
      for (let week = 0; week < 6; week += 1) {
        state.week = week;
        state = study(state, [ids[first], ids[second]]).state;
        const battle = playBattle(state, enemies[week]);
        assert.ok(['victory', 'pact'].includes(battle.status), `${ids[first]} / ${ids[second]} 于 ${enemies[week]} ${battle.status}，第 ${battle.round} 回合`);
        state = resolveBattle(state, battle);
      }
      state.week = 6;
      const finale = playBattle(state, 'bellkeeper');
      assert.ok(['victory', 'pact'].includes(finale.status), `${ids[first]} / ${ids[second]} 终战 ${finale.status}，第 ${finale.round} 回合`);
      state = resolveBattle(state, finale);
      assert.equal(state.results.length, 7);
      assert.equal(state.potions, 0);
      assert.ok(finale.round < 80);
      assert.deepEqual(JSON.parse(JSON.stringify(state)), state);
    }
  }
});

test('实际六周剧情选项能分别抵达信任、洞察与勇气三种成功结局', () => {
  for (const [attribute, expected] of [['bond', 'together'], ['insight', 'archive'], ['courage', 'dawn']]) {
    let state = createCampaign();
    for (const week of WEEKS) {
      for (const decision of [week.choice, week.night]) {
        const choice = [...decision.options].sort((a, b) => (b.effects?.[attribute] || 0) - (a.effects?.[attribute] || 0))[0];
        state = applyEffects(state, choice.effects);
      }
      state = applyEffects(state, attribute === 'bond' ? { bond: 1, insight: 1 } : { courage: 1 });
    }
    state = applyEffects(state, attribute === 'bond' ? { bond: 1, insight: 1 } : { courage: 1 });
    assert.equal(chooseEnding(state), expected, `${attribute} 路线的实际剧情应能抵达 ${expected}`);
  }
});
