import { ASSET_BASE, BADGES, CHARACTERS, KANA_RANGES, MODE_INFO, WORDS } from './data.js';
import { BATTLE_BACKGROUNDS, MONSTER_POOLS } from './monster-data.js';
import { makeQuestion, typeKey } from './romaji.js';
import { Storage, enqueueReview, recordQuestion, reviewSuccess } from './storage.js';
import { AudioSystem } from './audio.js';

const app=document.querySelector('#app');
let data=Storage.load();
const audio=new AudioSystem(data.sound);
let setup={mode:'kana',character:data.selectedCharacter,range:'vowels'};
let game=null;
let lastBackground='';

const escapeHtml=(s)=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const characterById=id=>CHARACTERS.find(c=>c.id===id)||CHARACTERS[0];
const charUrl=(c,state='stand')=> state==='stand' ? `${ASSET_BASE}/${c.stand}` : `${ASSET_BASE}/${state}/${c.action}-${state}.webp`;
const monsterUrl=monster=>`${ASSET_BASE}/monsters/${monster.category==='evolved'?'zako-evolved':monster.category}/${monster.id}.webp`;

function rangeOptions(mode) {
  if(mode==='kana') return [
    ['vowels','母音（あいうえお）｜練習'],['kToN','か行〜な行'],['hToW','は行〜わ行'],
    ['voiced','濁音・半濁音（点と丸）'],['small','小さい「や・ゆ・よ」／「っ」／「ん」'],['all','ぜんぶ']
  ];
  return [['easy','やさしい'],['normal','ふつう'],['hard','むずかしい'],['all','ぜんぶ']];
}

function renderStart() {
  game?.destroy(); game=null;
  const acquired=new Set(data.badges);
  const training=trainingQuestions();
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
        <section class="training-panel">
          <div class="training-copy">
            <span class="training-icon" aria-hidden="true">⚔️</span>
            <div><span class="section-label">苦手ローマ字特訓</span><strong>${training.fallback?'まずは基礎を練習しよう！':`苦手候補 ${training.weakCount}こ`}</strong><p>${training.fallback?'プレイすると、きみに合った問題へ変わります。':'苦手だった問題を、仲間と何度でも練習できます。'}</p></div>
          </div>
          <button class="training-start" id="start-training">時間無制限で特訓する</button>
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
  app.querySelector('#start-training').onclick=()=>{ audio.ensure(); startTraining(training); };
}

function questionPool() {
  if(setup.mode==='kana') {
    const keys=setup.range==='all' ? Object.keys(KANA_RANGES).flatMap(k=>KANA_RANGES[k]) : KANA_RANGES[setup.range];
    return [...new Set(keys)].map(k=>makeQuestion(k,{kind:'kana'}));
  }
  return WORDS.filter(w=>setup.range==='all'||w.level===setup.range).map(w=>makeQuestion(w.kana,{kind:'word',level:w.level}));
}

function trainingQuestions() {
  const allKana=[...new Set([...Object.values(KANA_RANGES).flat(),...WORDS.map(w=>w.kana)])];
  const all=allKana.map(kana=>makeQuestion(kana,{kind:'training'}));
  const byKana=new Map(all.map(q=>[q.kana,q]));
  const byDisplay=new Map(all.map(q=>[q.display,q]));
  const picked=new Map();

  for(const item of data.reviewQueue) {
    const q=byKana.get(item.kana)||makeQuestion(item.kana,{kind:'training'});
    picked.set(q.id,{q,score:100+(item.needs||0)*10});
  }
  for(const [display,stat] of Object.entries(data.romajiStats)) {
    const attempts=stat.attempts||0;
    if(!attempts) continue;
    const rate=(stat.successes||0)/attempts;
    if(rate>=.85 && !(stat.hints||0)) continue;
    const q=(stat.kana&&byKana.get(stat.kana))||byDisplay.get(display);
    if(!q) continue;
    const score=(1-rate)*80+(stat.hints||0)*8+Math.min(15,attempts);
    const old=picked.get(q.id);
    if(!old||score>old.score) picked.set(q.id,{q,score});
  }

  const weak=[...picked.values()].sort((a,b)=>b.score-a.score).slice(0,20).map(x=>x.q);
  if(weak.length) return {pool:weak,weakCount:weak.length,fallback:false};
  const basics=['し','ち','つ','ふ','じ','しゃ','ちゃ','きって','がっこう','でんしゃ'];
  return {pool:basics.map(kana=>makeQuestion(kana,{kind:'training'})),weakCount:0,fallback:true};
}

