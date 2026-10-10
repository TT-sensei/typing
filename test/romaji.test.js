import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptedRomaji, displayRomaji, makeQuestion, typeKey } from '../src/romaji.js';
import { KANA_RANGES, WORDS } from '../src/data.js';
import { SENTENCES } from '../src/sentence-data.js';

test('新しい本表の表示形を使う',()=>{
  assert.equal(displayRomaji('しちふじつ'), 'shichifujitsu');
  assert.equal(displayRomaji('きょうしつ'), 'kyoushitsu');
});

test('従来式・PC入力の別つづりも受理する',()=>{
  const variants=acceptedRomaji('し');
  assert.ok(variants.includes('shi'));
  assert.ok(variants.includes('si'));
});

test('促音は次の子音字を重ねる',()=>{
  assert.equal(displayRomaji('きって'), 'kitte');
  assert.equal(displayRomaji('ざっし'), 'zasshi');
  assert.ok(acceptedRomaji('ざっし').includes('zassi'));
});

test('Enterなしで完成した瞬間に判定する',()=>{
  const q=makeQuestion('でんしゃ');
  let typed='';
  for(const key of 'densha') {
    const result=typeKey(q,typed,key);
    assert.equal(result.ok,true);
    typed=result.value;
  }
  assert.equal(typed,'densha');
  assert.equal(typeKey(q,'densh','a').complete,true);
});

test('ミスタイプは現在の入力を壊さない',()=>{
  const q=makeQuestion('ねこ');
  assert.deepEqual(typeKey(q,'ne','x'),{ok:false,complete:false,value:'ne'});
});


test('長音符はハイフンと母音の両方を受け付ける',()=>{
  assert.equal(displayRomaji('かれー'),'kare-');
  assert.ok(acceptedRomaji('かれー').includes('kare-'));
  assert.ok(acceptedRomaji('かれー').includes('karee'));
});

test('すべての出題データで表示ローマ字をそのまま入力できる',()=>{
  const kanas=new Set([
    ...Object.values(KANA_RANGES).flat(),
    ...WORDS.map(item=>item.kana),
    ...SENTENCES.map(item=>item.kana)
  ]);
  for(const kana of kanas) {
    const question=makeQuestion(kana);
    let typed='';
    for(const key of question.display) {
      const result=typeKey(question,typed,key);
      assert.equal(result.ok,true,\`入力できない表示：\${kana} / \${typed+key}\`);
      typed=result.value;
    }
    assert.ok(question.accepts.length>0,\`入力候補がない：\${kana}\`);
    assert.equal(typeKey(question,typed,'').complete,true,\`最後まで完成しない：\${kana}\`);
  }
});
