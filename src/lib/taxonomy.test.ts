import test from 'node:test';
import assert from 'node:assert';
import { getGradesForBoard, SINDH_GRADES, FBISE_GRADES } from './taxonomy';

test('getGradesForBoard', async (t) => {
  await t.test('returns SINDH_GRADES when boardId is "sindh"', () => {
    assert.strictEqual(getGradesForBoard('sindh'), SINDH_GRADES);
  });

  await t.test('returns FBISE_GRADES when boardId is "fbise"', () => {
    assert.strictEqual(getGradesForBoard('fbise'), FBISE_GRADES);
  });

  await t.test('returns FBISE_GRADES for unknown board string', () => {
    assert.strictEqual(getGradesForBoard('punjab'), FBISE_GRADES);
  });

  await t.test('returns FBISE_GRADES for empty string', () => {
    assert.strictEqual(getGradesForBoard(''), FBISE_GRADES);
  });
});
