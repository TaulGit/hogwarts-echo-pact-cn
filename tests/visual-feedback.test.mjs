import test from 'node:test';
import assert from 'node:assert/strict';
import { createCampaign, study, createBattle, castSpell, endRound, usePotion, SPELLS } from '../dist/engine.js';
import { feedbackFor } from '../dist/visual-feedback.js';

const spellEvent = (spell, actor = 'player', target = 'enemy') => ({ kind: 'spell', actor, target, spell: SPELLS[spell], label: SPELLS[spell].name });
const clone = value => JSON.parse(JSON.stringify(value));
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

test('连击真实破两层盾并伤害生命，扣蓝不成为视觉变化', () => {
  const state = study(createCampaign(), ['charms', 'runes']).state;
  const before = createBattle(state, 'inkshade');
  const after = castSpell(before, 'player', 'quillVolley', 'enemy').battle;
  const feedback = feedbackFor(before, after, spellEvent('quillVolley'));
  assert.deepEqual(feedback.changes, [{ id: 'enemy', kind: 'hurt', labels: ['−6 生命', '护盾击破'] }]);
  assert.equal(feedback.effect, 'strike');
  assert.equal(feedback.source, 'player');
  assert.equal(feedback.target, 'enemy');
  assert.match(feedback.announcement, /漏页墨影：−6 生命，护盾击破/);
  const blocked = castSpell(before, 'player', 'spark', 'enemy').battle;
  assert.deepEqual(feedbackFor(before, blocked, spellEvent('spark')).changes, [{ id: 'enemy', kind: 'shield', labels: ['护盾 −1'] }]);
});

test('治疗和药剂仅报告实际恢复数值，满血不出现虚构治疗', () => {
  const before = createBattle(createCampaign(), 'armour');
  before.actors[0].hp -= 30;
  const after = castSpell(before, 'companion', 'mendingDraught', 'player').battle;
  const feedback = feedbackFor(before, after, spellEvent('mendingDraught', 'companion', 'player'));
  assert.equal(feedback.effect, 'heal');
  assert.deepEqual(feedback.changes, [{ id: 'player', kind: 'heal', labels: ['+26 生命'] }]);
  const full = createBattle(createCampaign(), 'armour');
  assert.deepEqual(feedbackFor(full, castSpell(full, 'companion', 'mendingDraught', 'player').battle, spellEvent('mendingDraught', 'companion', 'player')).changes, []);
  before.actors[0].mana = 0;
  const potion = usePotion(before, 'player').battle;
  assert.deepEqual(feedbackFor(before, potion, { kind: 'potion', actor: 'player', target: 'player', spell: null, label: '复元药剂' }).changes, [{ id: 'player', kind: 'heal', labels: ['+30 生命', '+12 魔力'] }]);
});

test('敌方回合同时报告双人伤害、逐击破盾和各自真实回蓝，每人最多三条', () => {
  const before = createBattle(createCampaign(), 'bellkeeper');
  for (const actor of before.actors) { actor.mana = 0; actor.barrier = 1; }
  const after = endRound(before).battle;
  const feedback = feedbackFor(before, after, { kind: 'enemy', actor: null, target: null, spell: null, label: before.enemy.intent.label });
  assert.equal(feedback.effect, 'enemy');
  assert.equal(feedback.source, 'enemy');
  assert.equal(feedback.target, null);
  assert.deepEqual(feedback.changes, [
    { id: 'player', kind: 'hurt', labels: ['−8 生命', '护盾击破', '+8 魔力'] },
    { id: 'companion', kind: 'hurt', labels: ['−8 生命', '护盾击破', '+8 魔力'] },
  ]);
});

test('显迹与安抚成功通过真实状态变化反馈，无生命伤害也可被读出', () => {
  const state = study(createCampaign(), ['creatures', 'runes']).state;
  const before = createBattle(state, 'inkshade');
  const sensed = castSpell(before, 'player', 'reveal', 'enemy').battle;
  assert.deepEqual(feedbackFor(before, sensed, spellEvent('reveal')).changes, [{ id: 'enemy', kind: 'status', labels: ['弱点显现'] }]);
  before.enemy.hp = 20;
  before.enemy.barrier = 0;
  const pacted = castSpell(before, 'player', 'softWhistle', 'enemy').battle;
  const feedback = feedbackFor(before, pacted, spellEvent('softWhistle'));
  assert.equal(feedback.effect, 'pact');
  assert.deepEqual(feedback.changes, [{ id: 'enemy', kind: 'status', labels: ['安抚成功'] }]);
  const high = createBattle(state, 'inkshade');
  const failed = castSpell(high, 'player', 'softWhistle', 'enemy').battle;
  assert.deepEqual(feedbackFor(high, failed, spellEvent('softWhistle')).changes, []);
});

test('无效施法返回空变化且函数不污染任何输入或产生时间字段', () => {
  const state = study(createCampaign(), ['runes', 'defence']).state;
  const before = createBattle(state, 'armour');
  const invalid = castSpell(before, 'player', 'reveal', 'player').battle;
  const event = spellEvent('reveal', 'player', 'player');
  const expectedBefore = clone(before), expectedAfter = clone(invalid), expectedEvent = clone(event);
  const feedback = feedbackFor(freeze(before), freeze(invalid), freeze(event));
  assert.deepEqual(feedback.changes, []);
  assert.equal(feedback.announcement, '');
  assert.deepEqual(before, expectedBefore);
  assert.deepEqual(invalid, expectedAfter);
  assert.deepEqual(event, expectedEvent);
  assert.deepEqual(feedbackFor(before, invalid, event), feedback);
  assert.deepEqual(Object.keys(feedback).sort(), ['announcement', 'changes', 'effect', 'label', 'source', 'target']);
});
