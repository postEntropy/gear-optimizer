import { Factors, Slot } from '../assets/ItemAux';
import { Optimizer } from '../Optimizer';
import { allowed_zone, get_limits } from '../util';

const EXCLUDED_FACTORS = ['NONE', 'DELETE', 'INSERT'];

const SLOT_NAMES = Object.getOwnPropertyNames(Slot)
    .map((key) => Slot[key][0])
    .filter((name) => name !== 'other');

/**
 * How many items of a given slot can be worn at the same time. Weapons get a
 * second slot when offhand is enabled, and accessories scale with the number of
 * accessory slots, so an item is only redundant once more items beat it than
 * there are slots to wear them in.
 */
export function getSlotCapacities(state) {
    const capacities = {};
    SLOT_NAMES.forEach((slotName) => {
        capacities[slotName] = 1;
    });

    if (state.offhand > 0) {
        capacities.weapon = 2;
    }

    const accessorySlots = state.equip && Array.isArray(state.equip.accessory)
        ? state.equip.accessory.length
        : 0;
    if (accessorySlots > 0) {
        capacities.accessory = accessorySlots;
    }

    return capacities;
}

export const RELEVANT_STATS = (() => {
    const stats = new Set();
    Object.keys(Factors).forEach((key) => {
        if (EXCLUDED_FACTORS.includes(key)) return;
        const factor = Factors[key];
        if (!factor || !Array.isArray(factor[1])) return;
        factor[1].forEach((stat) => stats.add(stat));
    });
    return Array.from(stats);
})();

/**
 * @return {boolean} true when item `b` is at least as good as item `a` on every
 * relevant stat and strictly better on at least one. Stats missing or NaN on
 * either side are ignored so items that do not roll a stat are still comparable.
 */
export function dominates(a, b, stats = RELEVANT_STATS) {
    let strictlyBetter = false;
    for (let i = 0; i < stats.length; i++) {
        const av = a[stats[i]];
        const bv = b[stats[i]];
        if (av === undefined || bv === undefined || Number.isNaN(av) || Number.isNaN(bv)) continue;
        if (bv < av) return false;
        if (bv > av) strictlyBetter = true;
    }
    return strictlyBetter;
}

/**
 * @return {number[]} ids of items the user actually owns, excluding empty slots
 * and the internal cube/base items (id >= 10000).
 */
export function getOwnedIds(state) {
    const itemdata = state.itemdata || {};
    return (state.ownedItemIds || []).filter((id) => {
        const item = itemdata[id];
        return item && !item.empty && id < 10000;
    });
}

/**
 * Every id that is worth keeping: equipped items, items stored in saved
 * loadouts, and every owned item sitting on the Pareto frontier of any
 * priority in the game.
 */
export function computeUsedSet(state, ownedIds, onProgress) {
    const itemdata = state.itemdata || {};
    const used = new Set();

    SLOT_NAMES.forEach((slotName) => {
        const ids = (state.equip || {})[slotName];
        if (!Array.isArray(ids)) return;
        ids.forEach((id) => {
            if (id < 10000 && itemdata[id]) used.add(id);
        });
    });

    (state.savedequip || []).forEach((save) => {
        SLOT_NAMES.forEach((slotName) => {
            const ids = save[slotName];
            if (!Array.isArray(ids)) return;
            ids.forEach((id) => {
                if (typeof id === 'number' && id < 10000 && itemdata[id]) used.add(id);
            });
        });
    });

    const optimizer = new Optimizer(state);
    const limits = get_limits(state);
    const ownedSet = new Set(ownedIds);
    const capacities = getSlotCapacities(state);

    const factorNames = Object.keys(Factors).filter((factorName) => {
        if (EXCLUDED_FACTORS.includes(factorName)) return false;
        const factor = Factors[factorName];
        return factor && Array.isArray(factor[1]) && factor[1].length > 0;
    });

    if (onProgress) onProgress(0, factorNames.length, null);

    factorNames.forEach((factorName, index) => {
        optimizer.factors = Factors[factorName];

        Object.keys(Slot).forEach((slotKey) => {
            const slotName = Slot[slotKey][0];
            if (slotName === 'other') return;

            const itemsInSlot = ownedIds
                .filter((id) => itemdata[id]
                    && !itemdata[id].disable
                    && itemdata[id].slot[0] === slotName
                    && Array.isArray(itemdata[id].zone)
                    && allowed_zone(itemdata, limits, id))
                .map((id) => itemdata[id]);

            if (itemsInSlot.length === 0) return;

            const cutoff = Math.max(1, capacities[slotName] || 1);
            optimizer.pareto(itemsInSlot, cutoff).forEach((item) => {
                if (item && !item.empty && item.id < 10000 && ownedSet.has(item.id)) used.add(item.id);
            });
        });

        if (onProgress) onProgress(index + 1, factorNames.length, Factors[factorName][0]);
    });

    return used;
}

