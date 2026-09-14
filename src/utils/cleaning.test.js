import { describe, it, expect } from 'vitest';
import { dominates, categorizeItems, getOwnedIds, getSlotCapacities, buildCleaningReport } from './cleaning';
import { ITEMLIST } from '../assets/Items';
import { ItemContainer, ItemNameContainer } from '../assets/ItemAux';

const STATS = ['Power', 'Energy Cap'];

const makeItem = (overrides) => ({
    id: 1,
    name: 'Item',
    slot: ['head', 1],
    zone: ['Forest', 4],
    level: 100,
    disable: false,
    statnames: [...STATS],
    Power: 1,
    'Energy Cap': 1,
    ...overrides
});

const toItemData = (items) => items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
}, {});

describe('dominates', () => {
    it('returns true when b is at least equal everywhere and strictly better somewhere', () => {
        const a = { Power: 10, 'Energy Cap': 5 };
        const b = { Power: 12, 'Energy Cap': 5 };
        expect(dominates(a, b, STATS)).toBe(true);
    });

    it('returns false when the items are identical', () => {
        const a = { Power: 10, 'Energy Cap': 5 };
        expect(dominates(a, { ...a }, STATS)).toBe(false);
    });

    it('returns false when b is worse on any single stat', () => {
        const a = { Power: 10, 'Energy Cap': 5 };
        const b = { Power: 12, 'Energy Cap': 4 };
        expect(dominates(a, b, STATS)).toBe(false);
    });

    it('ignores stats missing or NaN on either side', () => {
        const a = { Power: 10, 'Energy Cap': NaN };
        const b = { Power: 10, 'Energy Cap': 99 };
        expect(dominates(a, b, STATS)).toBe(false);
        expect(dominates({ Power: 10 }, { Power: 20 }, STATS)).toBe(true);
    });

    it('handles negative stats without breaking', () => {
        const a = { Power: -5 };
        const b = { Power: -2 };
        expect(dominates(a, b, ['Power'])).toBe(true);
    });
});

describe('getOwnedIds', () => {
    it('drops empty slots, internal ids and ids missing from itemdata', () => {
        const itemdata = toItemData([
            makeItem({ id: 1 }),
            makeItem({ id: 2, empty: true }),
            makeItem({ id: 10001 }),
            makeItem({ id: 3 })
        ]);
        const state = { itemdata, ownedItemIds: [1, 2, 3, 10001, 999] };
        expect(getOwnedIds(state)).toEqual([1, 3]);
    });
});

describe('categorizeItems', () => {
    it('keeps used items out of the unused list', () => {
        const item = makeItem({ id: 1 });
        const result = categorizeItems({
            ownedIds: [1],
            usedSet: new Set([1]),
            itemdata: toItemData([item]),
            zone: 4,
            stats: STATS
        });
        expect(result.unused).toHaveLength(0);
        expect(result.replaceable).toHaveLength(0);
    });

    it('marks a never optimal item as unused with no dominator', () => {
        const item = makeItem({ id: 1, Power: 5 });
        const result = categorizeItems({
            ownedIds: [1],
            usedSet: new Set(),
            itemdata: toItemData([item]),
            zone: 4,
            stats: STATS
        });
        expect(result.unused).toEqual([
            expect.objectContaining({ id: 1, slot: 'head', dominatedBy: null, outdatedZone: false })
        ]);
    });

    it('flags outdated zone when the item is below the current zone', () => {
        const item = makeItem({ id: 1, zone: ['Sewers', 3] });
        const result = categorizeItems({
            ownedIds: [1],
            usedSet: new Set(),
            itemdata: toItemData([item]),
            zone: 24,
            stats: STATS
        });
        expect(result.unused[0].outdatedZone).toBe(true);
    });

    it('points dominatedBy at the best owned item in the same slot, preferring a used one', () => {
        const weak = makeItem({ id: 1, Power: 1 });
        const weakUnused = makeItem({ id: 2, Power: 2 });
        const strongUsed = makeItem({ id: 3, Power: 3 });
        const result = categorizeItems({
            ownedIds: [1, 2, 3],
            usedSet: new Set([3]),
            itemdata: toItemData([weak, weakUnused, strongUsed]),
            zone: 4,
            stats: STATS
        });
        const dominated = result.unused.find((entry) => entry.id === 1);
        expect(dominated.dominatedBy).toBe(3);
    });

    it('never compares items across different slots', () => {
        const accessory = makeItem({ id: 1, slot: ['accessory', 5], Power: 1 });
        const helmet = makeItem({ id: 2, slot: ['head', 1], Power: 99 });
        const result = categorizeItems({
            ownedIds: [1, 2],
            usedSet: new Set([2]),
            itemdata: toItemData([accessory, helmet]),
            zone: 4,
            stats: STATS
        });
        expect(result.unused[0].dominatedBy).toBe(null);
    });

    it('reports used items that a strictly better owned item could replace', () => {
        const used = makeItem({ id: 1, Power: 1 });
        const better = makeItem({ id: 2, Power: 5 });
        const result = categorizeItems({
            ownedIds: [1, 2],
            usedSet: new Set([1]),
            itemdata: toItemData([used, better]),
            zone: 4,
            stats: STATS
        });
        expect(result.unused).toEqual([
            expect.objectContaining({ id: 2 })
        ]);
        expect(result.replaceable).toEqual([
            expect.objectContaining({ id: 1, bestOwnedId: 2 })
        ]);
    });
});

