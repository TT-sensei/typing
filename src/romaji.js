import { ROMAJI } from './data.js';

const MAX_VARIANTS = 96;

function romajiPattern(kana) {
  const tokens=tokenizeKana(kana);
  return tokens.map((token,i)=>{
    if(token==='っ') {
      const next=ROMAJI[tokens[i+1]]?.accepts || [];
      const choices=[...new Set(next.map(v=>v[0]).filter(Boolean))];
      return choices.length ? '(?:'+choices.join('|')+')' : '(?!)';
    }
    if(token==='ん') {
      const nextShow=ROMAJI[tokens[i+1]]?.show || '';
      const choices=/^[aiueoy]/.test(nextShow) ? ["n'",'nn'] : ['n','nn'];
      return '(?:'+choices.join('|')+')';
    }
    const choices=ROMAJI[token]?.accepts || [];
    return choices.length ? '(?:'+choices.join('|')+')' : '(?!)';
  }).join('');
}
export function tokenizeKana(text) {
  const result=[];
  for(let i=0;i<text.length;i++) {
    const pair=text.slice(i,i+2);
    if(ROMAJI[pair]) { result.push(pair); i++; }
    else result.push(text[i]);
  }
  return result;
}

export function displayRomaji(kana) {
  const tokens=tokenizeKana(kana);
  let out='';
  for(let i=0;i<tokens.length;i++) {
    const token=tokens[i];
    if(token==='っ') {
      const next=ROMAJI[tokens[i+1]]?.show || '';
      out += next[0] || '';
    } else out += ROMAJI[token]?.show || '';
  }
  return out;
}

export function acceptedRomaji(kana) {
  const tokens=tokenizeKana(kana);
  let variants=[''];
  for(let i=0;i<tokens.length;i++) {
    const token=tokens[i];
    let choices;
    if(token==='っ') {
      const next=ROMAJI[tokens[i+1]]?.accepts || [];
      choices=[...new Set(next.map(v=>v[0]).filter(Boolean))];
    } else if(token==='ん') {
      const nextShow=ROMAJI[tokens[i+1]]?.show || '';
      choices=/^[aiueoy]/.test(nextShow) ? ["n'",'nn'] : (i===tokens.length-1 ? ['n','nn'] : ['n','nn']);
    } else choices=ROMAJI[token]?.accepts || [];
    const expanded=[];
    for(const base of variants) for(const choice of choices) {
      expanded.push(base+choice);
      if(expanded.length>=MAX_VARIANTS) break;
    }
    variants=expanded;
  }
  return [...new Set(variants)];
}

export function makeQuestion(kana, meta={}) {
  const display=displayRomaji(kana);
  return { id:kana, kana, display, accepts:acceptedRomaji(kana), pattern:romajiPattern(kana), ...meta };
}

export function typeKey(question, current, key) {
  const next=(current+key).toLowerCase();
  const prefixPattern=new RegExp('^(?:'+question.pattern+')');
  const fullPattern=new RegExp('^(?:'+question.pattern+')$');
  if(!prefixPattern.test(next)) return {ok:false, complete:false, value:current};
  return {ok:true, complete:fullPattern.test(next), value:next};
}

export function hintPattern(display) {
  if(display.length<=1) return display;
  return display[0]+' '+Array.from({length:display.length-1},()=>'_').join(' ');
}
