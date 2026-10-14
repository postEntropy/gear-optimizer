import { Factors, Slot } from '../assets/ItemAux';
import { Optimizer } from '../Optimizer';

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

function relevantFactorNames() {
    return Object.keys(Factors).filter((name) => {
        if (EXCLUDED_FACTORS.includes(name)) return false;
        const factor = Factors[name];
        return factor && Array.isArray(factor[1]) && factor[1].length > 0;
    });
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
 *
 * Owned items are ranked on their own merits, regardless of the current zone,
 * titan version, looty or pendant settings. Those settings decide which items
 * the optimizer would equip right now, not which items are worth keeping, and
 * letting them narrow this scan made the report call powerful gear redundant
 * just because it was filtered out of the current optimization.
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
    const ownedSet = new Set(ownedIds);
    const capacities = getSlotCapacities(state);
    const factorNames = relevantFactorNames();

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
                    && Array.isArray(itemdata[id].zone))
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
 * Value of one stat of an item under the optimizer's current priority, in the
 * direction that priority rewards. Missing stats use the same zero/baseline
 * convention as the optimizer's Pareto test, so an item that rolls a stat is
 * never beaten by one that does not roll it at all.
 */
const statValue = (entry, index, exponents) => {
    if (entry.present[index]) return entry.pows[index];
    return exponents === null || exponents[index] > 0 ? 0 : 1;
};

/**
 * Compares two items under the optimizer's current priority: `1` when `major`
 * is at least as good on every stat and strictly better on one, `0` when they
 * are indistinguishable, `-1` when `major` loses on some stat.
 */
const compareUnderPriority = (optimizer, major, minor) => {
    const a = optimizer.statvals(major);
    const b = optimizer.statvals(minor);
    const exponents = optimizer.factors.length > 2 ? optimizer.factors[2] : null;
    let better = false;
    for (let i = 0; i < a.present.length; i++) {
        const av = statValue(a, i, exponents);
        const bv = statValue(b, i, exponents);
        if (av < bv) return -1;
        if (av > bv) better = true;
    }
    return better ? 1 : 0;
};

const beatsEveryPriority = (optimizer, major, minor, factorNames) => {
    let strictlyBetter = false;
    for (let i = 0; i < factorNames.length; i++) {
        optimizer.factors = Factors[factorNames[i]];
        const result = compareUnderPriority(optimizer, major, minor);
        if (result < 0) return false;
        if (result > 0) strictlyBetter = true;
    }
    return strictlyBetter;
};

/**
 * For every owned item, the ids of same-slot items that are strictly better for
 * **every** priority at once. Because those replacements never lose on any
 * stat that any priority rewards, they are safe to recommend: unlike a plain
 * total-stat comparison, an item that is the only source of a stat (or that is
 * optimal for a negative-weight priority such as cap speed) is never called
 * replaceable by something that is worse for that purpose.
 */
export function findSafeDominators(state, ownedIds) {
    const itemdata = state.itemdata || {};
    const factorNames = relevantFactorNames();
    const optimizer = new Optimizer(state);
    const bySlot = new Map();

    ownedIds.forEach((id) => {
        const item = itemdata[id];
        if (!item) return;
        const slotName = item.slot[0];
        if (!bySlot.has(slotName)) bySlot.set(slotName, []);
        bySlot.get(slotName).push(item);
    });

    const dominators = new Map();
    ownedIds.forEach((id) => {
        const item = itemdata[id];
        if (!item) {
            dominators.set(id, []);
            return;
        }
        const safe = [];
        const peers = bySlot.get(item.slot[0]) || [];
        for (let i = 0; i < peers.length; i++) {
            const peer = peers[i];
            if (peer.id === id) continue;
            if (beatsEveryPriority(optimizer, peer, item, factorNames)) safe.push(peer.id);
        }
        dominators.set(id, safe);
    });

    return dominators;
}

/**
 * Pure categorization of owned items against an already computed `usedSet` and
 * the safe-domination map. Returns the items that never show up anywhere
 * (`unused`) and the items that do show up but can be replaced by enough other
 * owned items in the same slot to run out of slots for them (`replaceable`).
 *
 * `capacities` maps a slot name to how many of that slot can be worn at once.
 * `dominators` maps an item id to the same-slot items that beat it for every
 * priority, so a replacement is only ever named when it is genuinely better.
 */
export function categorizeItems({ ownedIds, usedSet, itemdata, zone, capacities = {}, dominators = new Map() }) {
    const unused = [];
    const replaceable = [];

    ownedIds.forEach((id) => {
        const item = itemdata[id];
        if (!item) return;
        const safe = dominators.get(id) || [];
        const capacity = Math.max(1, capacities[item.slot[0]] || 1);
        const redundant = safe.length >= capacity;
        const replacement = redundant
            ? (safe.find((peerId) => usedSet.has(peerId)) ?? safe[0])
            : null;
        const base = {
            id,
            slot: item.slot[0],
            level: item.level,
            zone: item.zone ? item.zone[1] : null,
            disabled: !!item.disable
        };

        if (usedSet.has(id)) {
            if (redundant) {
                replaceable.push({ ...base, bestOwnedId: replacement });
            }
            return;
        }

        unused.push({
            ...base,
            dominatedBy: replacement,
            outdatedZone: typeof base.zone === 'number' && typeof zone === 'number' && base.zone < zone
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
    const dominators = findSafeDominators(state, ownedIds);
    const { unused, replaceable } = categorizeItems({ ownedIds, usedSet, itemdata, zone: state.zone, capacities, dominators });

    report.ownedCount = ownedIds.length;
    report.usedCount = ownedIds.reduce((count, id) => (usedSet.has(id) ? count + 1 : count), 0);
    report.unused = unused;
    report.replaceable = replaceable;
    report.unusedCount = unused.length;
    report.replaceableCount = replaceable.length;
    report.usedIds = Array.from(usedSet);

    return report;
}