describe('buildCleaningReport', () => {
    it('asks for a save when no items are owned', () => {
        const report = buildCleaningReport({ ownedItemIds: [], itemdata: {}, zone: 4 });
        expect(report.needsSave).toBe(true);
        expect(report.unused).toEqual([]);
    });

    it('does not mutate the owned ids it receives', () => {
        const ownedItemIds = [];
        buildCleaningReport({ ownedItemIds, itemdata: {}, zone: 4 });
        expect(ownedItemIds).toEqual([]);
    });
});

describe('getSlotCapacities', () => {
    it('gives weapons a second slot only when offhand is enabled', () => {
        expect(getSlotCapacities({ offhand: 0, equip: { accessory: [1, 2] } }).weapon).toBe(1);
        expect(getSlotCapacities({ offhand: 25, equip: { accessory: [1, 2] } }).weapon).toBe(2);
    });

    it('scales accessories with the accessory slot count', () => {
        expect(getSlotCapacities({ offhand: 0, equip: { accessory: [1, 2, 3] } }).accessory).toBe(3);
    });
});

describe('categorizeItems with dual wield', () => {
    const weak = makeItem({ id: 1, slot: ['weapon', 0], Power: 1, 'Energy Cap': 1 });
    const strong = makeItem({ id: 2, slot: ['weapon', 0], Power: 5, 'Energy Cap': 5 });
    const itemdata = toItemData([weak, strong]);

    it('flags the worse weapon when only one weapon can be worn', () => {
        const result = categorizeItems({
            ownedIds: [1, 2],
            usedSet: new Set([2]),
            itemdata,
            zone: 4,
            stats: STATS,
            capacities: { weapon: 1 }
        });
        expect(result.unused[0]).toEqual(expect.objectContaining({ id: 1, dominatedBy: 2 }));
    });

    it('keeps the worse weapon when a second weapon slot is available', () => {
        const result = categorizeItems({
            ownedIds: [1, 2],
            usedSet: new Set([2]),
            itemdata,
            zone: 4,
            stats: STATS,
            capacities: { weapon: 2 }
        });
        expect(result.unused[0]).toEqual(expect.objectContaining({ id: 1, dominatedBy: null }));
    });
});

describe('buildCleaningReport against the real item catalog', () => {
    const itemdata = new ItemContainer(ITEMLIST.map((item) => [item.id, item]));
    const allIds = ITEMLIST.filter((item) => !item.empty && item.id < 10000).map((item) => item.id);

    const buildState = (ownedItemIds) => ({
        itemdata,
        items: allIds,
        ownedItemIds,
        equip: ItemNameContainer(2, 0),
        savedequip: [ItemNameContainer(2, 0)],
        locked: {},
        factors: ['POWER', 'NONE'],
        maxslots: [Infinity, Infinity],
        cubestats: { tier: 0, power: 0, toughness: 0 },
        basestats: {},
        capstats: {},
        zone: 40,
        titanversion: 4,
        looty: 10,
        pendant: 10,
        offhand: 0,
        ignoreDisabled: false
    });

    it('runs the optimizer against every priority and keeps the counts consistent', () => {
        const ownedItemIds = allIds.slice(0, 400);
        const report = buildCleaningReport(buildState(ownedItemIds));

        expect(report.needsSave).toBe(false);
        expect(report.ownedCount).toBe(ownedItemIds.length);
        expect(report.usedCount + report.unusedCount).toBe(report.ownedCount);
        expect(report.replaceableCount).toBeLessThanOrEqual(report.usedCount);
        expect(report.unused).toHaveLength(report.unusedCount);
        expect(report.unused.every((entry) => entry.slot !== 'other')).toBe(true);
    });

    it('reports progress once per priority and finishes at 100%', () => {
        const calls = [];
        const ownedItemIds = allIds.slice(0, 400);
        buildCleaningReport(buildState(ownedItemIds), (completed, total, label) => {
            calls.push({ completed, total, label });
        });

        expect(calls.length).toBeGreaterThan(1);
        expect(calls[0]).toEqual({ completed: 0, total: calls[0].total, label: null });

        const total = calls[0].total;
        expect(calls.every((call) => call.total === total)).toBe(true);
        expect(calls[calls.length - 1].completed).toBe(total);
        expect(calls[calls.length - 1].label).toEqual(expect.any(String));
        expect(calls.map((call) => call.completed)).toEqual([...calls].sort((a, b) => a.completed - b.completed).map((call) => call.completed));
    });

    it('ignores unexpected keys in equip and still counts equipped items', () => {
        const weapon = ITEMLIST.find((item) => !item.empty && item.id < 10000 && item.slot[0] === 'weapon');
        const ownedItemIds = allIds.slice(0, 400);
        if (!ownedItemIds.includes(weapon.id)) ownedItemIds.push(weapon.id);

        const state = buildState(ownedItemIds);
        state.equip = { ...state.equip, weapon: [weapon.id], counts: {}, names: ['junk'] };

        const report = buildCleaningReport(state);
        expect(report.usedIds).toContain(weapon.id);
    });

    it('only adds usable weapons when offhand is enabled, never drops any', () => {
        const ownedItemIds = allIds.slice(0, 400);
        const usedWeapons = (report) => new Set(ownedItemIds.filter((id) => (
            itemdata[id] && itemdata[id].slot[0] === 'weapon' && report.usedIds.includes(id)
        )));

        const single = usedWeapons(buildCleaningReport(buildState(ownedItemIds)));
        const dual = usedWeapons(buildCleaningReport({ ...buildState(ownedItemIds), offhand: 25 }));

        expect(dual.size).toBeGreaterThan(single.size);
        single.forEach((id) => expect(dual.has(id)).toBe(true));
    });
});
