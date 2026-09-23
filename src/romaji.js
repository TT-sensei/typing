import { ROMAJI } from './data.js?v=20260923-5';

const MAX_VARIANTS = 96;

export function tokenizeKana(text) {
  const result=[];
  for(let i=0;i<text.length;i++) {
    const pair=text.slice(i,i+2);
    if(ROMAJI[pair]) { result.push(pair); i++; }
    else result.push(text[i]);
  }
  return result;
}

function tokenChoices(tokens,i) {
  const token=tokens[i];
  if(token==='っ') {
    const next=ROMAJI[tokens[i+1]]?.accepts || [];
    return [...new Set(next.map(v=>v[0]).filter(Boolean))];
  }
  if(token==='ん') {
    const nextShow=ROMAJI[tokens[i+1]]?.show || '';
    return /^[aiueoy]/.test(nextShow) ? ["n'",'nn'] : ['n','nn'];
  }
  return ROMAJI[token]?.accepts || [];
}

export function displayRomaji(kana) {
  const tokens=tokenizeKana(kana);
  let out='';
  for(let i=0;i<tokens.length;i++) {
    const token=tokens[i];
    if(token==='っ') {
      const next=ROMAJI[tokens[i+1]]?.show || '';
      out += next[0] || '';
    } else {
      out += ROMAJI[token]?.show || '';
    }
  }
  return out;
}

export function acceptedRomaji(kana) {
  const tokens=tokenizeKana(kana);
  let variants=[''];
  for(let i=0;i<tokens.length;i++) {
    const choices=tokenChoices(tokens,i);
    const expanded=[];
    for(const base of variants) {
      for(const choice of choices) {
        expanded.push(base+choice);
        if(expanded.length>=MAX_VARIANTS) break;
      }
      if(expanded.length>=MAX_VARIANTS) break;
    }
    variants=expanded;
  }
  return [...new Set(variants)];
}

function matchesPrefix(tokens,input) {
  function visit(tokenIndex,inputPos) {
    if(inputPos===input.length) return true;
    if(tokenIndex>=tokens.length) return false;

    const rest=input.slice(inputPos);
    for(const choice of tokenChoices(tokens,tokenIndex)) {
      if(choice.startsWith(rest) && rest.length<choice.length) return true;
      if(input.startsWith(choice,inputPos) && visit(tokenIndex+1,inputPos+choice.length)) return true;
    }
    return false;
  }
  return visit(0,0);
}

function matchesComplete(tokens,input) {
  function visit(tokenIndex,inputPos) {
    if(tokenIndex===tokens.length) return inputPos===input.length;
    for(const choice of tokenChoices(tokens,tokenIndex)) {
      if(input.startsWith(choice,inputPos) && visit(tokenIndex+1,inputPos+choice.length)) return true;
    }
    return false;
  }
  return visit(0,0);
}

export function makeQuestion(kana, meta={}) {
  const display=displayRomaji(kana);
  return { id:kana, kana, display, accepts:acceptedRomaji(kana), ...meta };
}

export function typeKey(question, current, key) {
  const next=(current+key).toLowerCase();
  const tokens=tokenizeKana(question.kana);
  if(!matchesPrefix(tokens,next)) return {ok:false, complete:false, value:current};
  return {ok:true, complete:matchesComplete(tokens,next), value:next};
}

export function hintPattern(display) {
  if(display.length<=1) return display;
  return display[0]+' '+Array.from({length:display.length-1},()=>'_').join(' ');
}
