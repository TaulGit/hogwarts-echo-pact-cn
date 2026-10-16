import {COURSES,SPELLS,ENEMIES,createCampaign,applyEffects,study,learnedSpells,createBattle,castSpell,usePotion,endRound,resolveBattle,chooseEnding} from './engine.js';
import {META,CHARACTERS,WEEKS,ENDINGS} from './content.js';
import {STORY_VISUALS,WEEK_VISUALS,ENDING_VISUALS,visualForScene} from './story-visuals.js';
import {feedbackFor} from './visual-feedback.js';
import {createThemeMusic} from './music.js';
import {connectPlatform,readLocal,writeLocal,saveCloud,readCloud,syncInfo} from './platform.js';

const app=document.querySelector('#app'),modalRoot=document.querySelector('#modal-root');
const art=id=>`./assets/${id}.png`;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=readLocal()||createCampaign();
let view='title',selectedActor='player',selectedSpell=null,modal=null,autoTimer=null,pendingCloud=null;
let options={sound:false,music:true,musicVolume:.25,auto:false,reduceMotion:matchMedia('(prefers-reduced-motion: reduce)').matches};
try{options={...options,...JSON.parse(localStorage.getItem('echo-pact:options')||'{}')};}catch{}
options.music=options.music!==false;options.musicVolume=Math.max(0,Math.min(1,Number.isFinite(options.musicVolume)?options.musicVolume:.25));
const themeMusic=createThemeMusic({enabled:options.music,volume:options.musicVolume,onError:()=>toast('音乐暂时无法播放，仍可继续故事。')});
function syncMusic(){themeMusic.setActive(view==='title'||(view==='game'&&state.week===0&&state.screen==='story'&&state.sceneNext==='choice'&&!state.isFinal));}
for(const type of ['click','keydown'])document.addEventListener(type,event=>{if(event.isTrusted&&!event.repeat)themeMusic.unlock();},{capture:true});
let unlocked=[];try{unlocked=JSON.parse(localStorage.getItem('echo-pact:endings')||'[]');}catch{}
let audioContext,inspectedVisual=null,visualParent=null,combatFeedback=null,feedbackTimer=null,feedbackSequence=0;
const warmedImages=new Set();
const icons={charms:'✦',defence:'◈',potions:'♧',runes:'⌘',creatures:'❧'};
const week=()=>WEEKS[Math.min(state.week||0,WEEKS.length-1)];
const chapterTitle=()=>String(week()?.title||'回声之约').replace(/^第[一二三四五六七八九十\d]+周[：:]\s*/, '');
const button=(label,action,cls='',attrs='')=>`<button class="btn ${cls}" data-action="${action}" ${attrs}>${label}</button>`;
function sceneVisual(){
  return visualForScene({week:state.week,sceneNext:state.sceneNext,line:state.line||0,scene:state.scene,isFinal:state.isFinal});
}
function visualByArt(id){return Object.values(STORY_VISUALS).find(v=>v.art===id);}
function motes(count=10){
  return `<div class="ambient-motes" aria-hidden="true">${Array.from({length:count},(_,i)=>`<i style="--x:${(i*37+13)%100}%;--y:${(i*19+7)%87}%;--delay:${-i*1.3}s;--drift:${i%2?-18:22}px"></i>`).join('')}</div>`;
}
function visualMotion(cue){
  return `<div class="scene-motion motion-${cue.motion}" aria-hidden="true"><span class="motion-orbit"></span><span class="motion-orbit orbit-two"></span>${Array.from({length:6},(_,i)=>`<i style="--i:${i};--a:${i*60}deg;--delay:${-i*.65}s"></i>`).join('')}</div>`;
}
function sceneArtwork(cue,cls=''){
  return `<div class="cinematic-art ${cls}" data-visual="${cue.id}"><div class="cinematic-frame" style="--focus-x:${cue.focus[0]}%;--focus-y:${cue.focus[1]}%"><img class="cinematic-image" src="${art(cue.art)}" alt="${esc(cue.caption)}" style="object-position:${cue.focus.join('% ')}%">${visualMotion(cue)}${motes(9)}<button class="art-expand" data-action="visual" data-art="${cue.art}" aria-label="放大查看${esc(cue.title)}">⤢ <span>查看画面</span></button></div></div>`;
}
function sceneEvent(cue){
  return `<aside class="scene-event"><span class="event-seal" aria-hidden="true">✧</span><div><small>眼前的线索</small><strong>${esc(cue.title)}</strong><p>${esc(cue.caption)}</p></div></aside>`;
}
function prepareVisuals(){
  const ids=[WEEK_VISUALS[state.week||0]];
  if(state.screen==='summary')ids.push(WEEK_VISUALS[Math.min((state.week||0)+1,5)]);
  if(state.isFinal)ids.push('story-finale');
  for(const id of ids.filter(Boolean))if(!warmedImages.has(id)){warmedImages.add(id);const im=new Image();im.src=art(id);}
}
function impactMarkup(id){
  const change=combatFeedback?.changes.find(c=>c.id===id);
  return change?`<span class="impact-stack impact-${change.kind}" aria-hidden="true">${change.labels.map(t=>`<b>${esc(t)}</b>`).join('')}</span>`:'';
}
function battleAnimation(){
  if(!combatFeedback)return '';
  const f=combatFeedback,point=id=>id==='enemy'?[79,44]:[22,id==='companion'?76:25];
  const from=point(f.source),targets=f.effect==='enemy'?f.changes.filter(c=>c.kind!=='mana').map(c=>c.id):[f.target].filter(Boolean);
  const targetsUnique=[...new Set(targets)];
  const beams=targetsUnique.filter(id=>id!==f.source).map(id=>{const to=point(id);return `<path pathLength="1" d="M${from[0]},${from[1]} Q50,4 ${to[0]},${to[1]}"></path>`;}).join('');
  const bursts=targetsUnique.map(id=>{const to=point(id);return `<span class="spell-burst" style="left:${to[0]}%;top:${to[1]}%"></span>`;}).join('');
  return `<div class="battle-animation effect-${f.effect}" aria-hidden="true">${beams?'<svg viewBox="0 0 100 100" preserveAspectRatio="none">'+beams+'</svg>':''}${bursts}<div class="cast-caption">${esc(f.label)}</div></div><span class="sr-only" role="status">${esc(f.announcement)}</span>`;
}
function showBattleFeedback(before,after,event){
  clearTimeout(feedbackTimer);combatFeedback=feedbackFor(before,after,event);const current=++feedbackSequence;
  feedbackTimer=setTimeout(()=>{if(current===feedbackSequence){combatFeedback=null;if(view==='game'&&state.screen==='battle')render();}},1800);
}

