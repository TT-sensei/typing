import test from 'node:test';
import assert from 'node:assert/strict';
import { recordQuestion } from '../src/storage.js';

test('同じ表示ローマ字でも、かなごとに学習記録を分ける', () => {
  const data = { romajiStats: {} };

  recordQuestion(data, { kana: 'じ', display: 'ji' }, false);
  recordQuestion(data, { kana: 'ぢ', display: 'ji' }, true);

  assert.equal(data.romajiStats['じ'].attempts, 1);
  assert.equal(data.romajiStats['じ'].successes, 0);
  assert.equal(data.romajiStats['ぢ'].attempts, 1);
  assert.equal(data.romajiStats['ぢ'].successes, 1);
});

test('旧形式の記録は、同じかなの分だけ引き継ぐ', () => {
  const data = {
    romajiStats: {
      ji: { kana: 'じ', attempts: 2, successes: 1, hints: 0, lastSeen: 1 }
    }
  };

  recordQuestion(data, { kana: 'じ', display: 'ji' }, true);

  assert.equal(data.romajiStats['じ'].attempts, 3);
  assert.equal(data.romajiStats['じ'].successes, 2);
  assert.equal(Object.hasOwn(data.romajiStats, 'ji'), false);
});
