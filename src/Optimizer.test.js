import { describe, it, expect } from 'vitest';
import { ITEMLIST } from './assets/Items';
import { ItemContainer, ItemNameContainer, Equip, EmptySlot, Factors } from './assets/ItemAux';
import { Optimizer } from './Optimizer';

const itemdata = new ItemContainer(ITEMLIST.map((item) => [item.id, item]));
const ownedIds = ITEMLIST.filter((item) => !item.empty && item.id < 10000).map((item) => item.id).slice(0, 90);

const CAPSTATS = {
    'Energy Cap Cap': 9e18, 'Nude Energy Cap': 500,
    'Magic Cap Cap': 9e18, 'Nude Magic Cap': 1e4,
    'Energy Power Cap': 1e18, 'Nude Energy Power': 1,
    'Magic Power Cap': 1e18, 'Nude Magic Power': 1,
    'Energy Bars Cap': 1e18, 'Nude Energy Bars': 1,
    'Magic Bars Cap': 1e18, 'Nude Magic Bars': 1,
    'Resource 3 Power Cap': 1e18, 'Nude Resource 3 Power': 1,
    'Resource 3 Cap Cap': 9e18, 'Nude Resource 3 Cap': 1e4,
    'Resource 3 Bars Cap': 1e18, 'Nude Resource 3 Bars': 1,
    modifiers: false
};

const buildState = (factors) => ({
    itemdata,
    items: ownedIds,
    equip: ItemNameContainer(5, 20),
    locked: {},
    factors,
    maxslots: factors.map(() => Infinity),
    cubestats: { tier: 0, power: 0, toughness: 0 },
    basestats: { power: 0, toughness: 0 },
    capstats: CAPSTATS,
    zone: 40,
    titanversion: 4,
    looty: 20,
    pendant: 20,
    offhand: 20,
    ignoreDisabled: true
});

// The original implementation: mutate the layout, re-score every equipped item.
const legacyReplacementScore = function (layout, idx, alternative) {
    const tmp = layout.accessory[idx];
    layout.accessory[idx] = alternative;
    const scores = this.score_equip_and_raw(layout);
    layout.accessory[idx] = tmp;
    return scores;
};

const runOptimize = (state) => {
    const optimizer = new Optimizer(state);
    let base = optimizer.construct_base(state.locked, state.equip);
    for (let idx = 0; idx < state.factors.length; idx++) {
        base = optimizer.compute_optimal(base, idx);
    }
    const best = base.reduce((a, b) => (optimizer.score_equip(a) >= optimizer.score_equip(b) ? a : b));
    return { score: optimizer.score_equip(best), layout: best };
};

const FACTOR_LISTS = [
    ['POWER', 'NONE'],
    ['NGUSHACK', 'NONE'],
    ['WISHES', 'NONE'],
    ['POWER', 'NGUSHACK', 'WISHES', 'NONE']
];

describe('Optimizer incremental scoring', () => {
    it('matches the legacy full-rescore path for every priority', () => {
        for (const factors of FACTOR_LISTS) {
            const state = buildState(factors);

            const original = Optimizer.prototype.replacement_score;
            Optimizer.prototype.replacement_score = legacyReplacementScore;
            let legacy;
            try {
                legacy = runOptimize(state);
            } finally {
                Optimizer.prototype.replacement_score = original;
            }

            const fast = runOptimize(state);
            expect(fast.layout).toEqual(legacy.layout);
            expect(Number.isFinite(fast.score)).toBe(true);
            expect(fast.score).toBeGreaterThan(0);
        }
    }, 120000);
});

// Straight port of the original O(n^2) Pareto scan, used as the reference for
// the precomputed-entry version.
const paretoReference = (optimizer, list, cutoff) => {
    const dominated = new Array(list.length).fill(false);
    const empty = list[0].slot === undefined ? new Equip() : new EmptySlot(list[0].slot);
    for (let i = list.length - 1; i > -1; i--) {
        if (optimizer.dominates(empty, list[i], !empty.empty)) {
            dominated[i] = cutoff;
        }
        if (dominated[i] === cutoff) continue;
        for (let j = list.length - 1; j > -1; j--) {
            if (dominated[j] === cutoff) continue;
            dominated[j] += optimizer.dominates(list[i], list[j]);
        }
    }
    const result = dominated.map((val, idx) => (val < cutoff ? list[idx] : false)).filter((val) => val !== false);
    return (result.length === 0 ? [empty] : result).map((item) => item.id);
};

describe('Optimizer.pareto', () => {
    const slots = ['weapon', 'head', 'armor', 'accessory'];
    const bySlot = (name) => ITEMLIST.filter((item) => !item.empty && item.id < 10000 && item.slot[0] === name);

    it('keeps exactly the same items as the original pairwise scan', () => {
        for (const factor of ['POWER', 'NGUSHACK', 'WISHES', 'NGUS']) {
            for (const slot of slots) {
                for (const cutoff of [1, 2]) {
                    const optimizer = new Optimizer(buildState([factor, 'NONE']));
                    optimizer.factors = Factors[factor];
                    const list = bySlot(slot);
                    const expected = paretoReference(optimizer, list, cutoff);
                    const actual = optimizer.pareto(list, cutoff).map((item) => item.id);
                    expect(actual).toEqual(expected);
                }
            }
        }
    }, 120000);
});

