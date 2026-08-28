import { ASSET_BASE, BADGES, CHARACTERS, KANA_RANGES, MODE_INFO, MONSTERS, WORDS } from './data.js';
import { makeQuestion, typeKey } from './romaji.js';
import { Storage, enqueueReview, recordQuestion, reviewSuccess } from './storage.js';
import { AudioSystem } from './audio.js';

const app=document.querySelector('#app');
let data=Storage.load();
const audio=new AudioSystem(data.sound);
let setup={mode:'kana',character:data.selectedCharacter,range:'vowels'};
let game=null;

const escapeHtml=(s)=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const characterById=id=>CHARACTERS.find(c=>c.id===id)||CHARACTERS[0];
const charUrl=(c,state='stand')=> state==='stand' ? `${ASSET_BASE}/${c.stand}` : `${ASSET_BASE}/${state}/${c.action}-${state}.webp`;
const monsterUrl=id=>`${ASSET_BASE}/monsters/${id.endsWith('-evolved')?'zako-evolved':'zako'}/${id}.webp`;

function rangeOptions(mode) {
  if(mode==='kana') return [
    ['vowels','母音（あいうえお）'],['k','か行'],['s','さ行'],['t','た行'],['n','な行'],['h','は行'],['m','ま行'],
    ['y','や行'],['r','ら行'],['w','わ・を'],['voiced','濁音・半濁音'],['contracted','拗音'],['special','促音・「ん」'],['all','ぜんぶ']
  ];
  return [['easy','やさしい'],['normal','ふつう'],['hard','むずかしい'],['all','ぜんぶ']];
}

function renderStart() {
  game?.destroy(); game=null;
  const acquired=new Set(data.badges);
  app.innerHTML=`
    <section class="screen start-screen">
      <div class="start-shell">
        <header class="hero">
          <div class="hero-copy"><p class="eyebrow">NAVI FANTASY</p><h1>ローマ字<br>タイピングバトル</h1><p>見て、打って、覚える。きみの入力が攻撃になる！</p></div>
          <img class="hero-art" src="${ASSET_BASE}/groups/group-fantasy-battle.webp" alt="" aria-hidden="true">
        </header>
        <div class="toolbar">
          <span class="total-record">累計 ${data.totals.totalKeys.toLocaleString()} キー</span>
          <button class="sound-button" id="sound-toggle" aria-pressed="${data.sound}">${data.sound?'🔊 音 ON':'🔇 音 OFF'}</button>
        </div>
        <div class="mode-grid" aria-label="バトルを選ぶ">
          ${Object.entries(MODE_INFO).map(([id,m])=>`<button class="mode-card" data-mode="${id}" aria-pressed="${setup.mode===id}"><span class="mode-label">${m.name}</span><span class="mode-desc">${m.desc}</span><span class="best">BEST ${data.bests[id].score.toLocaleString()}</span></button>`).join('')}
        </div>
        <section class="setup-panel">
          <div class="setup-row">
            <div><span class="section-label">主人公をえらぶ</span><div class="characters">
              ${CHARACTERS.map(c=>`<button class="character" data-character="${c.id}" aria-label="${c.name}・${c.job}" aria-pressed="${setup.character===c.id}"><img src="${charUrl(c)}" alt=""><span>${c.name}｜${c.job}</span></button>`).join('')}
            </div></div>
            <label><span class="section-label">学習する範囲</span><select class="range-select" id="range-select">${rangeOptions(setup.mode).map(([v,l])=>`<option value="${v}" ${setup.range===v?'selected':''}>${l}</option>`).join('')}</select></label>
          </div>
          <button class="start-button" id="start-game">60秒バトル START!</button>
        </section>
        <details class="collection">
          <summary><span>🏅 バッジコレクション</span><span>${acquired.size} / ${BADGES.length}</span></summary>
          <div class="badge-grid">${BADGES.map(b=>{const got=acquired.has(b.id);return `<div class="badge ${got?'':'locked'}" title="${escapeHtml(b.desc)}"><div class="badge-frame">${got?`<img loading="lazy" src="${b.image}" alt="${escapeHtml(b.name)}">`:'<span class="badge-silhouette" aria-hidden="true">?</span>'}</div><span class="badge-name">${got?escapeHtml(b.name):'？？？'}</span></div>`;}).join('')}</div>
        </details>
      </div>
    </section>`;

  app.querySelectorAll('[data-mode]').forEach(btn=>btn.onclick=()=>{
    setup.mode=btn.dataset.mode;
    setup.range=setup.mode==='kana'?'vowels':'easy';
    renderStart();
  });
  app.querySelectorAll('[data-character]').forEach(btn=>btn.onclick=()=>{ setup.character=btn.dataset.character; data.selectedCharacter=setup.character; Storage.save(data); renderStart(); });
  app.querySelector('#range-select').onchange=e=>setup.range=e.target.value;
  app.querySelector('#sound-toggle').onclick=()=>{ data.sound=!data.sound; audio.setEnabled(data.sound); Storage.save(data); renderStart(); };
  app.querySelector('#start-game').onclick=()=>{ audio.ensure(); startGame(); };
}

