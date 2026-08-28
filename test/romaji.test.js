import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptedRomaji, displayRomaji, makeQuestion, typeKey } from '../src/romaji.js';

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
