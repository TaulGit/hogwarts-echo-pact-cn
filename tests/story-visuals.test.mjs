import test from 'node:test';
import assert from 'node:assert/strict';
import { WEEKS } from '../dist/content.js';
import { ENDING_VISUALS, visualForScene } from '../dist/story-visuals.js';

function sceneCue(week, sceneName, line, extra = {}) {
  return visualForScene({
    week,
    sceneNext: sceneName === 'intro' ? 'choice'
      : sceneName === 'discovery' ? 'battle' : 'night',
    line,
    scene: WEEKS[week][sceneName],
    isFinal: false,
    ...extra
  });
}

test('墨钟随事件出现，旧纸现身前不使用发现阶段的说明', () => {
  assert.equal(sceneCue(0, 'intro', 2), null);
  for (const line of [3, 4]) {
    const cue = sceneCue(0, 'intro', line);
    assert.equal(cue?.id, 'ink');
    assert.equal(cue.title, '画框外的墨钟');
    assert.match(cue.caption, /墨.*钟形/);
    assert.doesNotMatch(cue.caption, /旧纸|愿意|许可/);
  }
  assert.equal(sceneCue(0, 'intro', 5), null);
  assert.equal(sceneCue(0, 'intro', 8), null);
  assert.equal(sceneCue(0, 'intro', 9)?.caption, '六个针孔亮起，旧纸从钟纹中出现。');
  assert.equal(sceneCue(0, 'discovery', 0)?.id, 'ink');
  assert.equal(sceneCue(0, 'discovery', 3), null);
});

test('铁甲和银叶的开场说明不提前揭示撤回令或试验卡', () => {
  assert.equal(sceneCue(1, 'intro', 2), null);
  for (const line of [3, 8]) {
    const cue = sceneCue(1, 'intro', line);
    assert.equal(cue?.title, '守着空行的铁甲');
    assert.equal(cue.caption, '空名册和守门铁甲连着同一道钟纹。');
    assert.doesNotMatch(cue.caption, /撤回/);
  }
  assert.equal(sceneCue(1, 'intro', 9), null);
  assert.match(sceneCue(1, 'discovery', 0)?.caption, /撤回/);

  assert.equal(sceneCue(2, 'intro', 0), null);
  for (const line of [1, 5]) {
    const cue = sceneCue(2, 'intro', line);
    assert.equal(cue?.title, '叶片里的两段往事');
    assert.equal(cue.caption, '海边与城堡在银色叶片中轮流亮起。');
    assert.doesNotMatch(cue.caption, /副本|试验卡/);
  }
  assert.equal(sceneCue(2, 'intro', 6), null);
  assert.match(sceneCue(2, 'discovery', 0)?.caption, /试验卡/);
});

test('旧信、水镜与裂环只在各自事件行出现', () => {
  assert.equal(sceneCue(3, 'intro', 3), null);
  assert.equal(sceneCue(3, 'intro', 4)?.id, 'letter');
  assert.equal(sceneCue(3, 'intro', 6)?.id, 'letter');
  assert.equal(sceneCue(3, 'intro', 7), null);

  assert.equal(sceneCue(4, 'intro', 2), null);
  for (const line of [3, 4, 9]) {
    const cue = sceneCue(4, 'intro', line);
    assert.equal(cue?.id, 'mirror');
    assert.equal(cue.caption, '画家改过画，水镜却只记得旧版。');
  }
  assert.equal(sceneCue(4, 'intro', 5), null);
  assert.equal(sceneCue(4, 'intro', 8), null);
  assert.equal(sceneCue(4, 'discovery', 0)?.id, 'mirror');

  for (let line = 0; line < WEEKS[5].intro.length; line++) {
    assert.equal(sceneCue(5, 'intro', line), null);
  }
  assert.equal(sceneCue(5, 'discovery', 0), null);
  assert.equal(sceneCue(5, 'discovery', 1)?.id, 'ring');
  assert.equal(sceneCue(5, 'afterBattle', 0)?.id, 'ring');
  assert.equal(sceneCue(5, 'afterBattle', 3), null);
});

test('完整对白数组读档拷贝仍命中；选择回应和越界行不出图', () => {
  const savedScene = structuredClone(WEEKS[0].intro);
  assert.notStrictEqual(savedScene, WEEKS[0].intro);
  assert.deepEqual(savedScene, WEEKS[0].intro);
  assert.equal(visualForScene({ week: 0, sceneNext: 'choice', line: 3, scene: savedScene })?.id, 'ink');
  assert.equal(visualForScene({ week: 0, sceneNext: 'choice', line: savedScene.length, scene: savedScene }), null);
  for (let week = 0; week < WEEKS.length; week++) {
    assert.equal(visualForScene({ week, sceneNext: 'planner', line: 0, scene: WEEKS[week].choice.options[0].response }), null);
    assert.equal(visualForScene({ week, sceneNext: 'summary', line: 0, scene: WEEKS[week].night.options[0].response }), null);
  }
});

test('终战与四个结局优先于周线索，旧结局不会串进新的开场', () => {
  assert.equal(visualForScene({ week: 4, sceneNext: 'choice', line: 3, scene: WEEKS[4].intro, isFinal: true }), null);
  assert.equal(visualForScene({ week: 5, sceneNext: 'final-battle', line: 2, isFinal: true }), null);
  assert.equal(visualForScene({ week: 5, sceneNext: 'final-battle', line: 3, isFinal: true })?.id, 'finale');
  assert.equal(visualForScene({ week: 5, sceneNext: 'ending', line: 1, isFinal: true }), null);
  for (const [ending, art] of Object.entries(ENDING_VISUALS)) {
    assert.equal(visualForScene({ week: 5, sceneNext: 'ending', line: 1, isFinal: true, ending })?.art, art);
    assert.equal(visualForScene({ week: 0, sceneNext: 'choice', line: 3, scene: WEEKS[0].intro, ending })?.id, 'ink');
  }
});