function questionPool() {
  if(setup.mode==='kana') {
    const keys=setup.range==='all' ? Object.keys(KANA_RANGES).flatMap(k=>KANA_RANGES[k]) : KANA_RANGES[setup.range];
    return [...new Set(keys)].map(k=>makeQuestion(k,{kind:'kana'}));
  }
  return WORDS.filter(w=>setup.range==='all'||w.level===setup.range).map(w=>makeQuestion(w.kana,{kind:'word',level:w.level}));
}

function startGame() {
  const character=characterById(setup.character);
  preloadBattleAssets(character);
  game=new Battle({mode:setup.mode,range:setup.range,character,pool:questionPool()});
  game.render();
  game.countdown();
}

function preloadBattleAssets(character) {
  ['stand','attack','damage','special'].forEach(state=>{const image=new Image();image.decoding='async';image.src=charUrl(character,state);});
  MONSTERS.slice(0,8).forEach(id=>{const image=new Image();image.decoding='async';image.src=monsterUrl(id);});
}

class Battle {
  constructor(config) {
    Object.assign(this,config);
    this.duration=60000; this.hp=5; this.score=0; this.combo=0; this.maxCombo=0; this.correctKeys=0; this.mistypes=0; this.kills=0; this.hints=0; this.hits=0;
    this.usedHint=false; this.hintStage=0; this.typed=''; this.lastQuestion=null; this.learned=[]; this.running=false; this.locked=true; this.newBadges=[];
    this.startedAt=0; this.qStartedAt=0; this.qDuration=0; this.qStartX=0; this.qTargetX=0; this.raf=0; this.timer=0; this.lastVisualFrame=0; this.lastTimePaint=0;
    this.keyHandler=e=>this.onKey(e);
  }
  render() {
    const backgrounds={kana:'training-ground',word:'forest',master:'ruins'};
    app.innerHTML=`<section class="screen battle-screen">
      <header class="hud">
        <div class="hud-stat"><span class="hud-label">HP</span><span id="hp" class="hud-value hp-hearts">♥ ♥ ♥ ♥ ♥</span></div>
        <div class="hud-stat"><span class="hud-label">SCORE</span><span id="score" class="hud-value">0</span></div>
        <div class="hud-stat"><span class="hud-label">COMBO</span><span id="combo" class="hud-value">0</span></div>
        <div class="hud-stat"><span class="hud-label">TIME</span><span id="time" class="hud-value">60.0</span></div>
        <button id="exit" class="exit-button">やめる</button>
      </header>
      <div class="arena" id="arena" style="background-image:url('${ASSET_BASE}/backgrounds/${backgrounds[this.mode]}.webp')">
        <div class="battle-ground" aria-hidden="true"></div>
        <div class="enemy-slot" id="enemy"><img alt="敵モンスター"></div>
        <div class="problem-card" id="problem-card"><span class="mode-chip">${MODE_INFO[this.mode].name}</span><div class="kana" id="kana">準備</div><div class="romaji" id="romaji"></div><div class="input-progress" id="input"></div><div class="hint-note" id="hint"></div></div>
        <div class="player-slot" id="player"><img src="${charUrl(this.character)}" alt="${this.character.name}・${this.character.job}"></div>
        <div class="battle-message countdown" id="message">3</div>
      </div>
    </section>`;
    this.el={arena:app.querySelector('#arena'),enemy:app.querySelector('#enemy'),enemyImg:app.querySelector('#enemy img'),player:app.querySelector('#player'),playerImg:app.querySelector('#player img'),card:app.querySelector('#problem-card'),kana:app.querySelector('#kana'),romaji:app.querySelector('#romaji'),input:app.querySelector('#input'),hint:app.querySelector('#hint'),message:app.querySelector('#message'),hp:app.querySelector('#hp'),score:app.querySelector('#score'),combo:app.querySelector('#combo'),time:app.querySelector('#time')};
    app.querySelector('#exit').onclick=()=>this.finish('END');
    window.addEventListener('keydown',this.keyHandler);
  }
  countdown() {
    let n=3;
    const tick=()=>{
      if(n>0){this.el.message.textContent=n--; audio.tone(360,.08,'sine',.035); this.timer=setTimeout(tick,650);}
      else {this.el.message.textContent='START!'; audio.tone(720,.14,'triangle',.05); this.timer=setTimeout(()=>{this.el.message.remove(); this.el.message=null; this.begin();},500);}
    };
    tick();
  }
  begin(){ this.running=true; this.locked=false; this.startedAt=performance.now(); this.nextQuestion(); this.frame(); }
  chooseQuestion(){
    const due=data.reviewQueue.find(x=>x.dueAt<=this.kills && this.pool.some(q=>q.id===x.id));
    if(due) return this.pool.find(q=>q.id===due.id);
    let choices=this.pool.filter(q=>q.id!==this.lastQuestion?.id);
    if(!choices.length) choices=this.pool;
    return choices[Math.floor(Math.random()*choices.length)];
  }
  nextQuestion(same=false){
    if(!this.running) return;
    if(!same) { this.question=this.chooseQuestion(); this.hintStage=0; this.usedHint=false; }
    this.lastQuestion=this.question; this.typed=''; this.locked=false;
    const evolved=this.kills>0 && this.kills%7===0;
    const candidates=MONSTERS.filter(m=>m.endsWith('-evolved')===evolved);
    this.monster=candidates[Math.floor(Math.random()*candidates.length)] || MONSTERS[0];
    this.el.enemyImg.src=monsterUrl(this.monster); this.el.enemyImg.alt='迫ってくるモンスター';
    this.el.enemy.className='enemy-slot';
    this.el.player.className='player-slot';
    this.el.playerImg.src=charUrl(this.character);
    this.el.kana.textContent=this.question.kana;
    this.el.romaji.textContent=this.mode==='master'?'':this.question.display;
    this.el.hint.textContent='';
    if(same&&this.mode==='master'&&this.hintStage) this.showHint(this.hintStage);
    this.updateInput();
    const arenaRect=this.el.arena.getBoundingClientRect();
    const playerRect=this.el.player.getBoundingClientRect();
    const enemyWidth=this.el.enemy.offsetWidth;
    const length=this.question.display.length;
    this.qStartX=arenaRect.width+55+Math.min(150,length*14);
    this.qTargetX=playerRect.right-arenaRect.left-enemyWidth*.43;
    this.qDuration=Math.max(5500,(this.qStartX-this.qTargetX)/.105);
    this.qStartedAt=performance.now(); this.positionEnemy(0);
  }
  frame(now=performance.now()){
    if(!this.running) return;
    if(now-this.lastVisualFrame<33){this.raf=requestAnimationFrame(t=>this.frame(t));return;}
    this.lastVisualFrame=now;
    const elapsed=now-this.startedAt, left=Math.max(0,this.duration-elapsed);
    if(now-this.lastTimePaint>90){this.el.time.textContent=(left/1000).toFixed(1);this.lastTimePaint=now;}
    if(left<=0){this.finish('TIME UP!');return;}
    if(!this.locked) {
      const p=Math.min(1,(now-this.qStartedAt)/this.qDuration);
      this.positionEnemy(p);
      if(this.mode==='master' && this.hintStage===0 && p>.42) this.showHint(2);
      if(p>=1) this.enemyReached();
    }
    this.raf=requestAnimationFrame(t=>this.frame(t));
  }
  positionEnemy(p){
    const x=this.qStartX+(this.qTargetX-this.qStartX)*p;
    const scale=.72+p*.36;
    this.el.enemy.style.setProperty('--enemy-x',`${x}px`);
    this.el.enemy.style.setProperty('--enemy-scale',scale.toFixed(3));
  }
  showHint(stage){
    if(!this.usedHint) this.hints++;
    this.hintStage=2; this.usedHint=true;
    this.el.romaji.textContent=this.question.display;
    this.el.hint.textContent='ヒント：見ながら最後まで打てば大丈夫！';
  }
  onKey(e){
    if(!this.running||this.locked||e.ctrlKey||e.metaKey||e.altKey||e.isComposing) return;
    if(e.key.length!==1||!/[a-z']/i.test(e.key)) return;
    e.preventDefault();
    const result=typeKey(this.question,this.typed,e.key);
    if(!result.ok){this.mistypes++; audio.miss(); this.el.card.classList.remove('shake'); void this.el.card.offsetWidth; this.el.card.classList.add('shake'); return;}
    this.typed=result.value; this.correctKeys++; audio.key(); this.updateInput();
    if(result.complete) this.completeQuestion();
  }
  updateInput(){
    const reference=this.question?.display||'';
    const remaining=this.mode==='master'?'':reference.slice(Math.min(this.typed.length,reference.length));
    this.el.input.innerHTML=`<span class="typed">${escapeHtml(this.typed)}</span><span class="remaining">${escapeHtml(remaining)}</span>`;
  }
  completeQuestion(){
    this.locked=true; this.combo++; this.maxCombo=Math.max(this.maxCombo,this.combo); this.kills++;
    const multiplier=this.usedHint&&this.mode==='master'?1:Math.min(2,1+this.combo*.1);
    const gained=Math.round(this.typed.length*10*multiplier);
    this.score+=gained; this.el.score.textContent=this.score.toLocaleString(); this.el.combo.textContent=this.combo;
    recordQuestion(data,this.question,true,this.usedHint);
    if(this.question.kana.includes('っ')) data.totals.sokuon++;
    if(/[ゃゅょ]/.test(this.question.kana)) data.totals.youon++;
    const retryCleared=!this.usedHint&&reviewSuccess(data,this.question);
    if(retryCleared){this.learned.unshift(`${this.question.kana}＝${this.question.display}`); this.learned=this.learned.slice(0,3); this.flash('RETRY CLEAR!');}
    this.el.enemy.classList.add('hit');
    const state=this.combo>=10&&this.combo%5===0?'special':'attack';
    this.playerAction(state);
    state==='special'?audio.special():audio.attack(); audio.defeat(); this.floatScore(gained,multiplier);
    const feedbackTime=state==='special'?820:650;
    this.timer=setTimeout(()=>this.nextQuestion(),feedbackTime);
  }
  playerAction(state){
    this.el.playerImg.src=charUrl(this.character,state);
    this.el.player.classList.remove('action','special-action','damage');
    this.el.player.classList.add(state==='damage'?'damage':state==='special'?'special-action':'action');
  }
  floatScore(score,multiplier){
    const el=document.createElement('div'); el.className='float-score'; el.textContent=`+${score}  ×${multiplier.toFixed(1)}`; this.el.arena.append(el); setTimeout(()=>el.remove(),600);
  }
  flash(text){
    const el=document.createElement('div'); el.className='battle-message'; el.textContent=text; this.el.arena.append(el); setTimeout(()=>el.remove(),650);
  }
  enemyReached(){
    this.locked=true; this.hp--; this.hits++; this.combo=0; this.el.combo.textContent='0'; this.el.hp.textContent=Array.from({length:5},(_,i)=>i<this.hp?'♥':'♡').join(' ');
    this.el.enemy.classList.add('attack'); audio.damage(); this.playerAction('damage');
    recordQuestion(data,this.question,false,this.usedHint); enqueueReview(data,this.question,this.kills+3+Math.floor(Math.random()*3));
    if(this.mode==='master') this.showHint(2);
    this.typed=''; this.updateInput();
    if(this.hp<=0){this.timer=setTimeout(()=>this.finish('GAME OVER'),500);return;}
    this.timer=setTimeout(()=>this.nextQuestion(true),480);
  }
  finish(reason){
    if(!this.running && !this.startedAt){ this.destroy(); renderStart(); return; }
    this.running=false; this.locked=true; cancelAnimationFrame(this.raf); clearTimeout(this.timer); window.removeEventListener('keydown',this.keyHandler);
    const total=this.correctKeys+this.mistypes, accuracy=total?Math.round(this.correctKeys/total*100):0;
    const oldBest=data.bests[this.mode]; const isRecord=this.score>oldBest.score;
    data.bests[this.mode]={score:Math.max(oldBest.score,this.score),maxCombo:Math.max(oldBest.maxCombo,this.maxCombo),accuracy:Math.max(oldBest.accuracy,accuracy)};
    data.totals.totalKeys+=this.correctKeys; data.totals.mistypes+=this.mistypes; data.totals.hints+=this.hints;
    if(reason!=='END') {
      data.totals.plays++;
      if(this.hits===0&&this.startedAt) data.totals.noDamage++;
      data.modePlays[this.mode]++;
    }
    if(isRecord) data.totals.records++;
    this.newBadges=awardBadges(); Storage.save(data);
    if(isRecord) audio.record(); else if(this.newBadges.length) audio.badge();
    renderResult({reason,accuracy,isRecord});
  }
  destroy(){ this.running=false; cancelAnimationFrame(this.raf); clearTimeout(this.timer); window.removeEventListener('keydown',this.keyHandler); }
}

function metricValue(b) {
  if(b.metric.startsWith('mode:')) return data.modePlays[b.metric.split(':')[1]]||0;
  if(b.metric==='combo') return Math.max(...Object.values(data.bests).map(x=>x.maxCombo));
  return data.totals[b.metric]||0;
}

function awardBadges(){
  const owned=new Set(data.badges), fresh=[];
  for(const b of BADGES) if(!owned.has(b.id)&&metricValue(b)>=b.need){owned.add(b.id);fresh.push(b);}
  data.badges=[...owned]; return fresh;
}

function renderResult({reason,accuracy,isRecord}) {
  const g=game, badge=g.newBadges[0];
  app.innerHTML=`<section class="screen result-screen"><div class="result-card">
    <p class="eyebrow">${MODE_INFO[g.mode].name}</p><h2 class="result-title">${reason}</h2>
    ${isRecord?'<div class="new-record">NEW RECORD!</div>':''}<div class="score-big">${g.score.toLocaleString()}</div>
    <div class="result-grid">
      <div class="result-stat"><b>BEST SCORE</b><span>${data.bests[g.mode].score.toLocaleString()}</span></div>
      <div class="result-stat"><b>正しく入力</b><span>${g.correctKeys} キー</span></div>
      <div class="result-stat"><b>撃破数</b><span>${g.kills}</span></div>
      <div class="result-stat"><b>最大コンボ</b><span>${g.maxCombo}</span></div>
      <div class="result-stat"><b>ミスタイプ</b><span>${g.mistypes}</span></div>
      <div class="result-stat"><b>ヒント使用</b><span>${g.hints}</span></div>
      <div class="result-stat"><b>正確率</b><span>${accuracy}%</span></div>
    </div>
    ${g.learned.length?`<div class="learned"><b>今回できるようになったローマ字</b><div>${g.learned.map(escapeHtml).join('　')}</div></div>`:''}
    ${badge?`<div class="new-badge"><img src="${badge.image}" alt=""><div><p class="eyebrow">NEW BADGE!</p><strong>${escapeHtml(badge.name)}</strong><div>${g.newBadges.length>1?`ほか ${g.newBadges.length-1}個`:''}</div></div></div>`:''}
    <div class="result-actions"><button class="primary" id="again">もう一回</button><button class="secondary" id="home">スタートへ</button></div>
  </div></section>`;
  app.querySelector('#again').onclick=()=>startGame(); app.querySelector('#home').onclick=()=>renderStart();
}

renderStart();
