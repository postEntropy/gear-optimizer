import { describe, it, expect } from 'vitest';
import { categorizeItems, getOwnedIds, getSlotCapacities, findSafeDominators, buildCleaningReport } from './cleaning';
import { ITEMLIST, LOOTIES, PENDANTS } from '../assets/Items';
import { ItemContainer, ItemNameContainer } from '../assets/ItemAux';

const makeItem = (overrides) => ({
    id: 1,
    name: 'Item',
    slot: ['head', 1],
    zone: ['Forest', 4],
    level: 100,
    disable: false,
    statnames: ['Power', 'Energy Cap'],
    Power: 1,
    'Energy Cap': 1,
    ...overrides
});

const toItemData = (items) => items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
}, {});

const withDominators = (entries) => new Map(entries);

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
            zone: 4
        });
        expect(result.unused).toHaveLength(0);
        expect(result.replaceable).toHaveLength(0);
    });

    it('marks a never optimal item as unused with no dominator', () => {
        const item = makeItem({ id: 1 });
        const result = categorizeItems({
            ownedIds: [1],
            usedSet: new Set(),
            itemdata: toItemData([item]),
            zone: 4
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
            zone: 24
        });
        expect(result.unused[0].outdatedZone).toBe(true);
    });

    it('points dominatedBy at the safe dominator, preferring one that is in use', () => {
        const weak = makeItem({ id: 1 });
        const weakUnused = makeItem({ id: 2 });
        const strongUsed = makeItem({ id: 3 });
        const result = categorizeItems({
            ownedIds: [1, 2, 3],
            usedSet: new Set([3]),
            itemdata: toItemData([weak, weakUnused, strongUsed]),
            zone: 4,
            dominators: withDominators([[1, [2, 3]], [2, [3]], [3, []]])
        });
        const dominated = result.unused.find((entry) => entry.id === 1);
        expect(dominated.dominatedBy).toBe(3);
    });

    it('reports used items with enough better owned items as replaceable', () => {
        const used = makeItem({ id: 1 });
        const better = makeItem({ id: 2 });
        const result = categorizeItems({
            ownedIds: [1, 2],
            usedSet: new Set([1]),
            itemdata: toItemData([used, better]),
            zone: 4,
            dominators: withDominators([[1, [2]], [2, []]])
        });
        expect(result.unused).toEqual([
            expect.objectContaining({ id: 2 })
        ]);
        expect(result.replaceable).toEqual([
            expect.objectContaining({ id: 1, bestOwnedId: 2 })
        ]);
    });
});

describe('categorizeItems with dual wield', () => {
    const itemdata = toItemData([
        makeItem({ id: 1, slot: ['weapon', 0] }),
        makeItem({ id: 2, slot: ['weapon', 0] })
    ]);
    const dominators = withDominators([[1, [2]], [2, []]]);

    it('flags the worse weapon when only one weapon can be worn', () => {
        const result = categorizeItems({
            ownedIds: [1, 2],
            usedSet: new Set([2]),
            itemdata,
            zone: 4,
            dominators,
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
            dominators,
            capacities: { weapon: 2 }
        });
        expect(result.unused[0]).toEqual(expect.objectContaining({ id: 1, dominatedBy: null }));
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

const itemdata = new ItemContainer(ITEMLIST.map((item) => [item.id, item]));
const allIds = ITEMLIST.filter((item) => !item.empty && item.id < 10000).map((item) => item.id);
const byName = (name) => ITEMLIST.find((item) => item.name === name);

const buildState = (ownedItemIds = allIds, overrides = {}) => ({
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
    looty: LOOTIES.length - 1,
    pendant: PENDANTS.length - 1,
    offhand: 0,
    ignoreDisabled: false,
    ...overrides
});

describe('findSafeDominators', () => {
    it('never compares items across different slots', () => {
        const helmet = byName('Magitech Helmet');
        const accessory = byName('Magitech Amulet');
        const owned = [helmet.id, accessory.id];
        const dominators = findSafeDominators(buildState(owned), owned);
        expect(dominators.get(helmet.id)).not.toContain(accessory.id);
        expect(dominators.get(accessory.id)).not.toContain(helmet.id);
    });

    it('never lets an item that lacks a stat beat the only item that rolls it', () => {
        // Crappy Boots rolls Energy Speed; Limburger Boots does not.
        const crappy = byName('Crappy Boots');
        const limburger = byName('Limburger Boots');
        const owned = [crappy.id, limburger.id];
        const dominators = findSafeDominators(buildState(owned), owned);
        expect(dominators.get(crappy.id)).not.toContain(limburger.id);
    });

    it('only names same-slot, strictly better items for real pairs', () => {
        const owned = allIds.slice(0, 200);
        const dominators = findSafeDominators(buildState(owned), owned);
        owned.forEach((id) => {
            const safe = dominators.get(id) || [];
            safe.forEach((peerId) => {
                expect(itemdata[peerId].slot[0]).toBe(itemdata[id].slot[0]);
                expect(peerId).not.toBe(id);
            });
        });
    });
});

describe('buildCleaningReport against the real item catalog', () => {
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
        const dual = usedWeapons(buildCleaningReport(buildState(ownedItemIds, { offhand: 25 })));

        expect(dual.size).toBeGreaterThan(single.size);
        single.forEach((id) => expect(dual.has(id)).toBe(true));
    });

    it('does not let the zone, titan version, looty or pendant settings decide what is unused', () => {
        const ownedItemIds = allIds.slice(0, 400);
        const base = buildCleaningReport(buildState(ownedItemIds));
        const narrowed = buildCleaningReport(buildState(ownedItemIds, {
            zone: 10,
            titanversion: 1,
            looty: 0,
            pendant: 0
        }));

        const ids = (report) => report.unused.map((entry) => entry.id).sort((a, b) => a - b);
        expect(ids(narrowed)).toEqual(ids(base));
    });

    it('never names a replacement that is missing a stat the item rolls', () => {
        const ownedItemIds = allIds.slice(0, 400);
        const report = buildCleaningReport(buildState(ownedItemIds));
        report.unused.forEach((entry) => {
            if (entry.dominatedBy == null) return;
            const itemStats = new Set(itemdata[entry.id].statnames || []);
            const dominatorStats = new Set(itemdata[entry.dominatedBy].statnames || []);
            itemStats.forEach((stat) => expect(dominatorStats.has(stat)).toBe(true));
        });
    });
});