function sound(kind='click'){
  if(!options.sound)return;
  try{
    audioContext??=new(window.AudioContext||window.webkitAudioContext)();audioContext.resume();
    const t=audioContext.currentTime,g=audioContext.createGain();g.connect(audioContext.destination);g.gain.setValueAtTime(.035,t);g.gain.exponentialRampToValueAtTime(.001,t+.45);
    const notes=kind==='spell'?[523.25,783.99,1046.5]:kind==='success'?[392,493.88,587.33,783.99]:[329.63];
    notes.forEach((n,i)=>{const o=audioContext.createOscillator();o.type='sine';o.frequency.value=n;o.connect(g);o.start(t+i*.055);o.stop(t+.5);});
  }catch{}
}
function toast(message){const t=document.querySelector('#toast');t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3100);}
function save(){state.version=1;state.savedAt=Date.now();state.readLog=(state.readLog||[]).slice(-90);writeLocal(state);}
function setScreen(screen){if(screen!=='battle'){combatFeedback=null;clearTimeout(feedbackTimer);}state.screen=screen;view='game';save();render();}
function progress(){return Math.min(100,Math.round(((state.week||0)+(state.screen==='summary'?.95:.2))/6*100));}
function header(){
  return `<header class="topbar">
    <button class="brand" data-action="title" aria-label="回到标题"><span class="brand-seal">✧</span><span>回声之约<small>霍格沃茨同人</small></span></button>
    <div class="chapter-head"><span class="chapter-week">第 ${Math.min((state.week||0)+1,6)} 周</span><span>${esc(chapterTitle())}</span><div class="progress"><i style="width:${progress()}%"></i></div></div>
    <nav aria-label="游戏菜单"><button data-action="journal">手记</button><button data-action="spells">咒语</button><button data-action="history">回顾</button><button data-action="saves">存档</button><button data-action="settings">设置</button></nav>
  </header>`;
}
function statsBar(){const s=state.stats||{};return `<div class="statsbar"><span title="彼此信任，影响同伴结局">◇ 信任 <b>${s.bond||0}</b></span><span title="理解魔法与遗失记忆">⌘ 洞察 <b>${s.insight||0}</b></span><span title="面对未知的勇气">✦ 勇气 <b>${s.courage||0}</b></span><span title="战斗时可用的复元药剂">♧ 药剂 <b>${state.potions||0}</b></span></div>`;}
function titleScreen(){
  const has=!!readLocal()?.screen;
  return `<main class="title-screen" style="--bg:url('${art('courtyard')}')">
    <div class="title-shade"></div>${motes(12)}
    <div class="title-top"><span><b>HOGWARTS</b>一段发生在秋天的魔法往事</span><div class="title-controls"><button class="music-shortcut" data-action="toggle-music" aria-pressed="${options.music}" aria-label="${options.music?'关闭':'开启'}背景音乐">♫ 音乐 · ${options.music?'开':'关'}</button><button class="round-btn" data-action="settings" aria-label="打开设置">☷</button></div></div>
    <section class="title-content">
      <div class="eyebrow"><i></i> 霍格沃茨 · 原创同人故事</div>
      <h1>回声<span>之约</span></h1><p class="title-english">THE ECHO PACT</p>
      <div class="title-divider"><span>✧</span></div>
      <p class="title-copy">画像忘记了自己的名字。<br>废弃的钟楼，却在午夜响起。</p>
      <p class="title-intro">与艾琳一起，在万圣夜前找回六段失落的记忆。</p>
      <div class="title-actions">${has?button('继续故事 <span>→</span>','continue','primary'):''}${button(has?'开始新故事':'开始故事 <span>→</span>','new',has?'secondary':'primary')}${button('结局收藏 <span>↗</span>','gallery','subtle')}</div>
      <div class="title-features"><span><b>06</b>周校园生活</span><span><b>05</b>门魔法课程</span><span><b>04</b>种故事结局</span></div>
    </section>
    <footer class="title-footer"><span>中文剧情 · 双人回合战斗</span><div><button data-action="help">游玩指南</button><button data-action="credits">关于本作</button></div><span>预计游玩 45–70 分钟</span></footer>
  </main>`;
}
function speakerName(id){return id==='narrator'?'旁白':CHARACTERS[id]?.name||id||'旁白';}
function portrait(id,focus=true,extra=''){return `<img class="portrait ${focus?'focus':'dim'} ${extra}" src="${art(id)}" alt="${esc(speakerName(id))}">`;}
function storyScreen(){
  const line=state.scene?.[state.line||0]||{speaker:'narrator',text:'烛火轻晃，新的故事正在展开。'};
  const speaker=line.speaker||'narrator',bg=state.bg||week().bg||'corridor',cue=sceneVisual();
  const location=state.isFinal?'废弃天文台 · 万圣夜':week().location;
  return `<main class="story-screen ${cue?'cinematic-scene':''}" style="--bg:url('${art(cue?.art||bg)}')" ${cue?`data-cue="${cue.id}"`:''}>
    <div class="scene-backdrop"></div><div class="scene-vignette"></div>
    ${cue?sceneArtwork(cue):motes(10)}
    <div class="scene-caption"><span class="ornament">✦</span>${esc(state.isFinal?'10月31日 · 万圣夜':week().date)}<b>${esc(location)}</b></div>
    ${cue?sceneEvent(cue):`<div class="scene-portraits">${portrait('player',speaker==='narrator'||speaker==='player','left')}${portrait('companion',speaker==='narrator'||speaker==='companion','right')}</div>`}
    <section class="dialogue-box ${speaker==='narrator'?'narrator':''}">
      <div class="dialogue-name"><span>${esc(speakerName(speaker))}</span><i></i><small>${speaker==='player'?'拉文克劳 · 七年级':speaker==='companion'?'斯莱特林 · 七年级':esc(location)}</small></div>
      <button class="dialogue-text" data-action="advance" aria-label="继续对话"><p>${esc(line.text)}</p><span class="continue-mark">继续 <b>▸</b></span></button>
      <div class="dialogue-bottom"><span class="dialogue-page">${String((state.line||0)+1).padStart(2,'0')} <i>/ ${String(state.scene?.length||1).padStart(2,'0')}</i></span><span>点击文字或按空格继续</span><button data-action="auto" class="${options.auto?'enabled':''}">${options.auto?'自动播放 · 开':'自动播放 · 关'}</button></div>
    </section>
  </main>`;
}
function choiceScreen(kind){
  const data=kind==='night'?week().night:week().choice;
  return `<main class="choice-screen" style="--bg:url('${art(sceneVisual()?.art||state.bg||week().bg)}')"><div class="choice-backdrop"></div>
    <section class="choice-panel parchment"><div class="eyebrow dark">第 ${(state.week||0)+1} 周 · ${kind==='night'?'课后的时光':'调查中的抉择'}</div><span class="choice-symbol">✧</span><h2>${esc(data.prompt)}</h2>
      <div class="choice-list">${data.options.map((o,i)=>`<button class="choice-option" data-action="choose" data-kind="${kind}" data-index="${i}"><span class="choice-number">0${i+1}</span><span><b>${esc(o.label)}</b><small>${esc(o.detail)}</small></span><em>↗</em></button>`).join('')}</div>${statsBar()}
    </section></main>`;
}
function plannerScreen(){
  const selected=state.selectedCourses||[];
  return `<main class="desk-screen planner-screen" style="--bg:url('${art('classroom')}')"><section class="planner-panel parchment">
    <div class="panel-heading"><div><div class="eyebrow dark">WEEK ${String((state.week||0)+1).padStart(2,'0')} <span>· 本周课表</span></div><h2>这周，想学点什么？</h2><p>选修两门不同的课程，学习新的咒语。<br class="mobile-only">每门课程共有三级，专长由你决定。</p></div><span class="large-sigil">⌘</span></div>
    <div class="course-grid">${COURSES.map(c=>{const lv=state.courses[c.id]||0,spell=SPELLS[c.spellIds[Math.min(lv,2)]],on=selected.includes(c.id);return `<button class="course-card ${on?'selected':''}" style="--course:${c.color||'#6a7785'}" data-action="course" data-id="${c.id}" aria-pressed="${on}"><span class="course-icon">${icons[c.id]}</span><span class="selection-check">${on?'✓':'+'}</span><h3>${esc(c.name)}</h3><p>${esc(c.description)}</p><div class="course-level" aria-label="已学${lv}级">${[1,2,3].map(n=>`<i class="${lv>=n?'lit':''}"></i>`).join('')}<small>等级 ${lv} / 3</small></div><footer><small>${lv>=3?'本周复习':'即将学会'}</small><b>${esc(spell?.name||'魔法研习')}</b></footer></button>`;}).join('')}</div>
    <div class="panel-footer"><div class="selection-summary"><strong>已选 ${selected.length} / 2</strong><span>${selected.length?selected.map(id=>COURSES.find(c=>c.id===id)?.name).join(' · '):'请选择本周课程'}</span></div>${button('确认课表 <span>→</span>','study','primary',selected.length!==2?'disabled':'')}</div>
  </section></main>`;
}
function lessonsScreen(){
  return `<main class="desk-screen" style="--bg:url('${art('classroom')}')"><section class="lesson-panel parchment"><div class="eyebrow dark">第 ${(state.week||0)+1} 周 · 课程结束</div><h2>新的咒语，记下了。</h2><p class="section-intro">下一次遇见异象，就试试今天学到的魔法。</p><div class="lesson-grid">${(state.lessons||[]).map(l=>{const c=typeof l.course==='string'?COURSES.find(x=>x.id===l.course):l.course,sp=typeof l.spell==='string'?SPELLS[l.spell]:l.spell;return `<article class="lesson-card"><span class="large-sigil">${icons[c?.id]||'✦'}</span><small>${esc(c?.name||'魔法课程')} · ${l.level} 级</small><h3>${esc(sp?.name||'复习魔法')}</h3><p>${esc(sp?.description||'你对这门魔法有了更深的理解。')}</p><span class="tag">${l.newSpell===false?'已完成复习':'新咒语 · 已收入咒语册'}</span></article>`;}).join('')}</div><p class="muted">同一回合可以多次施法。魔力不足时，结束回合即可恢复。</p>${button('前往调查地点 <span>→</span>','discovery','primary')}</section></main>`;
}
function bar(value,max,cls){const pct=Math.max(0,Math.min(100,value/(max||1)*100));return `<div class="meter ${cls}"><i style="width:${pct}%"></i></div>`;}
function actorCard(a){
  const targeting=selectedSpell&&SPELLS[selectedSpell]?.target==='ally';
  return `<button class="actor-card ${selectedActor===a.id?'active':''} ${a.hp<=0?'down':''} ${targeting?'targetable':''}" data-action="actor" data-id="${a.id}" aria-label="${esc(a.name)}，生命${a.hp}，魔力${a.mana}"><div class="actor-art"><img src="${art(a.id)}" alt=""></div>${impactMarkup(a.id)}<div class="actor-info"><div class="actor-name"><b>${esc(a.name)}</b><span>${a.hp<=0?'已倒下':targeting?'选择施法目标':selectedActor===a.id?'正在行动':'点击切换'}</span></div><div class="stat-label"><span>生命</span><b>${a.hp} <i>/ ${a.maxHp}</i></b></div>${bar(a.hp,a.maxHp,'hp')}<div class="stat-label"><span>魔力</span><b>${a.mana} <i>/ ${a.maxMana}</i></b></div>${bar(a.mana,a.maxMana,'mana')}<div class="shield-dots" aria-label="${a.barrier}层护盾">${Array.from({length:7},(_,i)=>`<i class="${i<a.barrier?'on':''}">◇</i>`).join('')}<small>回合恢复 +${a.regen}</small></div></div></button>`;
}
function battleScreen(){const b=state.currentBattle;if(!b)return '';const en=b.enemy;const spells=learnedSpells(state,selectedActor);const sp=selectedSpell?SPELLS[selectedSpell]:null;const a=b.actors.find(x=>x.id===selectedActor);const done=b.status!=='active';return `<main class="battle-screen" style="--bg:url('${art(state.isFinal?'story-finale':week().bg||'forest')}')"><div class="battle-backdrop"></div><div class="battle-topline"><div><span class="eyebrow">${state.isFinal?'万圣夜 · 最后一战':'第 '+((state.week||0)+1)+' 周 · 记忆异象'}</span><h2>${esc(state.isFinal?'断钟之下':chapterTitle())}</h2></div><div class="round-label"><small>回合</small><b>${String(b.round).padStart(2,'0')}</b></div></div><div class="battle-field">${battleAnimation()}<div class="heroes">${b.actors.map(actorCard).join('')}</div><div class="versus">✧<span>回声交锋</span></div><button class="enemy-card ${sp?.target==='enemy'?'targetable':''}" data-action="target" data-id="enemy" ${done?'disabled':''}><div class="enemy-art"><img src="${art(en.art||'shade')}" alt="${esc(en.name)}"></div>${impactMarkup('enemy')}<div class="enemy-info"><div class="enemy-name"><h3>${esc(en.name)}</h3><span>${en.pactable?'可以尝试安抚':'魔法构造体'}</span></div><div class="stat-label"><span>生命</span><b>${en.hp} / ${en.maxHp||ENEMIES[en.id]?.hp||en.hp}</b></div>${bar(en.hp,en.maxHp||ENEMIES[en.id]?.hp||en.hp,'hp enemy-hp')}<div class="shield-dots">${Array.from({length:Math.max(7,en.barrier)},(_,i)=>`<i class="${i<en.barrier?'on':''}">◇</i>`).join('')}<small>护盾 ${en.barrier} 层</small></div><div class="intent"><span>下一步</span><b>${esc(en.intent?.label||en.intent||'蓄势待发')}</b><small>${esc((en.intent?.description||'观察对手，规划本回合的行动。').replace(/^下一回合[：:]\s*/,''))}</small></div></div></button></div><section class="battle-console"><div class="spell-area"><div class="spell-heading"><span class="spell-owner"><b>${esc(a?.name)}</b> 的咒语</span><small>${sp?'已选「'+esc(sp.name)+'」 · '+(sp.target==='enemy'?'点击右侧异象施放':sp.target==='self'?'点击下方按钮施放':'点击要保护或治疗的角色'):'选择咒语，再点击目标'}</small></div><div class="spell-grid">${spells.map(s=>`<button class="spell-button ${selectedSpell===s.id?'chosen':''}" data-action="spell" data-id="${s.id}" ${done||a.hp<=0||a.mana<s.cost?'disabled':''} title="${esc(s.description)}"><span class="spell-glyph">${icons[s.course]||'✦'}</span><span><b>${esc(s.name)}</b><small>${esc(s.description)}</small></span><em>${s.type==='burst'?'全部':s.cost}<small>魔力</small></em></button>`).join('')}</div><div class="battle-actions">${button('复元药剂 × '+b.potions,'potion','small',done||b.potions<=0?'disabled':'')}${sp?.target==='self'?button('对自己施放 '+esc(sp.name),'self-cast','small primary'):''}${button('结束回合 · 恢复魔力 →','end-round','primary',done?'disabled':'')}</div></div><div class="battle-log"><div class="eyebrow">交锋记录</div><ol>${b.log.slice(-5).map(x=>`<li>${esc(typeof x==='string'?x:x.message||x.text)}</li>`).join('')}</ol><p class="battle-hint">每层护盾抵挡一次命中。<br>连击破盾后，再用强力咒语。</p></div></section>${done?battleResult(b):''}</main>`;}
function battleResult(b){const won=b.status==='victory'||b.status==='pact';return `<div class="result-overlay"><section class="result-card parchment"><span class="large-sigil">${b.status==='pact'?'❧':won?'✧':'◌'}</span><div class="eyebrow dark">${won?'异象平息':'暂时撤退'}</div><h2>${b.status==='pact'?'它听见了你的声音':won?'找到新的线索':'先回到安全的地方'}</h2><p>${b.status==='pact'?'安抚让你们理解了守卫这段记忆的理由。':won?'你们守住了彼此，也找到了下一条线索。':'艾琳带你撤回了安全处。你可以重新规划，或接受援助继续故事。'}</p><div class="result-buttons">${won?button('拾起回声，继续故事 →','battle-continue','primary'):button('调整策略，重新挑战','retry','primary')}${!won?button('接受援助，继续前进','battle-continue'):''}</div></section></div>`;}
function summaryScreen(){return `<main class="desk-screen" style="--bg:url('${art('courtyard')}')"><section class="summary-panel parchment"><div class="eyebrow dark">本周调查 · 已记入手记</div><span class="large-sigil">✧</span><h2>${esc(chapterTitle())}</h2><button class="summary-picture" data-action="visual" data-art="${WEEK_VISUALS[state.week||0]}" aria-label="查看本周线索画面"><img src="${art(WEEK_VISUALS[state.week||0])}" alt="${esc(visualByArt(WEEK_VISUALS[state.week||0])?.caption)}"><span>⤢ 查看本周线索</span></button><p class="summary-journal">${esc(week().journal)}</p><div class="echo-line"><i></i><span>第 ${(state.week||0)+1} 段记忆 · 已找回</span><i></i></div>${statsBar()}<div class="summary-courses">${COURSES.map(c=>`<span>${esc(c.name)}<b>${state.courses[c.id]||0} / 3</b></span>`).join('')}</div><p class="save-indicator">◇ ${esc(syncInfo.message)}</p>${button(state.week>=5?'前往万圣夜的钟楼 →':'迎接新的一周 →','next-week','primary')}</section></main>`;}
function endingScreen(){
  const key=state.ending||'silence',e=ENDINGS[key],cue=visualForScene({ending:key});
  return `<main class="ending-screen illustrated-ending" style="--bg:url('${art(cue.art)}')"><div class="ending-backdrop"></div><section class="ending-content"><div class="eyebrow">故事结局</div><h1>${esc(e.title)}</h1><p class="ending-subtitle">${esc(e.subtitle)}</p>${sceneArtwork(cue,'ending-art')}<p class="ending-art-caption">${esc(cue.caption)}</p><div class="ending-prose">${e.text.map(p=>`<p>${esc(p)}</p>`).join('')}</div><blockquote>${esc(e.quote)}</blockquote><div class="ending-stats">${statsBar()}</div><p>已解锁 ${unlocked.length} / 4 个结局</p><div class="ending-actions">${button('查看结局收藏','gallery','primary')}${button('回到标题','title')}</div><small class="fan-note">霍格沃茨同人 · 原创人物与故事</small></section></main>`;
}
function render(){clearTimeout(autoTimer);syncMusic();document.body.classList.toggle('reduce-motion',options.reduceMotion);document.body.classList.toggle('motion-enabled',!options.reduceMotion);if(view==='title'){app.innerHTML=titleScreen();}else{let body='';switch(state.screen){case 'story':body=storyScreen();break;case 'choice':body=choiceScreen('choice');break;case 'night':body=choiceScreen('night');break;case 'planner':body=plannerScreen();break;case 'lessons':body=lessonsScreen();break;case 'battle':body=battleScreen();break;case 'summary':body=summaryScreen();break;case 'ending':app.innerHTML=endingScreen();return;default:body=storyScreen();}app.innerHTML=`<div class="game-shell">${header()}${body}</div>`;if(options.auto&&state.screen==='story'&&!modal){const text=state.scene?.[state.line]?.text||'';autoTimer=setTimeout(advanceStory,Math.max(2800,text.length*90));}}if(modal)renderModal();}
function showStory(lines,next,bg){prepareVisuals();state.scene=lines;state.line=0;state.sceneNext=next;if(bg)state.bg=bg;setScreen('story');}
function advanceStory(){if(view!=='game'||state.screen!=='story'||modal)return;sound();const line=state.scene?.[state.line||0];if(line){state.readLog??=[];state.readLog.push({speaker:speakerName(line.speaker),text:line.text});}if((state.line||0)<state.scene.length-1){state.line++;save();render();}else goNext(state.sceneNext);}
function goNext(next){switch(next){case 'choice':setScreen('choice');break;case 'planner':state.selectedCourses=[];setScreen('planner');break;case 'battle':beginBattle(false);break;case 'night':setScreen('night');break;case 'summary':if(!state.journal.includes(week().journal))state.journal.push(week().journal);setScreen('summary');break;case 'final-battle':beginBattle(true);break;case 'ending':finishEnding();break;default:setScreen(next);}}
function startNew(){state=createCampaign();state.readLog=[];state.journal=[];state.week=0;state.isFinal=false;selectedSpell=null;showStory(week().intro,'choice',week().bg);}
function choose(kind,index){const data=kind==='night'?week().night:week().choice;const o=data.options[index];if(!o)return;state=applyEffects(state,o.effects||{});showStory(o.response,kind==='night'?'summary':'planner');}
function beginBattle(final){state.isFinal=final;state.currentBattle=createBattle(state,final?'bellkeeper':week().enemyId);selectedActor='player';selectedSpell=null;setScreen('battle');}
function actSpell(target){
  if(!selectedSpell)return toast('先选择一条咒语。');
  const before=state.currentBattle,spell=SPELLS[selectedSpell],result=castSpell(before,selectedActor,selectedSpell,target);
  if(!result.ok){toast(result.message);return;}
  state.currentBattle=result.battle;showBattleFeedback(before,result.battle,{kind:'spell',actor:selectedActor,target,spell,label:spell.name});selectedSpell=null;sound('spell');if(result.battle.status!=='active')sound('success');save();render();
}
function finishBattle(){
  const b=state.currentBattle;if(!b||b.status==='active')return;
  state=resolveBattle(state,b);state.currentBattle=null;selectedSpell=null;
  if(state.isFinal){
    const success=b.status==='victory'||b.status==='pact';if(!success)state.finalDefeat=true;
    showStory([
      {speaker:'narrator',text:success?'守钟咒的杖尖熄灭了。六段节拍悬在铜环上，最后一拍终于空了出来。':'援助的光撞开钟室门。艾琳拖着你退到门外，六段节拍仍困在裂开的铜环里。'},
      {speaker:'companion',text:success?'好了，它肯停下了。洛岚，现在由我们想想下一步。':'先关门。明天我们一起回来，六条约定一条也不丢。'}
    ],'ending','corridor');
  }else showStory(week().afterBattle,'night');
}
function finale(){
  state.isFinal=true;
  showStory([
    {speaker:'narrator',text:'万圣夜，礼堂的南瓜灯已经点亮。你们推开天文台内门，六段节拍同时浮上裂开的铜环。'},
    {speaker:'player',text:'六段都找齐了。可这道裂口还在——钟仍然会跳过最后的停顿。'},
    {speaker:'companion',text:'修环也好，封存也好，先让守钟咒停下来。它已经开始学我们的声音了。'},
    {speaker:'narrator',text:'黄铜齿轮一片片扣合，凝成守卫。它举起长杖，用洛岚的声音念出第一句咒语。'},
    {speaker:'player',text:'艾琳，护住铜环。我来引开它。'},
    {speaker:'companion',text:'三步以内。别忘了我们说好的退路。'}
  ],'final-battle','corridor');
}
function finishEnding(){state.ending=state.finalDefeat?'silence':chooseEnding(state);if(!unlocked.includes(state.ending)){unlocked.push(state.ending);localStorage.setItem('echo-pact:endings',JSON.stringify(unlocked));}setScreen('ending');sound('success');}
function openModal(name){clearTimeout(autoTimer);modal=name;renderModal();}
function closeModal(){if(modal==='visual'&&visualParent){modal=visualParent;visualParent=null;renderModal();return;}modal=null;visualParent=null;pendingCloud=null;modalRoot.innerHTML='';render();}
function renderModal(){let body='',title='';switch(modal){case 'visual':{const cue=inspectedVisual;if(!cue)break;title=cue.title;body=`<figure class="visual-lightbox"><img src="${art(cue.art)}" alt="${esc(cue.caption)}"><figcaption>${esc(cue.caption)}</figcaption></figure>`;break;}case 'settings':title='设置';body=`<div class="setting-row"><span>背景音乐<small>Autiletwing Castle · 主菜单与开场</small></span><button data-action="toggle-music" class="toggle ${options.music?'on':''}" aria-pressed="${options.music}">${options.music?'开':'关'}</button></div><div class="setting-row music-volume-row"><label for="music-volume">音乐音量</label><div class="music-volume-controls"><input id="music-volume" aria-label="背景音乐音量" type="range" min="0" max="100" step="5" value="${Math.round(options.musicVolume*100)}"><output id="music-volume-value" for="music-volume">${Math.round(options.musicVolume*100)}%</output></div></div><div class="setting-row"><span>魔法音效<small>轻柔的铃声与施法音效</small></span><button data-action="toggle-sound" class="toggle ${options.sound?'on':''}" aria-pressed="${options.sound}">${options.sound?'开':'关'}</button></div><div class="setting-row"><span>自动推进对话<small>可随时点击加速；选择时会停下</small></span><button data-action="auto" class="toggle ${options.auto?'on':''}">${options.auto?'开':'关'}</button></div><div class="setting-row"><span>场景与战斗动效<small>关闭后仍保留伤害与护盾文字提示</small></span><button data-action="toggle-motion" class="toggle ${options.reduceMotion?'':'on'}" aria-pressed="${!options.reduceMotion}">${options.reduceMotion?'关':'开'}</button></div>${button('游玩指南','help','wide')}`;break;case 'help':title='游玩指南';body=`<div class="help-grid"><article><b>01 · 安排课程</b><p>每周选择两门不同课程，逐级学习咒语。你擅长什么，会改变战斗的解法。</p></article><article><b>02 · 双人协作</b><p>点击角色切换，选咒语后点目标。一个回合可反复施法；魔力用尽后结束回合，双方恢复魔力。</p></article><article><b>03 · 护盾与意图</b><p>每层护盾挡住一次命中。多次攻击适合破盾，强力单击适合收尾。先看敌人的下一步，再规划行动。</p></article><article><b>04 · 留下怎样的回声</b><p>调查、对话、夜间行动和安抚都能改变信任、洞察与勇气。六周后的结局由这些选择共同决定。</p></article></div><p class="muted">空格：继续对话　Esc：关闭菜单<br>每个阶段自动存入本机；云档可在「存档」里手动读取和同步。</p>`;break;case 'history':title='对话回顾';body=`<div class="history-list">${(state.readLog||[]).length?(state.readLog||[]).map(x=>`<article><b>${esc(x.speaker)}</b><p>${esc(x.text)}</p></article>`).join(''):'<p class="empty-note">故事还没有开始。</p>'}</div>`;break;case 'journal':title='调查手记';body=`<div class="journal-list">${(state.journal||[]).map((j,i)=>`<article class="illustrated-entry"><button class="journal-picture" data-action="visual" data-art="${WEEK_VISUALS[i]}" aria-label="放大第${i+1}周的线索"><img src="${art(WEEK_VISUALS[i])}" alt="${esc(visualByArt(WEEK_VISUALS[i])?.caption)}"><span>第 ${i+1} 周 · ⤢</span></button><div><h3>${esc(WEEKS[i]?.title)}</h3><p>${esc(j)}</p></div></article>`).join('')||'<p class="empty-note">每周调查结束后，新的线索会记在这里。</p>'}</div>${statsBar()}`;break;case 'spells':title='课程与咒语册';body=`<div class="spellbook">${COURSES.map(c=>`<section><h3>${icons[c.id]} ${esc(c.name)} <small>Lv.${state.courses?.[c.id]||0}</small></h3>${c.spellIds.map((id,i)=>{const s=SPELLS[id],learned=(state.courses?.[c.id]||0)>i;return `<article class="${learned?'':'locked'}"><span>${learned?'✧':'◇'}</span><div><b>${esc(s.name)} <small>Lv.${i+1} · ${s.cost} 魔力</small></b><p>${esc(s.description)}</p></div><em>${learned?'已掌握':'待学习'}</em></article>`;}).join('')}</section>`).join('')}</div>`;break;case 'saves':title='存档与进度';body=`<p>第 ${Math.min((state.week||0)+1,6)} 周 · ${esc(chapterTitle())}</p><p class="save-status">◇ ${esc(syncInfo.message)}</p><div class="save-buttons">${button('保存到本机','save-local','primary')}${button('读取本机存档','load-local')}${button('读取云档','read-cloud')}${button('同步当前进度到云端','save-cloud')}${button('导出存档文件','export')}${button('导入存档文件','import')}</div><p class="muted">进度会自动保存在这台设备上。换设备游玩前，请先同步云档；也可以导出文件备份。</p><input id="import-file" type="file" accept="application/json,.json" hidden>`;break;case 'cloud-confirm':title='选择要继续的进度';body=`<p>云端进度：第 ${Math.min((pendingCloud?.week||0)+1,6)} 周</p><p>${pendingCloud?.savedAt?new Date(pendingCloud.savedAt).toLocaleString('zh-CN'):''}</p><p>本机进度：第 ${Math.min((state.week||0)+1,6)} 周</p><div class="save-buttons">${button('采用云端进度','use-cloud','primary')}${button('保留本机，准备同步','keep-local')}</div>`;break;case 'new-confirm':title='开启另一种可能';body=`<p>当前进度会被新的故事替换，已经收集的结局会保留。可以先在存档菜单导出备份。</p><div class="save-buttons">${button('开始新故事','new-confirm','primary')}${button('继续当前故事','close')}</div>`;break;case 'gallery':title='结局收藏';body=`<div class="gallery-grid">${Object.entries(ENDINGS).map(([id,e])=>`<article class="${unlocked.includes(id)?'unlocked':''}">${unlocked.includes(id)?`<button class="gallery-picture" data-action="visual" data-art="${ENDING_VISUALS[id]}" aria-label="查看${esc(e.title)}插画"><img src="${art(ENDING_VISUALS[id])}" alt="${esc(e.subtitle)}"></button>`:'<span>◇</span>'}<small>结局 0${Object.keys(ENDINGS).indexOf(id)+1}</small><h3>${unlocked.includes(id)?esc(e.title):'尚未解锁'}</h3><p>${unlocked.includes(id)?esc(e.quote):'继续探索，发现另一种结局。'}</p></article>`).join('')}</div>`;break;case 'credits':title='关于《回声之约》';body=`<p>这是一个以霍格沃茨为背景的原创中文同人短篇。洛岚、艾琳·维尔、回声铜钟及本作事件均为原创设定。</p><p>玩法研究参考 Fancy Fish Games 的《Stardander Revenant》：课程成长、双人魔力战斗、逐击护盾与关系选择。本作程序和中文剧情重新编写，插画重新生成，主题音乐《Autiletwing Castle》由创作者提供，使用 Suno 生成；音效由程序合成。</p><p>霍格沃茨与哈利·波特世界相关设定归其原权利人所有。本作非官方作品。</p><a class="source-link" href="https://fancyfishgames.itch.io/stardander-revenant" target="_blank" rel="noopener">体验玩法参考原作 ↗</a>`;break;}
modalRoot.innerHTML=`<div class="modal-backdrop" data-action="backdrop-close"><section class="modal parchment ${modal==='visual'?'visual-modal':''}" role="dialog" aria-modal="true" aria-label="${title}"><header><div><span class="eyebrow dark">THE ECHO PACT</span><h2>${title}</h2></div><button class="close-btn" data-action="close" aria-label="关闭菜单">×</button></header><div class="modal-body">${body}</div></section></div>`;
}
function storeOptions(){localStorage.setItem('echo-pact:options',JSON.stringify(options));}
document.addEventListener('click',async event=>{const t=event.target.closest('[data-action]');if(!t||t.disabled)return;const action=t.dataset.action;if(action==='backdrop-close'&&event.target!==t)return;sound();try{switch(action){case 'title':save();view='title';modal=null;modalRoot.innerHTML='';render();break;case 'continue':state=readLocal()||state;view='game';render();break;case 'new':if(readLocal()?.screen)openModal('new-confirm');else startNew();break;case 'new-confirm':modal=null;modalRoot.innerHTML='';startNew();break;case 'advance':advanceStory();break;case 'visual':{const current=state.screen==='story'?sceneVisual():null,cue=current?.art===t.dataset.art?current:visualByArt(t.dataset.art);if(cue){inspectedVisual=cue;visualParent=modal;openModal('visual');}break;}case 'choose':choose(t.dataset.kind,Number(t.dataset.index));break;case 'course':{const id=t.dataset.id;state.selectedCourses??=[];if(state.selectedCourses.includes(id))state.selectedCourses=state.selectedCourses.filter(x=>x!==id);else if(state.selectedCourses.length<2)state.selectedCourses.push(id);else return toast('这周只能选择两门课，先取消一门再更换。');save();render();break;}case 'study':{const r=study(state,state.selectedCourses);state=r.state;state.lessons=r.lessons;setScreen('lessons');break;}case 'discovery':showStory(week().discovery,'battle',week().bg);break;case 'spell':selectedSpell=t.dataset.id;render();break;case 'actor':if(selectedSpell&&SPELLS[selectedSpell]?.target==='ally')actSpell(t.dataset.id);else{selectedActor=t.dataset.id;selectedSpell=null;render();}break;case 'target':actSpell(t.dataset.id);break;case 'self-cast':actSpell(selectedActor);break;case 'potion':{const before=state.currentBattle,r=usePotion(before,selectedActor);if(!r.ok)toast(r.message);else{state.currentBattle=r.battle;showBattleFeedback(before,r.battle,{kind:'potion',actor:selectedActor,target:selectedActor,label:'复元药剂'});save();render();}break;}case 'end-round':{const before=state.currentBattle,r=endRound(before);if(!r.ok)toast(r.message);else{state.currentBattle=r.battle;showBattleFeedback(before,r.battle,{kind:'enemy',actor:null,target:null,label:before.enemy.intent?.label||'对手行动'});selectedSpell=null;save();render();}break;}case 'retry':beginBattle(state.isFinal);break;case 'battle-continue':finishBattle();break;case 'next-week':if(state.week>=5)finale();else{state.week++;state.isFinal=false;showStory(week().intro,'choice',week().bg);}break;case 'auto':options.auto=!options.auto;storeOptions();render();break;case 'toggle-music':options.music=!options.music;storeOptions();themeMusic.configure(options);render();break;case 'toggle-sound':options.sound=!options.sound;storeOptions();sound('success');renderModal();break;case 'toggle-motion':options.reduceMotion=!options.reduceMotion;storeOptions();render();break;case 'close':case 'backdrop-close':closeModal();break;case 'save-local':save();toast('本机进度已保存。');renderModal();break;case 'load-local':{const saved=readLocal();if(!saved)return toast('还没有可读取的本机进度。');state=saved;view='game';closeModal();toast('已回到保存的位置。');break;}case 'read-cloud':{const cloud=await readCloud();if(!cloud){toast('云端还没有存档，可以同步当前进度。');renderModal();}else{pendingCloud=cloud;modal='cloud-confirm';renderModal();}break;}case 'use-cloud':state=pendingCloud;save();view='game';closeModal();toast('已采用云端进度。');break;case 'keep-local':pendingCloud=null;modal='saves';renderModal();toast('已保留本机进度，可以手动同步。');break;case 'save-cloud':await saveCloud(state);toast('云端同步完成。');renderModal();break;case 'export':{const blob=new Blob([JSON.stringify({...state,version:1,savedAt:Date.now()},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='霍格沃茨-回声之约-存档.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);break;}case 'import':document.querySelector('#import-file').click();break;default:if(['settings','help','history','journal','spells','saves','gallery','credits'].includes(action))openModal(action);}}catch(error){toast(error.message||'这次操作没有完成，请重试。');console.error(error);}});
document.addEventListener('input',event=>{if(event.target.id!=='music-volume')return;options.musicVolume=Number(event.target.value)/100;storeOptions();themeMusic.configure(options);document.querySelector('#music-volume-value').textContent=Math.round(options.musicVolume*100)+'%';});
document.addEventListener('change',async e=>{if(e.target.id!=='import-file')return;const file=e.target.files?.[0];if(!file)return;try{if(file.size>240000)throw new Error('存档文件过大。');const data=JSON.parse(await file.text());const valid=data.version===1&&Number.isInteger(data.week)&&data.week>=0&&data.week<6&&data.stats&&COURSES.every(c=>Number.isInteger(data.courses?.[c.id])&&data.courses[c.id]>=0&&data.courses[c.id]<=3)&&['story','choice','night','planner','lessons','battle','summary','ending'].includes(data.screen);if(!valid)throw new Error('存档格式不兼容。');if(data.screen==='battle'&&(!data.currentBattle?.actors||!data.currentBattle?.enemy))throw new Error('战斗存档不完整。');state=data;save();view='game';closeModal();toast('存档已导入。');}catch(error){toast(error.message||'存档无法读取。');}});
document.addEventListener('keydown',e=>{if(e.code==='Escape'&&modal){closeModal();return;}if(e.code==='Space'&&view==='game'&&state.screen==='story'&&!modal&&!['INPUT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName)){e.preventDefault();advanceStory();}});
window.addEventListener('beforeunload',()=>{if(view==='game')save();});
prepareVisuals();render();connectPlatform().catch(()=>{});
