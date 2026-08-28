const KEY='romajiTypingBattle.v1';

const defaults=()=>({
  schemaVersion:1,
  selectedCharacter:'sora', sound:true,
  bests:{kana:{score:0,maxCombo:0,accuracy:0},word:{score:0,maxCombo:0,accuracy:0},master:{score:0,maxCombo:0,accuracy:0}},
  totals:{plays:0,totalKeys:0,mistypes:0,hints:0,retryClear:0,sokuon:0,youon:0,records:0,noDamage:0},
  modePlays:{kana:0,word:0,master:0},
  romajiStats:{}, reviewQueue:[], mastered:{}, badges:[]
});

function merge(saved) {
  const base=defaults();
  return {...base,...saved,bests:{...base.bests,...saved?.bests},totals:{...base.totals,...saved?.totals},modePlays:{...base.modePlays,...saved?.modePlays}};
}

export const Storage={
  load(){
    try { return merge(JSON.parse(localStorage.getItem(KEY))); }
    catch { return defaults(); }
  },
  save(data){ localStorage.setItem(KEY,JSON.stringify(data)); },
  reset(){ localStorage.removeItem(KEY); return defaults(); }
};

export function recordQuestion(data, q, success, usedHint=false) {
  const key=q.display;
  const stat=data.romajiStats[key] || {attempts:0,successes:0,hints:0,lastSeen:0};
  stat.attempts++;
  if(success) stat.successes++;
  if(usedHint) stat.hints++;
  stat.lastSeen=Date.now();
  data.romajiStats[key]=stat;
}

export function enqueueReview(data, q, dueAt) {
  const old=data.reviewQueue.find(x=>x.id===q.id);
  if(old) { old.dueAt=Math.min(old.dueAt,dueAt); old.needs=2; }
  else data.reviewQueue.push({id:q.id,kana:q.kana,dueAt,needs:2});
}

export function reviewSuccess(data, q) {
  const item=data.reviewQueue.find(x=>x.id===q.id);
  if(!item) return false;
  item.needs--;
  if(item.needs<=0) {
    data.reviewQueue=data.reviewQueue.filter(x=>x!==item);
    data.mastered[q.display]=true;
    data.totals.retryClear++;
    return true;
  }
  item.dueAt+=4;
  return false;
}
