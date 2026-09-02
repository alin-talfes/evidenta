import test from 'node:test';
import assert from 'node:assert/strict';
import { getPath, setPath, valuesEqual, recordCorrection } from '../result-audit.js';

test('setPath supports nested objects and array indexes', () => {
    const value = {};
    setPath(value, 'frunte.tip', 'Lată');
    setPath(value, 'sprancene.0', 'Arcuite');
    assert.equal(getPath(value, 'frunte.tip'), 'Lată');
    assert.deepEqual(value.sprancene, ['Arcuite']);
});

test('correction audit records automatic and manual values', () => {
    const changed = recordCorrection({}, 'nas.tip', 'Rectiliniu', 'Convex', '2026-08-29T00:00:00.000Z');
    assert.deepEqual(changed['nas.tip'], {
        automatic: 'Rectiliniu',
        value: 'Convex',
        changedAt: '2026-08-29T00:00:00.000Z',
    });
    const reverted = recordCorrection(changed, 'nas.tip', 'Rectiliniu', 'Rectiliniu');
    assert.equal(Object.hasOwn(reverted, 'nas.tip'), false);
});

test('valuesEqual compares displayed scalar values consistently', () => {
    assert.equal(valuesEqual(null, ''), true);
    assert.equal(valuesEqual('0.5', 0.5), true);
    assert.equal(valuesEqual('Lată', 'Lată'), true);
    assert.equal(valuesEqual('Lată', 'Mijlocie'), false);
});