/**
 * Pure categorization of owned items against an already computed `usedSet`.
 * Returns the items that never show up anywhere (`unused`) and the items that
 * do show up but are strictly worse than enough other owned items in the same
 * slot to run out of slots for them (`replaceable`).
 *
 * `capacities` maps a slot name to how many of that slot can be worn at once
 * (weapons get a second slot with offhand, accessories scale with accslots).
 * An item with one better alternative in a two-slot category is still usable
 * alongside it, so it is not flagged.
 */
export function categorizeItems({ ownedIds, usedSet, itemdata, zone, stats = RELEVANT_STATS, capacities = {} }) {
    const bySlot = new Map();
    ownedIds.forEach((id) => {
        const item = itemdata[id];
        if (!item) return;
        const slotName = item.slot[0];
        if (!bySlot.has(slotName)) bySlot.set(slotName, []);
        bySlot.get(slotName).push(item);
    });

    const findDominators = (item) => {
        const peers = bySlot.get(item.slot[0]) || [];
        const dominators = [];
        for (let i = 0; i < peers.length; i++) {
            const peer = peers[i];
            if (peer.id === item.id) continue;
            if (dominates(item, peer, stats)) dominators.push(peer.id);
        }
        return dominators;
    };

    const unused = [];
    const replaceable = [];

    ownedIds.forEach((id) => {
        const item = itemdata[id];
        if (!item) return;
        const zoneId = item.zone ? item.zone[1] : null;
        const capacity = Math.max(1, capacities[item.slot[0]] || 1);
        const dominators = findDominators(item);
        const redundant = dominators.length >= capacity;
        const dominatedBy = redundant
            ? (dominators.find((peerId) => usedSet.has(peerId)) ?? dominators[0])
            : null;
        const base = {
            id,
            slot: item.slot[0],
            level: item.level,
            zone: zoneId,
            disabled: !!item.disable
        };

        if (usedSet.has(id)) {
            if (dominatedBy !== null) {
                replaceable.push({ ...base, bestOwnedId: dominatedBy });
            }
            return;
        }

        unused.push({
            ...base,
            dominatedBy,
            outdatedZone: typeof zoneId === 'number' && typeof zone === 'number' && zoneId < zone
        });
    });

    return { unused, replaceable };
}

export function buildCleaningReport(state, onProgress) {
    const report = {
        needsSave: false,
        generatedAt: Date.now(),
        zone: state.zone,
        ownedCount: 0,
        usedCount: 0,
        unusedCount: 0,
        replaceableCount: 0,
        unused: [],
        replaceable: [],
        usedIds: []
    };

    if ((state.ownedItemIds || []).length === 0) {
        report.needsSave = true;
        return report;
    }

    const itemdata = state.itemdata || {};
    const ownedIds = getOwnedIds(state);
    const capacities = getSlotCapacities(state);
    const usedSet = computeUsedSet(state, ownedIds, onProgress);
    const { unused, replaceable } = categorizeItems({ ownedIds, usedSet, itemdata, zone: state.zone, capacities });

    report.ownedCount = ownedIds.length;
    report.usedCount = ownedIds.reduce((count, id) => (usedSet.has(id) ? count + 1 : count), 0);
    report.unused = unused;
    report.replaceable = replaceable;
    report.unusedCount = unused.length;
    report.replaceableCount = replaceable.length;
    report.usedIds = Array.from(usedSet);

    return report;
}
