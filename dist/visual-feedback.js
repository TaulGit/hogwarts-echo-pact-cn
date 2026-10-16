// 将真实战斗状态差转换为视觉反馈；不持有 DOM、计时器或可变战斗状态。
const EFFECTS = {
  damage: 'strike', drain: 'strike', burst: 'strike', barrier: 'shield',
  heal: 'heal', regen: 'heal', sense: 'sense', pact: 'pact',
};
const IDS = ['player', 'companion', 'enemy'];
const NAMES = { player: '洛岚', companion: '艾琳', enemy: '敌人' };
const entity = (battle, id) => id === 'enemy' ? battle?.enemy : battle?.actors?.find(actor => actor.id === id);
const number = value => Number.isFinite(value) ? value : 0;

export function feedbackFor(beforeBattle, afterBattle, event = {}) {
  const target = event.target ?? null;
  const source = event.actor || 'enemy';
  const effect = event.kind === 'enemy' ? 'enemy' : event.kind === 'potion' ? 'heal' : EFFECTS[event.spell?.type] || 'strike';
  const label = event.label || event.spell?.name || (event.kind === 'enemy' ? '敌方行动' : event.kind === 'potion' ? '复元药剂' : '魔法回响');
  const changes = [];
  const names = {};

  for (const id of IDS) {
    const before = entity(beforeBattle, id);
    const after = entity(afterBattle, id);
    if (!before || !after) continue;
    names[id] = after.name || before.name || NAMES[id];
    const labels = [];
    let kind = null;
    const hp = number(after.hp) - number(before.hp);
    const barrier = number(after.barrier) - number(before.barrier);
    const mana = number(after.mana) - number(before.mana);
    if (hp !== 0) {
      labels.push(`${hp < 0 ? '−' : '+'}${Math.abs(hp)} 生命`);
      kind = hp < 0 ? 'hurt' : 'heal';
    }
    if (barrier !== 0) {
      labels.push(barrier < 0 && after.barrier === 0 ? '护盾击破' : `护盾 ${barrier < 0 ? '−' : '+'}${Math.abs(barrier)}`);
      kind ||= 'shield';
    }
    if (mana > 0) {
      labels.push(`+${mana} 魔力`);
      kind ||= 'mana';
    }

    if (id === target && event.kind === 'spell') {
      if (event.spell?.type === 'sense') {
        const casterBefore = entity(beforeBattle, event.actor);
        const casterAfter = entity(afterBattle, event.actor);
        const spentMana = casterBefore && casterAfter && number(casterAfter.mana) < number(casterBefore.mana);
        const revealed = after.sensed && (!before.sensed || spentMana || number(after.status?.vulnerableTurns) > number(before.status?.vulnerableTurns));
        if (revealed) { labels.push('弱点显现'); kind ||= 'status'; }
      }
      if (event.spell?.type === 'pact' && afterBattle?.status === 'pact' && beforeBattle?.status !== 'pact') {
        labels.push('安抚成功');
        kind ||= 'status';
      }
    }
    if (labels.length) changes.push({ id, kind, labels: labels.slice(0, 3) });
  }

  const announcement = changes.length
    ? `${label}。${changes.map(change => `${names[change.id]}：${change.labels.join('，')}`).join('；')}。`
    : '';
  return { label, source, target, effect, changes, announcement };
}