function startGame() {
  const character=characterById(setup.character);
  preloadBattleAssets(character);
  game=new Battle({mode:setup.mode,range:setup.range,character,pool:questionPool()});
  game.render();
  game.countdown();
}

function startTraining(selection=trainingQuestions()) {
  const character=characterById(setup.character);
  const partners=CHARACTERS.filter(c=>c.id!==character.id);
  const partner=partners[Math.floor(Math.random()*partners.length)];
  preloadBattleAssets(character);
  preloadBattleAssets(partner);
  game=new Training({character,partner,pool:selection.pool,weakCount:selection.weakCount,fallback:selection.fallback});
  game.render();
}

function preloadBattleAssets(character) {
  ['stand','attack','damage','special'].forEach(state=>{const image=new Image();image.decoding='async';image.src=charUrl(character,state);});
}

function shuffled(items) {
  const result=[...items];
  for(let i=result.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}

class Training {
  constructor(config) {
    Object.assign(this,config);
    this.queue=shuffled(this.pool); this.index=0; this.seen={}; this.question=null; this.typed='';
    this.correctKeys=0; this.mistypes=0; this.clears=0; this.streak=0; this.rescues=0;
    this.guided=false; this.rescued=false; this.questionMisses=0; this.running=true; this.locked=false; this.timer=0;
    this.keyHandler=e=>this.onKey(e);
  }
  render() {
    const background=BATTLE_BACKGROUNDS[Math.floor(Math.random()*BATTLE_BACKGROUNDS.length)]||BATTLE_BACKGROUNDS[0];
    app.innerHTML=`<section class="screen battle-screen training-screen">
      <header class="hud training-hud">
        <div class="hud-stat"><span class="hud-label">MODE</span><span class="hud-value">苦手特訓</span></div>
        <div class="hud-stat"><span class="hud-label">CLEAR</span><span id="training-clears" class="hud-value">0</span></div>
        <div class="hud-stat"><span class="hud-label">れんぞく</span><span id="training-streak" class="hud-value">0</span></div>
        <div class="hud-stat"><span class="hud-label">もんだい</span><span class="hud-value">${this.pool.length}こ</span></div>
      </header>
      <div class="arena training-arena" style="background-image:url('${ASSET_BASE}/backgrounds/${background}.webp')">
        <div class="battle-ground" aria-hidden="true"></div>
        <div class="player-slot training-player" id="training-player"><img src="${charUrl(this.character)}" alt="${this.character.name}・${this.character.job}"></div>
        <div class="training-partner" id="training-partner"><img src="${charUrl(this.partner)}" alt="特訓相手の${this.partner.name}・${this.partner.job}"><span>${this.partner.name}と特訓！</span></div>
        <div class="problem-card training-problem" id="problem-card">
          <span class="mode-chip">時間制限なし</span>
          <div class="kana" id="kana"></div><div class="romaji" id="romaji"></div><div class="input-progress" id="input"></div>
          <div class="hint-note" id="hint"></div>
          <button class="training-stop" id="stop-training">特訓をやめる</button>
        </div>
        <div class="training-message" id="training-message">${this.fallback?'基礎データからスタート！':'苦手をいっしょに克服しよう！'}</div>
      </div>
    </section>`;
    this.el={card:app.querySelector('#problem-card'),kana:app.querySelector('#kana'),romaji:app.querySelector('#romaji'),input:app.querySelector('#input'),hint:app.querySelector('#hint'),clears:app.querySelector('#training-clears'),streak:app.querySelector('#training-streak'),player:app.querySelector('#training-player'),partner:app.querySelector('#training-partner'),message:app.querySelector('#training-message')};
    app.querySelector('#stop-training').onclick=()=>this.stop();
    window.addEventListener('keydown',this.keyHandler);
    this.nextQuestion();
    this.timer=setTimeout(()=>{if(this.el.message)this.el.message.textContent='';},1800);
  }
  nextQuestion() {
    if(!this.running) return;
    if(this.index>=this.queue.length) {this.queue=shuffled(this.pool);this.index=0;}
    this.question=this.queue[this.index++]; this.typed=''; this.questionMisses=0; this.rescued=false; this.locked=false;
    this.guided=!(this.seen[this.question.id]>0); this.seen[this.question.id]=(this.seen[this.question.id]||0)+1;
    this.el.card.classList.remove('shake','training-clear');
    this.el.player.classList.remove('training-cheer'); this.el.partner.classList.remove('training-cheer');
    this.el.kana.textContent=this.question.kana;
    this.el.romaji.textContent=this.guided?this.question.display:'';
    this.el.hint.textContent=this.guided?'まずは見ながら打ってみよう':'思い出して打ってみよう（3回まちがえると答えが出るよ）';
    this.updateInput();
  }
  onKey(e) {
    if(!this.running||this.locked||e.ctrlKey||e.metaKey||e.altKey||e.isComposing) return;
    if(e.key.length!==1||!/[a-z']/i.test(e.key)) return;
    e.preventDefault();
    const result=typeKey(this.question,this.typed,e.key);
    if(!result.ok) {
      this.mistypes++; data.totals.mistypes++; this.questionMisses++; this.streak=0; this.el.streak.textContent='0'; audio.miss();
      this.el.card.classList.remove('shake'); void this.el.card.offsetWidth; this.el.card.classList.add('shake');
      if(!this.guided&&!this.rescued&&this.questionMisses>=3) {
        this.rescued=true; this.rescues++; data.totals.hints++;
        this.el.romaji.textContent=this.question.display; this.el.hint.textContent='答えを見ながら、最後まで自分で打とう！';
      }
      Storage.save(data); return;
    }
    this.typed=result.value; this.correctKeys++; data.totals.totalKeys++; audio.key(); this.updateInput(); Storage.save(data);
    if(result.complete) this.completeQuestion();
  }
  updateInput() {
    const showRemaining=this.guided||this.rescued;
    const remaining=showRemaining?this.question.display.slice(Math.min(this.typed.length,this.question.display.length)):'';
    this.el.input.innerHTML=`<span class="typed">${escapeHtml(this.typed)}</span><span class="remaining">${escapeHtml(remaining)}</span>`;
  }
  completeQuestion() {
    this.locked=true; this.clears++; this.streak++; this.el.clears.textContent=this.clears; this.el.streak.textContent=this.streak;
    recordQuestion(data,this.question,true,this.rescued);
    if(this.question.kana.includes('っ')) data.totals.sokuon++;
    if(/[ゃゅょ]/.test(this.question.kana)) data.totals.youon++;
    const retryCleared=!this.guided&&!this.rescued&&reviewSuccess(data,this.question);
    this.el.card.classList.add('training-clear'); this.el.player.classList.add('training-cheer'); this.el.partner.classList.add('training-cheer');
    this.el.hint.textContent=retryCleared?'RETRY CLEAR! 苦手をひとつ克服！':this.rescued?'できた！次は答えなしで挑戦！':'NICE!';
    audio.defeat(); Storage.save(data);
    this.timer=setTimeout(()=>this.nextQuestion(),520);
  }
  stop() {
    if(!this.running) return;
    this.running=false; clearTimeout(this.timer); window.removeEventListener('keydown',this.keyHandler);
    awardBadges(); Storage.save(data); renderStart();
  }
  destroy() {this.running=false;clearTimeout(this.timer);window.removeEventListener('keydown',this.keyHandler);}
}

class Battle {
  constructor(config) {
    Object.assign(this,config);
    this.duration=60000; this.hp=5; this.score=0; this.combo=0; this.maxCombo=0; this.correctKeys=0; this.mistypes=0; this.kills=0; this.hints=0; this.hits=0;
    this.usedHint=false; this.hintStage=0; this.typed=''; this.lastQuestion=null; this.learned=[]; this.running=false; this.locked=true; this.newBadges=[];
    this.startedAt=0; this.qStartedAt=0; this.qDuration=0; this.qStartX=0; this.qTargetX=0; this.raf=0; this.timer=0; this.lastVisualFrame=0; this.lastTimePaint=0;
    this.monsterGroup={kana:1,word:2,master:3}[this.mode]; this.lastMonsterId=''; this.monster=null; this.queuedMonster=null;
    this.queueMonster(1);
    this.keyHandler=e=>this.onKey(e);
  }
  render() {
    const choices=BATTLE_BACKGROUNDS.filter(id=>id!==lastBackground);
    const background=choices[Math.floor(Math.random()*choices.length)]||BATTLE_BACKGROUNDS[0];
    lastBackground=background;
    app.innerHTML=`<section class="screen battle-screen">
      <header class="hud">
        <div class="hud-stat"><span class="hud-label">HP</span><span id="hp" class="hud-value hp-hearts">♥ ♥ ♥ ♥ ♥</span></div>
        <div class="hud-stat"><span class="hud-label">SCORE</span><span id="score" class="hud-value">0</span></div>
        <div class="hud-stat"><span class="hud-label">COMBO</span><span id="combo" class="hud-value">0</span></div>
        <div class="hud-stat"><span class="hud-label">TIME</span><span id="time" class="hud-value">60.0</span></div>
        <button id="exit" class="exit-button">やめる</button>
      </header>
      <div class="arena" id="arena" style="background-image:url('${ASSET_BASE}/backgrounds/${background}.webp')">
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
  monsterCategory(encounter){ return encounter%10===0?'boss':encounter%5===0?'evolved':'zako'; }
  pickMonster(encounter){
    const category=this.monsterCategory(encounter);
    const pool=MONSTER_POOLS[this.monsterGroup][category];
    const choices=pool.filter(id=>id!==this.lastMonsterId);
    const ids=choices.length?choices:pool;
    return {id:ids[Math.floor(Math.random()*ids.length)],category};
  }
  preloadMonster(monster){
    const image=new Image(); image.decoding='async'; image.src=monsterUrl(monster);
  }
  queueMonster(encounter){
    this.queuedMonster=this.pickMonster(encounter);
    this.preloadMonster(this.queuedMonster);
  }
  nextQuestion(same=false){
    if(!this.running) return;
    if(!same) {
      this.question=this.chooseQuestion(); this.hintStage=0; this.usedHint=false;
      this.monster=this.queuedMonster||this.pickMonster(this.kills+1);
      this.lastMonsterId=this.monster.id;
      this.queueMonster(this.kills+2);
    }
    this.lastQuestion=this.question; this.typed=''; this.locked=false;
    this.el.enemyImg.src=monsterUrl(this.monster); this.el.enemyImg.alt='迫ってくるモンスター';
    this.el.enemy.className='enemy-slot';
    if(this.monster.category==='evolved') this.el.enemy.classList.add('evolved');
    if(this.monster.category==='boss') this.el.enemy.classList.add('boss');
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
    this.qStartX=arenaRect.width-enemyWidth*1.15;
    this.qTargetX=playerRect.right-arenaRect.left-enemyWidth*.43;
    this.qDuration=Math.min(14000,4800+length*850);
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
    const scales=this.monster?.category==='boss'?[1,1.12]:this.monster?.category==='evolved'?[.9,1.12]:[.72,1.08];
    const scale=scales[0]+p*(scales[1]-scales[0]);
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
    this.slashEffect(state==='special');
    state==='special'?audio.special():audio.attack(); audio.defeat(); this.floatScore(gained,multiplier);
    const feedbackTime=state==='special'?820:650;
    this.timer=setTimeout(()=>this.nextQuestion(),feedbackTime);
  }
  playerAction(state){
    this.el.playerImg.src=charUrl(this.character,state);
    this.el.player.classList.remove('action','special-action','damage');
    this.el.player.classList.add(state==='damage'?'damage':state==='special'?'special-action':'action');
  }
  slashEffect(special=false){
    const arenaRect=this.el.arena.getBoundingClientRect(), enemyRect=this.el.enemy.getBoundingClientRect();
    const el=document.createElement('div');
    el.className=`slash-burst${special?' special':''}`;
    el.style.left=`${enemyRect.left-arenaRect.left+enemyRect.width*.5}px`;
    el.style.top=`${enemyRect.top-arenaRect.top+enemyRect.height*.46}px`;
    el.innerHTML='<span>ザシュッ！</span>';
    this.el.arena.append(el); setTimeout(()=>el.remove(),480);
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
    const ranked=!(this.mode==='kana'&&this.range==='vowels');
    const oldBest=data.bests[this.mode]; const isRecord=ranked&&this.score>oldBest.score;
    if(ranked) data.bests[this.mode]={score:Math.max(oldBest.score,this.score),maxCombo:Math.max(oldBest.maxCombo,this.maxCombo),accuracy:Math.max(oldBest.accuracy,accuracy)};
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
  const g=game, badge=g.newBadges[0], practice=g.mode==='kana'&&g.range==='vowels';
  app.innerHTML=`<section class="screen result-screen"><div class="result-card">
    <p class="eyebrow">${MODE_INFO[g.mode].name}</p><h2 class="result-title">${reason}</h2>
    ${isRecord?'<div class="new-record">NEW RECORD!</div>':''}<div class="score-big">${g.score.toLocaleString()}</div>
    ${practice?'<div class="practice-note">母音は練習モードのため、BEST SCOREには入りません</div>':''}
    <div class="result-grid">
      <div class="result-stat"><b>BEST SCORE</b><span>${practice?'対象外':data.bests[g.mode].score.toLocaleString()}</span></div>
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
